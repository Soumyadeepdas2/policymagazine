/**
 * PolicyTells — Configuration & Curated Editorial Datasets
 */

window.POLICYTELLS_CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: (window.ENV && window.ENV.SUPABASE_URL) || "YOUR_SUPABASE_URL",
  SUPABASE_ANON_KEY: (window.ENV && window.ENV.SUPABASE_ANON_KEY) || "YOUR_SUPABASE_ANON_KEY",

  // ImageKit Configuration
  IMAGEKIT_PUBLIC_KEY: (window.ENV && window.ENV.IMAGEKIT_PUBLIC_KEY) || "YOUR_IMAGEKIT_PUBLIC_KEY",
  IMAGEKIT_URL_ENDPOINT: (window.ENV && window.ENV.IMAGEKIT_URL_ENDPOINT) || "https://ik.imagekit.io/your_imagekit_id",

  // Editorial Categories
  CATEGORIES: [
    { id: "politics", name: "Politics", description: "In-depth coverage of electoral systems, political strategy, and party dynamics." },
    { id: "governance", name: "Governance", description: "Public administration, institutional design, legislative scrutiny, and state capability." },
    { id: "economy", name: "Economy", description: "Fiscal policy, monetary governance, industrial strategy, trade, and economic growth." },
    { id: "india", name: "India", description: "National policy initiatives, federalism, infrastructure, and domestic transformations." },
    { id: "world", name: "World", description: "Foreign policy, multipolar diplomacy, defense strategy, and global affairs." },
    { id: "society", name: "Society", description: "Urban planning, social development, demographic shifts, and civic institutions." },
    { id: "opinion", name: "Opinion", description: "Analytical arguments, columns, and critical essays from policy scholars." }
  ],

  // Featured Hero Slides (easily replaceable and dynamic)
  HERO_SLIDES: [
    {
      id: "hero-1",
      slug: "architecture-of-parliamentary-reform-india",
      category: "India & Governance",
      title: "The Architecture of Reform: How Parliamentary Committees Shape India's Policy Future",
      excerpt: "An in-depth analysis of how legislative scrutiny, bipartisan committee reports, and policy drafting mechanisms are laying the groundwork for India's next decade of economic and digital governance.",
      author: "Arjun Swaminathan",
      date: "AUGUST 12, 2026",
      readTime: "8 MIN READ",
      image_url: "images/parliament-hero.jpg"
    },
    {
      id: "hero-2",
      slug: "indias-tech-sovereignty-strategy-semiconductors-ai",
      category: "Economy & Technology",
      title: "India's Tech Sovereignty Strategy: Semiconductors, AI & Data Protection",
      excerpt: "How targeted state incentives, domestic fabrication hubs, and digital public infrastructure are positioning India as a primary node in global technology supply chains.",
      author: "Priya Ramachandran",
      date: "AUGUST 10, 2026",
      readTime: "10 MIN READ",
      image_url: "images/economy-hero.jpg"
    },
    {
      id: "hero-3",
      slug: "global-south-alignment-indias-strategic-autonomy",
      category: "World & Diplomacy",
      title: "Global South Alignment: India's Strategic Autonomy in a Multipolar World",
      excerpt: "In an era of great power friction, India's issue-based diplomacy and trade coalitions offer a blueprint for middle powers seeking strategic independence.",
      author: "Vikramaditya Sen",
      date: "AUGUST 08, 2026",
      readTime: "7 MIN READ",
      image_url: "images/diplomacy-hero.jpg"
    }
  ],

  // Sample Articles Dataset
  SAMPLE_ARTICLES: [
    {
      id: "art-1",
      slug: "architecture-of-parliamentary-reform-india",
      title: "The Architecture of Reform: How Parliamentary Committees Shape India's Policy Future",
      excerpt: "An in-depth analysis of how legislative scrutiny, bipartisan committee reports, and policy drafting mechanisms are laying the groundwork for India's next decade of economic and digital governance.",
      content: `
<p>In parliamentary democracies, the public gaze naturally gravitates toward floor debates—the oratorical clashes, high-voltage votes, and political drama broadcast on television networks. Yet the most consequential work of legislative governance occurs away from the cameras, inside committee rooms.</p>

<p>India's Standing Committees and Select Committees perform a vital, institutional role: reviewing complex legislative drafts, questioning ministry officials, and producing detailed bipartisan reports that refine raw policy into workable law.</p>

<h2>The Mechanics of Legislative Scrutiny</h2>

<p>As bills grow increasingly technical—spanning subjects from artificial intelligence regulations to complex tax treaties and semiconductor incentives—the floor of Parliament lacks the time and technical specialization needed for clause-by-clause scrutiny.</p>

<blockquote>"Committees allow lawmakers to step outside party discipline, consult external experts, and build consensus on structural policy that outlasts electoral cycles."</blockquote>

<p>Recent major legislation—including digital personal data protection norms, telecommunications reform, and bankruptcy code amendments—benefited immensely from extensive committee review. Experts called before these committees range from academic economists to industry leaders and civil society advocates.</p>

<h2>Strengthening State Capability</h2>

<p>To meet the demands of a $5 trillion economy, policy experts advocate for further strengthening the committee architecture:</p>

<ul>
  <li><strong>Research Support:</strong> Providing non-partisan legislative research staff to every parliamentary committee.</li>
  <li><strong>Mandatory Scrutiny:</strong> Establishing formal guidelines to ensure all major non-emergency legislation undergoes committee review before passage.</li>
  <li><strong>Public Transparency:</strong> Publishing non-confidential expert testimonies to enrich public discourse.</li>
</ul>

<p>By investing in legislative capability, India ensures that its statutory framework remains agile, robust, and aligned with global standards.</p>
`,
      category: "governance",
      author: "Arjun Swaminathan",
      image_url: "images/parliament-hero.jpg",
      featured: true,
      published: true,
      created_at: "2026-08-12T09:00:00Z",
      updated_at: "2026-08-12T09:00:00Z"
    },
    {
      id: "art-2",
      slug: "indias-tech-sovereignty-strategy-semiconductors-ai",
      title: "India's Tech Sovereignty Strategy: Semiconductors, AI & Data Protection",
      excerpt: "How targeted state incentives, domestic fabrication hubs, and digital public infrastructure are positioning India as a primary node in global technology supply chains.",
      content: `
<p>Geopolitical realities over the past decade have demonstrated that national security is inextricably linked to technological capability. The modern state cannot safeguard its economy without securing its silicon supply chains and digital architecture.</p>

<p>India's multi-pronged technology strategy combines hardware manufacturing incentives (the Semiconductor Mission) with software infrastructure (Digital Public Goods like UPI and ONDC) and comprehensive data governance.</p>

<h2>Building the Hardware Foundation</h2>

<p>With multi-billion-dollar investments pouring into semiconductor fabrication units and testing facilities across Gujarat and South India, the country is transitioning from a consumer of chips to a critical manufacturing hub.</p>

<p>Simultaneously, sovereign AI initiatives are funding compute clusters and localized foundation models designed to operate in India's diverse linguistic landscape.</p>
`,
      category: "economy",
      author: "Priya Ramachandran",
      image_url: "images/economy-hero.jpg",
      featured: true,
      published: true,
      created_at: "2026-08-10T14:30:00Z",
      updated_at: "2026-08-10T14:30:00Z"
    },
    {
      id: "art-3",
      slug: "global-south-alignment-indias-strategic-autonomy",
      title: "Global South Alignment: India's Strategic Autonomy in a Multipolar World",
      excerpt: "In an era of great power friction, India's issue-based diplomacy and trade coalitions offer a blueprint for middle powers seeking strategic independence.",
      content: `
<p>The global geopolitical map is undergoing its most significant reorganization since the end of the Cold War. In place of rigid treaty alliances, prominent economies are embracing flexible, issue-based diplomacy.</p>

<p>India's foreign policy exemplifies this modern doctrine: engaging with Western economies on advanced technology and maritime security while leading development and climate initiatives for nations across Africa, Latin America, and Southeast Asia.</p>
`,
      category: "world",
      author: "Vikramaditya Sen",
      image_url: "images/diplomacy-hero.jpg",
      featured: true,
      published: true,
      created_at: "2026-08-08T11:15:00Z",
      updated_at: "2026-08-08T11:15:00Z"
    },
    {
      id: "art-4",
      slug: "reforming-municipal-governance-urban-productivity",
      title: "Reforming Municipal Governance: Unlocking Urban Economic Productivity",
      excerpt: "As metropolitan regions grow, empowering municipal corporations with financial autonomy and urban planning expertise is central to India's urbanization trajectory.",
      content: `
<p>Cities are the primary engines of modern GDP creation. Yet municipal local bodies frequently struggle with financial constraints and fragmented administrative jurisdiction.</p>

<p>PolicyTells examines municipal bond markets, property tax digitisation, and urban governance reforms required for sustainable city development.</p>
`,
      category: "society",
      author: "Kavita Menon",
      image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
      featured: false,
      published: true,
      created_at: "2026-08-05T16:00:00Z",
      updated_at: "2026-08-05T16:00:00Z"
    },
    {
      id: "art-5",
      slug: "fiscal-federalism-and-gst-council-consensus",
      title: "Fiscal Federalism: The Evolution of GST Council Consensus Dynamics",
      excerpt: "How cooperative federalism inside the GST Council balances state revenue requirements with national market integration.",
      content: `
<p>The Goods and Services Tax Council stands as a unique experiment in constitutional cooperative federalism in India, bringing central and state finance ministers together to determine indirect tax rates by consensus.</p>
`,
      category: "economy",
      author: "Dr. Rajeshwar Rao",
      image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
      featured: false,
      published: true,
      created_at: "2026-08-02T10:00:00Z",
      updated_at: "2026-08-02T10:00:00Z"
    }
  ]
};
