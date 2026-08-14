/**
 * PolicyTells — Political & Public Policy Magazine Engine
 * Features live typewriter animation for TELLS, live footer vision typewriter ("WE BELIEVE IN ..."),
 * mobile menu toggle, dynamic hero background image switching, category-based section rendering, and exact category navigation highlighting.
 */

(function () {
  'use strict';

  let supabaseClient = null;
  const cfg = window.POLICYTELLS_CONFIG || {};

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
      console.warn('PolicyTells: Supabase client init failed:', e);
    }
  }

  window.PolicyTellsApp = {
    supabase: supabaseClient,
    currentHeroIndex: 0,
    heroSlides: [],

    // --- Active Navigation Highlighting ---
    initNavigation: function () {
      const currentPath = window.location.pathname.split('/').pop() || 'index.html';
      const urlParams = new URLSearchParams(window.location.search);
      const currentCat = urlParams.get('cat');

      document.querySelectorAll('.header-nav a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        link.classList.remove('active');

        if (currentCat) {
          if (href.toLowerCase().includes(`cat=${currentCat.toLowerCase()}`)) {
            link.classList.add('active');
          }
        } else if (href === currentPath || (currentPath === '' && href === 'index.html') || (currentPath === 'index.html' && href === 'index.html')) {
          link.classList.add('active');
        }
      });
    },

    // --- Mobile Menu Toggle Handler ---
    initMobileMenu: function () {
      const menuBtn = document.querySelector('.mobile-menu-btn');
      const nav = document.querySelector('.header-nav');

      if (!menuBtn || !nav) return;

      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        nav.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (nav.classList.contains('active') && !nav.contains(e.target) && !menuBtn.contains(e.target)) {
          nav.classList.remove('active');
        }
      });
    },

    // --- Live Footer Vision Typewriter: 'WE BELIEVE IN ' is 100% Fixed in Position ---
    initFooterVisionTypewriter: function () {
      const textEl = document.getElementById('footer-vision-text');
      if (!textEl) return;

      const phrases = [
        "INTELLECTUAL RIGOR & CLARITY.",
        "DEEP POLICY ANALYSIS.",
        "INSTITUTIONAL TRANSPARENCY.",
        "INFORMED DEMOCRATIC DISCOURSE.",
        "STRATEGIC AUTONOMY & TRUTH."
      ];

      let phraseIdx = 0;
      let charIdx = 0;
      let isDeleting = false;

      function step() {
        const currentPhrase = phrases[phraseIdx];
        textEl.textContent = currentPhrase.substring(0, charIdx);

        if (!isDeleting && charIdx < currentPhrase.length) {
          charIdx++;
          setTimeout(step, 50);
        } else if (isDeleting && charIdx > 0) {
          charIdx--;
          setTimeout(step, 25);
        } else {
          isDeleting = !isDeleting;
          if (!isDeleting) {
            phraseIdx = (phraseIdx + 1) % phrases.length;
            setTimeout(step, 300);
          } else {
            setTimeout(step, 2200); // Hold full phrase for 2.2s
          }
        }
      }

      step();
    },

    formatDate: function (dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      }).toUpperCase();
    },

    getCategoryName: function (catSlug) {
      if (!catSlug) return 'POLICY';
      const cat = (cfg.CATEGORIES || []).find(c => c.id.toLowerCase() === catSlug.toLowerCase());
      return cat ? cat.name.toUpperCase() : catSlug.toUpperCase();
    },

    calcReadTime: function (text) {
      if (!text) return '6 MIN READ';
      const words = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
      const mins = Math.max(1, Math.ceil(words / 225));
      return `${mins} MIN READ`;
    },

    getCombinedArticles: function () {
      const samples = cfg.SAMPLE_ARTICLES || [];
      const localArticlesJson = localStorage.getItem('pt_local_articles');
      let localArticles = [];
      if (localArticlesJson) {
        try {
          localArticles = JSON.parse(localArticlesJson);
        } catch (e) {
          console.error(e);
        }
      }
      return [...localArticles, ...samples];
    },

    fetchArticles: async function (filters = {}) {
      const { category, featured, publishedOnly = true, limit, slug, id } = filters;

      if (this.supabase) {
        try {
          let query = this.supabase.from('articles').select('*');

          if (publishedOnly) {
            query = query.eq('published', true);
          }
          if (category) {
            query = query.eq('category', category);
          }
          if (featured !== undefined) {
            query = query.eq('featured', featured);
          }
          if (slug) {
            query = query.eq('slug', slug);
          }
          if (id) {
            query = query.eq('id', id);
          }

          query = query.order('created_at', { ascending: false });

          if (limit) {
            query = query.limit(limit);
          }

          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            return data;
          }
        } catch (err) {
          console.warn('Supabase request failed, using fallback data:', err);
        }
      }

      let articles = this.getCombinedArticles();

      if (publishedOnly) {
        articles = articles.filter(a => a.published === true || a.published === undefined);
      }
      if (category) {
        articles = articles.filter(a => a.category.toLowerCase() === category.toLowerCase());
      }
      if (featured !== undefined) {
        articles = articles.filter(a => Boolean(a.featured) === Boolean(featured));
      }
      if (slug) {
        articles = articles.filter(a => a.slug === slug);
      }
      if (id) {
        articles = articles.filter(a => String(a.id) === String(id));
      }

      articles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      if (limit) {
        articles = articles.slice(0, limit);
      }

      return articles;
    },

    fetchArticleBySlugOrId: async function (identifier) {
      if (!identifier) return null;
      let articles = await this.fetchArticles({ slug: identifier, publishedOnly: false });
      if (!articles || articles.length === 0) {
        articles = await this.fetchArticles({ id: identifier, publishedOnly: false });
      }
      return (articles && articles.length > 0) ? articles[0] : null;
    },

    // --- Hero Slider Logic with Dynamic Background Image ---
    initHeroSlider: function (slides) {
      this.heroSlides = slides && slides.length > 0 ? slides : (cfg.HERO_SLIDES || []);
      const bgImg = document.getElementById('hero-bg-image');
      const categoryBadge = document.getElementById('hero-category-text');
      const titleEl = document.getElementById('hero-title-text');
      const excerptEl = document.getElementById('hero-excerpt-text');
      const ctaBtn = document.getElementById('hero-cta-link');
      const authorEl = document.getElementById('hero-author-text');
      const dateEl = document.getElementById('hero-date-text');
      const slideNumEl = document.getElementById('hero-slide-num');
      const prevBtn = document.getElementById('hero-prev-btn');
      const nextBtn = document.getElementById('hero-next-btn');

      if (!titleEl) return;

      const renderSlide = (index) => {
        const slide = this.heroSlides[index];
        if (!slide) return;

        if (bgImg) {
          bgImg.style.opacity = '0.4';
          setTimeout(() => {
            bgImg.src = slide.image_url || 'images/parliament-hero.jpg';
            bgImg.style.opacity = '1';
          }, 200);
        }

        if (categoryBadge) categoryBadge.textContent = slide.category || this.getCategoryName(slide.category);
        if (titleEl) {
          titleEl.innerHTML = `<a href="article.html?slug=${encodeURIComponent(slide.slug || slide.id)}">${this.escapeHTML(slide.title)}</a>`;
        }
        if (excerptEl) excerptEl.textContent = slide.excerpt || '';
        if (ctaBtn) ctaBtn.href = `article.html?slug=${encodeURIComponent(slide.slug || slide.id)}`;
        if (authorEl) authorEl.textContent = `BY ${this.escapeHTML(slide.author || 'EDITORIAL DESK')}`;
        if (dateEl) dateEl.textContent = slide.date || this.formatDate(slide.created_at);
        if (slideNumEl) {
          slideNumEl.innerHTML = `<strong>0${index + 1}</strong> / 0${this.heroSlides.length}`;
        }
      };

      renderSlide(0);

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          this.currentHeroIndex = (this.currentHeroIndex - 1 + this.heroSlides.length) % this.heroSlides.length;
          renderSlide(this.currentHeroIndex);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          this.currentHeroIndex = (this.currentHeroIndex + 1) % this.heroSlides.length;
          renderSlide(this.currentHeroIndex);
        });
      }
    },

    // --- Search Modal ---
    initSearchModal: function () {
      const searchBtn = document.getElementById('search-trigger');
      const modal = document.getElementById('search-modal');
      const input = document.getElementById('search-input');
      const resultsContainer = document.getElementById('search-results');

      if (!searchBtn || !modal || !input) return;

      searchBtn.addEventListener('click', () => {
        modal.classList.add('active');
        input.focus();
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
          modal.classList.remove('active');
        }
      });

      input.addEventListener('input', async () => {
        const query = input.value.trim().toLowerCase();
        if (!query) {
          resultsContainer.innerHTML = '';
          return;
        }

        const articles = await this.fetchArticles({ publishedOnly: true });
        const filtered = articles.filter(a =>
          a.title.toLowerCase().includes(query) ||
          (a.excerpt && a.excerpt.toLowerCase().includes(query)) ||
          a.category.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
          resultsContainer.innerHTML = '<p style="color:var(--text-muted); padding:1rem 0;">No matching articles found.</p>';
          return;
        }

        resultsContainer.innerHTML = filtered.map(art => `
          <div style="padding:1rem 0; border-bottom:1px solid var(--border-subtle);">
            <span class="card-category" style="font-size:0.65rem;">${this.getCategoryName(art.category)}</span>
            <h4 style="font-family:var(--font-serif); font-size:1.1rem; margin-top:0.25rem;">
              <a href="article.html?slug=${encodeURIComponent(art.slug || art.id)}" style="color:#FFF;">${this.escapeHTML(art.title)}</a>
            </h4>
          </div>
        `).join('');
      });
    },

    // --- Card Generator ---
    createCardHTML: function (article) {
      const catName = this.getCategoryName(article.category);
      const readTime = this.calcReadTime(article.content);
      const imgUrl = article.image_url || 'images/parliament-hero.jpg';

      return `
        <article class="editorial-card">
          <a href="article.html?slug=${encodeURIComponent(article.slug || article.id)}" class="card-img-wrapper">
            <img src="${imgUrl}" alt="${this.escapeHTML(article.title)}" class="card-img" loading="lazy">
          </a>
          <div class="card-content">
            <span class="card-category">${this.escapeHTML(catName)}</span>
            <h3 class="card-headline">
              <a href="article.html?slug=${encodeURIComponent(article.slug || article.id)}">${this.escapeHTML(article.title)}</a>
            </h3>
            <p class="card-excerpt">${this.escapeHTML(article.excerpt || '')}</p>
            <div class="card-footer-meta">
              <span>BY ${this.escapeHTML(article.author || 'EDITORIAL DESK')}</span>
              <span>${readTime}</span>
            </div>
          </div>
        </article>
      `;
    },

    // --- Dynamic Category-Based Homepage Generator ---
    initHomepage: async function () {
      const sectionsContainer = document.getElementById('homepage-dynamic-sections');
      if (!sectionsContainer) return;

      const allArticles = await this.fetchArticles({ publishedOnly: true });

      if (!allArticles || allArticles.length === 0) {
        sectionsContainer.innerHTML = '<div class="empty-state"><p>NO PUBLISHED ARTICLES YET</p></div>';
        return;
      }

      // Highlighted Hero Story setup
      const featuredArticles = allArticles.filter(a => a.featured === true);
      const slidesToUse = featuredArticles.length > 0 ? featuredArticles : allArticles.slice(0, 3);
      this.initHeroSlider(slidesToUse);

      // Group published articles by Category
      const categoriesMap = {};
      allArticles.forEach(art => {
        const catKey = art.category ? art.category.toLowerCase() : 'general';
        if (!categoriesMap[catKey]) {
          categoriesMap[catKey] = [];
        }
        categoriesMap[catKey].push(art);
      });

      const categoryKeys = Object.keys(categoriesMap);

      if (categoryKeys.length === 0) {
        sectionsContainer.innerHTML = '<div class="empty-state"><p>NO PUBLISHED CATEGORIES FOUND</p></div>';
        return;
      }

      let dynamicHTML = '';

      categoryKeys.forEach((catKey) => {
        const catName = this.getCategoryName(catKey);
        const catArticles = categoriesMap[catKey];

        dynamicHTML += `
          <section style="margin-top: 4rem;">
            <div class="section-header-bar">
              <h2 class="section-title-main">${this.escapeHTML(catName)}</h2>
              <a href="category.html?cat=${encodeURIComponent(catKey)}" class="section-view-all">EXPLORE ${this.escapeHTML(catName)} →</a>
            </div>

            <div class="editorial-cards-grid">
              ${catArticles.map(art => this.createCardHTML(art)).join('')}
            </div>
          </section>
        `;
      });

      sectionsContainer.innerHTML = dynamicHTML;
    },

    initArticlePage: async function () {
      const articleContainer = document.getElementById('single-article-content');
      const relatedContainer = document.getElementById('related-articles-grid');

      if (!articleContainer) return;

      const urlParams = new URLSearchParams(window.location.search);
      const slug = urlParams.get('slug') || urlParams.get('id');

      if (!slug) {
        articleContainer.innerHTML = '<div class="empty-state"><h3>NO ARTICLE SPECIFIED</h3></div>';
        return;
      }

      articleContainer.innerHTML = '<div class="empty-state"><div class="spinner"></div></div>';

      const article = await this.fetchArticleBySlugOrId(slug);

      if (!article) {
        articleContainer.innerHTML = '<div class="empty-state"><h3>ARTICLE NOT FOUND</h3></div>';
        return;
      }

      document.title = `${article.title} — PolicyTells Magazine`;

      const catName = this.getCategoryName(article.category);
      const dateStr = this.formatDate(article.created_at);
      const readTime = this.calcReadTime(article.content);
      const imgUrl = article.image_url || 'images/parliament-hero.jpg';

      let formattedBody = article.content || '';
      if (!formattedBody.includes('<p>') && !formattedBody.includes('<h')) {
        formattedBody = formattedBody
          .split('\n\n')
          .filter(p => p.trim().length > 0)
          .map(p => `<p>${this.escapeHTML(p.trim())}</p>`)
          .join('');
      }

      articleContainer.innerHTML = `
        <header class="article-reader-header">
          <span class="card-category" style="font-size:0.8rem; letter-spacing:0.15em;">${this.escapeHTML(catName)}</span>
          <h1 class="article-reader-title">${this.escapeHTML(article.title)}</h1>
          ${article.excerpt ? `<p class="article-reader-subtitle">${this.escapeHTML(article.excerpt)}</p>` : ''}
          <div class="article-reader-meta">
            <span>BY <strong>${this.escapeHTML(article.author || 'EDITORIAL DESK')}</strong></span>
            <span>•</span>
            <span>PUBLISHED ${dateStr}</span>
            <span>•</span>
            <span>${readTime}</span>
          </div>
        </header>

        <div class="article-cover-hero">
          <img src="${imgUrl}" alt="${this.escapeHTML(article.title)}">
        </div>

        <div class="article-text-body">
          ${formattedBody}
        </div>

        <div style="margin-top:4rem; padding-top:2rem; border-top:1px solid var(--border-subtle); text-align:center;">
          <a href="index.html" class="btn-secondary">← RETURN TO HOMEPAGE</a>
        </div>
      `;

      if (relatedContainer) {
        const allPublished = await this.fetchArticles({ publishedOnly: true });
        const related = allPublished.filter(a => String(a.id) !== String(article.id) && String(a.slug) !== String(article.slug));

        if (related.length > 0) {
          relatedContainer.innerHTML = related.slice(0, 3).map(art => this.createCardHTML(art)).join('');
        }
      }
    },

    initCategoryPage: async function () {
      const categoryTitleEl = document.getElementById('category-title');
      const categoryDescEl = document.getElementById('category-desc');
      const gridContainer = document.getElementById('category-articles-grid');

      if (!gridContainer) return;

      const urlParams = new URLSearchParams(window.location.search);
      const catSlug = urlParams.get('cat');

      let categoryObj = null;
      if (catSlug) {
        categoryObj = (cfg.CATEGORIES || []).find(c => c.id.toLowerCase() === catSlug.toLowerCase());
      }

      const catName = categoryObj ? categoryObj.name.toUpperCase() : (catSlug ? catSlug.toUpperCase() : 'ALL STORIES');
      const catDesc = categoryObj ? categoryObj.description : 'In-depth policy analysis, governance insights, and editorial commentary.';

      if (categoryTitleEl) categoryTitleEl.textContent = catName;
      if (categoryDescEl) categoryDescEl.textContent = catDesc;
      document.title = `${catName} — PolicyTells Magazine`;

      gridContainer.innerHTML = '<div class="empty-state"><div class="spinner"></div></div>';

      const articles = await this.fetchArticles({ category: catSlug || undefined, publishedOnly: true });

      if (!articles || articles.length === 0) {
        gridContainer.innerHTML = '<div class="empty-state"><p>NO ARTICLES IN THIS CATEGORY YET</p></div>';
        return;
      }

      gridContainer.innerHTML = articles.map(art => this.createCardHTML(art)).join('');
    },

    initContactForm: function () {
      const form = document.getElementById('contact-form');
      const alertBox = document.getElementById('contact-alert');

      if (!form) return;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const subject = document.getElementById('contact-subject').value.trim();
        const message = document.getElementById('contact-message').value.trim();

        if (!name || !email || !subject || !message) {
          this.showAlert(alertBox, 'ALL FIELDS ARE REQUIRED.', 'error');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'TRANSMITTING MESSAGE...';

        try {
          if (this.supabase) {
            const { error } = await this.supabase
            .from('contact_messages')
            .insert([{
             name,
             email,
             subject,
             message,
             created_at: new Date().toISOString()
           }]);

            if (error) throw error;
          } else {
            const localMsgs = JSON.parse(localStorage.getItem('pt_contact_messages') || '[]');
            localMsgs.push({ id: Date.now(), name, email, subject, message, recipient: 'ithylene@zohomail.in', created_at: new Date().toISOString() });
            localStorage.setItem('pt_contact_messages', JSON.stringify(localMsgs));
          }

          this.showAlert(alertBox, 'THANK YOU. YOUR MESSAGE HAS BEEN SUBMITTED TO THE EDITORIAL TEAM.', 'success');
          form.reset();
        } catch (err) {
          console.error('Contact submit error:', err);
          this.showAlert(alertBox, 'TRANSMISSION ERROR. PLEASE TRY AGAIN.', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'SEND MESSAGE';
        }
      });
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

  document.addEventListener('DOMContentLoaded', () => {
    window.PolicyTellsApp.initNavigation();
    window.PolicyTellsApp.initMobileMenu();
    window.PolicyTellsApp.initFooterVisionTypewriter();
    window.PolicyTellsApp.initSearchModal();

    if (document.getElementById('homepage-dynamic-sections')) {
      window.PolicyTellsApp.initHomepage();
    }
    if (document.getElementById('single-article-content')) {
      window.PolicyTellsApp.initArticlePage();
    }
    if (document.getElementById('category-articles-grid')) {
      window.PolicyTellsApp.initCategoryPage();
    }
    if (document.getElementById('contact-form')) {
      window.PolicyTellsApp.initContactForm();
    }
  });

})();
