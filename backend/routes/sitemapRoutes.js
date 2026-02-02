import express from 'express';
import * as sitemapController from '../controllers/sitemapController.js';

const router = express.Router();

// GET /api/sitemap
router.get('/', sitemapController.generateSitemap);

export default router;
