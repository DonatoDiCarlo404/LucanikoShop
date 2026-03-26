import Product from '../models/Product.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Experience from '../models/Experience.js';

// Genera sitemap.xml dinamica
export const generateSitemap = async (req, res) => {
  try {
    const baseUrl = 'https://lucanikoshop.it';
    const today = new Date().toISOString().split('T')[0];

    // Recupera prodotti attivi e visibili
    const products = await Product.find({ 
      isActive: true,
      isVisible: true 
    })
      .select('_id name updatedAt')
      .lean();

    // Recupera venditori approvati
    const vendors = await User.find({ 
      role: 'seller', 
      'sellerProfile.isApproved': true 
    })
      .select('_id updatedAt')
      .lean();

    // Recupera eventi attivi
    const events = await Event.find({ status: 'active' })
      .select('_id title updatedAt')
      .lean();

    // Recupera esperienze attive
    const experiences = await Experience.find({ status: 'active' })
      .select('_id title updatedAt')
      .lean();

    // Costruisci XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Pagine principali -->
  <url>
    <loc>${baseUrl}/products</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/categories</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/negozi</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/partners</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/esperienze</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/eventi</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/offers</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Pagine informative -->
  <url>
    <loc>${baseUrl}/spazio-venditori-lucani</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/help-center-buyers</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/help-center-vendors</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/terms-vendors</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/terms-buyers</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/cookie-policy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/cancellation-policy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
`;

    // Aggiungi prodotti
    products.forEach(product => {
      const lastmod = product.updatedAt 
        ? new Date(product.updatedAt).toISOString().split('T')[0] 
        : today;
      
      xml += `  
  <url>
    <loc>${baseUrl}/products/${product._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });

    // Aggiungi negozi/venditori
    vendors.forEach(vendor => {
      const lastmod = vendor.updatedAt 
        ? new Date(vendor.updatedAt).toISOString().split('T')[0] 
        : today;
      
      xml += `  
  <url>
    <loc>${baseUrl}/shop/${vendor._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });

    // Aggiungi eventi
    events.forEach(event => {
      const lastmod = event.updatedAt 
        ? new Date(event.updatedAt).toISOString().split('T')[0] 
        : today;
      
      xml += `  
  <url>
    <loc>${baseUrl}/eventi/${event._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });

    // Aggiungi esperienze
    experiences.forEach(experience => {
      const lastmod = experience.updatedAt 
        ? new Date(experience.updatedAt).toISOString().split('T')[0] 
        : today;
      
      xml += `  
  <url>
    <loc>${baseUrl}/esperienze/${experience._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });

    xml += `
</urlset>`;

    // Imposta header per XML
    res.header('Content-Type', 'application/xml');
    res.send(xml);

  } catch (error) {
    console.error('Errore generazione sitemap:', error);
    res.status(500).json({ message: 'Errore generazione sitemap' });
  }
};
