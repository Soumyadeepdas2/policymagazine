/**
 * PolicyTells - Admin Portal Controller
 * Manages Supabase Auth, Article CRUD, ImageKit upload integration, and Contact Messages.
 */

(function () {
  'use strict';

  const cfg = window.POLICYTELLS_CONFIG || {};

  // Initialize Supabase Client
  let supabaseClient = null;
  if (
    typeof window.supabase !== 'undefined' &&
    cfg.SUPABASE_URL &&
    cfg.SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
    cfg.SUPABASE_ANON_KEY &&
    cfg.SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY'
  ) {
    try {
      supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    } catch (e) {
      console.warn('Admin: Supabase init error:', e);
    }
  }

  window.PolicyTellsAdmin = {
    supabase: supabaseClient,

    // --- Authentication Helper ---
    checkAuth: async function () {
      if (this.supabase) {
        try {
          const { data: { user }, error } = await this.supabase.auth.getUser();
          if (error || !user) {
            return false;
          }
          return user;
        } catch (e) {
          return false;
        }
      }
      // Demo mode session fallback
      const demoSession = sessionStorage.getItem('pt_demo_admin');
      if (demoSession === 'true') {
        return { email: 'admin@policytells.org' };
      }
      return false;
    },

    requireAuth: async function () {
      const user = await this.checkAuth();
      if (!user) {
        window.location.href = 'login.html';
        return null;
      }
      const userEmailEl = document.getElementById('admin-user-email');
      if (userEmailEl) {
        userEmailEl.textContent = user.email || 'Admin User';
      }
      return user;
    },

    login: async function (email, password) {
      if (this.supabase) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        if (error) throw error;
        return data;
      } else {
        // Demo mode login
        sessionStorage.setItem('pt_demo_admin', 'true');
        return { user: { email: email || 'admin@policytells.org' } };
      }
    },

    logout: async function () {
      if (this.supabase) {
        await this.supabase.auth.signOut();
      }
      sessionStorage.removeItem('pt_demo_admin');
      window.location.href = 'login.html';
    },

    // --- ImageKit Auth & Upload Integration ---
    getImageKitAuthParameters: async function () {
      try {
        const response = await fetch('/api/imagekit-auth');
        if (!response.ok) {
          throw new Error(`Auth endpoint returned HTTP ${response.status}`);
        }
        const data = await response.json();
        return data; // { token, expire, signature }
      } catch (err) {
        console.error('Failed to get ImageKit auth params:', err);
        throw new Error('Could not connect to ImageKit auth serverless function /api/imagekit-auth. Make sure Vercel environment variables are set.');
      }
    },

    uploadImageToImageKit: async function (file) {
      // Validate File Type and Size (Max 5MB)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPG, PNG, and WebP images are allowed.');
      }

      const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
      if (file.size > maxSizeInBytes) {
        throw new Error('File size exceeds the 5 MB maximum limit.');
      }

      const publicKey = cfg.IMAGEKIT_PUBLIC_KEY;
      if (!publicKey || publicKey === 'YOUR_IMAGEKIT_PUBLIC_KEY') {
        throw new Error('IMAGEKIT_PUBLIC_KEY is not configured in environment variables.');
      }

      // Step 1: Get signature, token, expire from Vercel serverless function /api/imagekit-auth
      const authParams = await this.getImageKitAuthParameters();

      // Step 2: Upload directly from browser to ImageKit API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name.replace(/[^a-zA-Z0-9._-]/g, '_'));
      formData.append('publicKey', publicKey);
      formData.append('signature', authParams.signature);
      formData.append('expire', authParams.expire);
      formData.append('token', authParams.token);
      formData.append('folder', '/articles');

      const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errJson = await uploadResponse.json().catch(() => ({}));
        throw new Error(errJson.message || `ImageKit upload failed with status ${uploadResponse.status}`);
      }

      const result = await uploadResponse.json();
      return result.url; // Returns CDN URL
    },

    // --- Admin Dashboard Rendering ---
    initDashboard: async function () {
      const user = await this.requireAuth();
      if (!user) return;

      const articlesTableBody = document.getElementById('articles-table-body');
      const messagesTableBody = document.getElementById('messages-table-body');
      const logoutBtn = document.getElementById('logout-btn');

      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.logout());
      }

      // Load Articles Table
      if (articlesTableBody) {
        await this.renderArticlesTable(articlesTableBody);
      }

      // Load Messages Table
      if (messagesTableBody) {
        await this.renderMessagesTable(messagesTableBody);
      }
    },

    renderArticlesTable: async function (container) {
      container.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:2rem;"><div class="spinner"></div><p style="margin-top:0.5rem;">Loading articles...</p></td></tr>';

      let articles = [];

      if (this.supabase) {
        try {
          const { data, error } = await this.supabase
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) {
            articles = data;
          }
        } catch (e) {
          console.warn('Error querying Supabase articles for admin:', e);
        }
      }

      if (articles.length === 0) {
        // Use local & sample articles
        articles = window.PolicyTellsApp ? window.PolicyTellsApp.getCombinedArticles() : cfg.SAMPLE_ARTICLES;
      }

      if (!articles || articles.length === 0) {
        container.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:2rem;">No articles found. Click "New Article" to create one.</td></tr>';
        return;
      }

      container.innerHTML = articles.map(art => {
        const isPub = Boolean(art.published);
        const isFeat = Boolean(art.featured);
        const dateStr = window.PolicyTellsApp ? window.PolicyTellsApp.formatDate(art.created_at) : new Date(art.created_at).toLocaleDateString();

        return `
          <tr>
            <td>
              <strong style="font-size:0.95rem; display:block;">${this.escapeHTML(art.title)}</strong>
              <span style="font-size:0.75rem; color:var(--color-text-light);">Slug: /article.html?slug=${this.escapeHTML(art.slug || art.id)}</span>
            </td>
            <td><span class="category-badge">${this.escapeHTML(art.category || 'General')}</span></td>
            <td>${this.escapeHTML(art.author || 'Editorial Desk')}</td>
            <td>
              <span class="status-pill ${isPub ? 'published' : 'draft'}">${isPub ? 'Published' : 'Draft'}</span>
              ${isFeat ? '<span class="status-pill featured" style="margin-left:0.2rem;">Featured</span>' : ''}
            </td>
            <td>${dateStr}</td>
            <td>
              <div class="actions-cell">
                <a href="editor.html?id=${art.id}" class="btn btn-secondary btn-sm">Edit</a>
                <button onclick="PolicyTellsAdmin.togglePublish('${art.id}', ${!isPub})" class="btn btn-secondary btn-sm">${isPub ? 'Unpublish' : 'Publish'}</button>
                <button onclick="PolicyTellsAdmin.toggleFeature('${art.id}', ${!isFeat})" class="btn btn-secondary btn-sm">${isFeat ? 'Unfeature' : 'Feature'}</button>
                <button onclick="PolicyTellsAdmin.deleteArticle('${art.id}')" class="btn btn-danger btn-sm">Delete</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    },

    renderMessagesTable: async function (container) {
      container.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:2rem;"><div class="spinner"></div></td></tr>';

      let messages = [];

      if (this.supabase) {
        try {
          const { data, error } = await this.supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) {
            messages = data;
          }
        } catch (e) {
          console.warn('Error fetching contact messages:', e);
        }
      }

      if (messages.length === 0) {
        const localMsgs = JSON.parse(localStorage.getItem('pt_contact_messages') || '[]');
        messages = localMsgs;
      }

      if (messages.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:1.5rem; color:var(--color-text-muted);">No contact messages received yet.</td></tr>';
        return;
      }

      container.innerHTML = messages.map(msg => {
        const dateStr = window.PolicyTellsApp ? window.PolicyTellsApp.formatDate(msg.created_at) : new Date(msg.created_at).toLocaleDateString();
        return `
          <tr>
            <td><strong>${this.escapeHTML(msg.name)}</strong><br><small>${this.escapeHTML(msg.email)}</small></td>
            <td>${this.escapeHTML(msg.subject)}</td>
            <td style="max-width:300px; white-space:normal;">${this.escapeHTML(msg.message)}</td>
            <td>${dateStr}</td>
          </tr>
        `;
      }).join('');
    },

    // --- Article CRUD Actions ---
    togglePublish: async function (articleId, newStatus) {
      if (this.supabase) {
        try {
          const { error } = await this.supabase
            .from('articles')
            .update({ published: newStatus, updated_at: new Date().toISOString() })
            .eq('id', articleId);

          if (error) throw error;
        } catch (e) {
          console.error('Toggle publish failed:', e);
          alert('Failed to update published status in Supabase.');
          return;
        }
      } else {
        // Local state update
        this.updateLocalArticle(articleId, { published: newStatus });
      }

      this.initDashboard();
    },

    toggleFeature: async function (articleId, newStatus) {
      if (this.supabase) {
        try {
          const { error } = await this.supabase
            .from('articles')
            .update({ featured: newStatus, updated_at: new Date().toISOString() })
            .eq('id', articleId);

          if (error) throw error;
        } catch (e) {
          console.error('Toggle feature failed:', e);
          alert('Failed to update featured status in Supabase.');
          return;
        }
      } else {
        this.updateLocalArticle(articleId, { featured: newStatus });
      }

      this.initDashboard();
    },

    deleteArticle: async function (articleId) {
      if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
        return;
      }

      if (this.supabase) {
        try {
          const { error } = await this.supabase
            .from('articles')
            .delete()
            .eq('id', articleId);

          if (error) throw error;
        } catch (e) {
          console.error('Delete article failed:', e);
          alert('Failed to delete article from Supabase.');
          return;
        }
      } else {
        let localArticles = JSON.parse(localStorage.getItem('pt_local_articles') || '[]');
        localArticles = localArticles.filter(a => String(a.id) !== String(articleId));
        localStorage.setItem('pt_local_articles', JSON.stringify(localArticles));
      }

      this.initDashboard();
    },

    updateLocalArticle: function (id, fields) {
      let localArticles = JSON.parse(localStorage.getItem('pt_local_articles') || '[]');
      const idx = localArticles.findIndex(a => String(a.id) === String(id));
      if (idx !== -1) {
        localArticles[idx] = { ...localArticles[idx], ...fields, updated_at: new Date().toISOString() };
      } else {
        // Copy from sample articles into local storage override
        const sample = (cfg.SAMPLE_ARTICLES || []).find(a => String(a.id) === String(id));
        if (sample) {
          localArticles.push({ ...sample, ...fields, updated_at: new Date().toISOString() });
        }
      }
      localStorage.setItem('pt_local_articles', JSON.stringify(localArticles));
    },

    // --- Admin Editor Initialization & Handling ---
    initEditor: async function () {
      const user = await this.requireAuth();
      if (!user) return;

      const editorForm = document.getElementById('article-editor-form');
      const titleInput = document.getElementById('article-title');
      const slugInput = document.getElementById('article-slug');
      const categorySelect = document.getElementById('article-category');
      const authorInput = document.getElementById('article-author');
      const excerptInput = document.getElementById('article-excerpt');
      const contentInput = document.getElementById('article-content');
      const imageUrlInput = document.getElementById('article-image-url');
      const featuredToggle = document.getElementById('article-featured');
      const publishedToggle = document.getElementById('article-published');
      const imageFileInput = document.getElementById('image-file-input');
      const uploadStatusEl = document.getElementById('upload-status');
      const previewImgEl = document.getElementById('image-preview');
      const alertBox = document.getElementById('editor-alert');
      const editorHeading = document.getElementById('editor-heading');

      if (!editorForm) return;

      // Populate category options
      if (categorySelect) {
        categorySelect.innerHTML = (cfg.CATEGORIES || []).map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
      }

      // Check if Editing existing article
      const urlParams = new URLSearchParams(window.location.search);
      const articleId = urlParams.get('id');

      if (articleId) {
        if (editorHeading) editorHeading.textContent = 'Edit Article';
        await this.loadArticleIntoForm(articleId, {
          titleInput, slugInput, categorySelect, authorInput,
          excerptInput, contentInput, imageUrlInput, featuredToggle,
          publishedToggle, previewImgEl
        });
      } else {
        if (editorHeading) editorHeading.textContent = 'Create New Article';
      }

      // Auto-generate slug from title
      if (titleInput && slugInput) {
        titleInput.addEventListener('input', () => {
          if (!articleId) { // Only auto-slugify on create
            slugInput.value = titleInput.value
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .trim()
              .replace(/\s+/g, '-');
          }
        });
      }

      // ImageKit File Upload Handler
      if (imageFileInput) {
        imageFileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          uploadStatusEl.style.display = 'block';
          uploadStatusEl.className = 'alert alert-info';
          uploadStatusEl.textContent = `Uploading ${file.name} to ImageKit...`;

          try {
            const cdnUrl = await this.uploadImageToImageKit(file);
            imageUrlInput.value = cdnUrl;
            previewImgEl.src = cdnUrl;
            previewImgEl.style.display = 'block';

            uploadStatusEl.className = 'alert alert-success';
            uploadStatusEl.textContent = 'Image successfully uploaded to ImageKit CDN!';
          } catch (err) {
            console.error('ImageKit Upload error:', err);
            uploadStatusEl.className = 'alert alert-error';
            uploadStatusEl.textContent = `Upload Error: ${err.message}`;
          }
        });
      }

      // Image URL manual change preview
      if (imageUrlInput && previewImgEl) {
        imageUrlInput.addEventListener('input', () => {
          if (imageUrlInput.value.trim()) {
            previewImgEl.src = imageUrlInput.value.trim();
            previewImgEl.style.display = 'block';
          } else {
            previewImgEl.style.display = 'none';
          }
        });
      }

      // Editor Submit Handler
      editorForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const saveBtn = editorForm.querySelector('button[type="submit"]');
        const title = titleInput.value.trim();
        const slug = slugInput.value.trim() || title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const category = categorySelect.value;
        const author = authorInput.value.trim();
        const excerpt = excerptInput.value.trim();
        const content = contentInput.value.trim();
        const image_url = imageUrlInput.value.trim();
        const featured = featuredToggle.checked;
        const published = publishedToggle.checked;

        if (!title || !content || !category) {
          this.showAlert(alertBox, 'Please complete the title, category, and article body fields.', 'error');
          return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving Article...';

        const articleData = {
          title,
          slug,
          category,
          author,
          excerpt,
          content,
          image_url,
          featured,
          published,
          updated_at: new Date().toISOString()
        };

        try {
          if (this.supabase) {
            if (articleId) {
              const { error } = await this.supabase
                .from('articles')
                .update(articleData)
                .eq('id', articleId);

              if (error) throw error;
            } else {
              articleData.created_at = new Date().toISOString();
              const { error } = await this.supabase
                .from('articles')
                .insert([articleData]);

              if (error) throw error;
            }
          } else {
            // Local storage fallback for demo
            if (articleId) {
              this.updateLocalArticle(articleId, articleData);
            } else {
              articleData.id = 'art-' + Date.now();
              articleData.created_at = new Date().toISOString();
              let localArticles = JSON.parse(localStorage.getItem('pt_local_articles') || '[]');
              localArticles.unshift(articleData);
              localStorage.setItem('pt_local_articles', JSON.stringify(localArticles));
            }
          }

          this.showAlert(alertBox, 'Article saved successfully! Redirecting to dashboard...', 'success');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1200);

        } catch (err) {
          console.error('Save article error:', err);
          this.showAlert(alertBox, `Failed to save article: ${err.message}`, 'error');
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Article';
        }
      });
    },

    loadArticleIntoForm: async function (id, fields) {
      let article = null;

      if (this.supabase) {
        try {
          const { data, error } = await this.supabase
            .from('articles')
            .select('*')
            .eq('id', id)
            .single();

          if (!error && data) {
            article = data;
          }
        } catch (e) {
          console.warn('Load article error from Supabase:', e);
        }
      }

      if (!article) {
        const combined = window.PolicyTellsApp ? window.PolicyTellsApp.getCombinedArticles() : cfg.SAMPLE_ARTICLES;
        article = combined.find(a => String(a.id) === String(id));
      }

      if (article) {
        fields.titleInput.value = article.title || '';
        fields.slugInput.value = article.slug || '';
        fields.categorySelect.value = article.category || 'politics';
        fields.authorInput.value = article.author || '';
        fields.excerptInput.value = article.excerpt || '';
        fields.contentInput.value = article.content || '';
        fields.imageUrlInput.value = article.image_url || '';
        fields.featuredToggle.checked = Boolean(article.featured);
        fields.publishedToggle.checked = Boolean(article.published);

        if (article.image_url) {
          fields.previewImgEl.src = article.image_url;
          fields.previewImgEl.style.display = 'block';
        }
      }
    },

    showAlert: function (el, text, type) {
      if (!el) return;
      el.style.display = 'block';
      el.className = `alert alert-${type}`;
      el.textContent = text;
    },

    escapeHTML: function (str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  };

  // Auto Init Admin Modules based on page
  document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop();

    if (page === 'login.html') {
      const loginForm = document.getElementById('admin-login-form');
      const alertBox = document.getElementById('login-alert');

      if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('login-email').value.trim();
          const password = document.getElementById('login-password').value;
          const submitBtn = loginForm.querySelector('button[type="submit"]');

          submitBtn.disabled = true;
          submitBtn.textContent = 'Authenticating...';

          try {
            await window.PolicyTellsAdmin.login(email, password);
            window.location.href = 'index.html';
          } catch (err) {
            console.error('Login error:', err);
            PolicyTellsAdmin.showAlert(alertBox, err.message || 'Invalid login credentials.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
          }
        });
      }
    } else if (page === 'index.html' && window.location.pathname.includes('/admin/')) {
      window.PolicyTellsAdmin.initDashboard();
    } else if (page === 'editor.html') {
      window.PolicyTellsAdmin.initEditor();
    }
  });

})();
