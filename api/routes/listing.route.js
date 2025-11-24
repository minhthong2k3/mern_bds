import express from 'express';
import {
  createListing,
  deleteListing,
  updateListing,
  getListing,
  getListings,
  getCrawledListings,
  getCrawledListingById,
  updateCrawledListing,    // ✅ update crawl
  deleteCrawledListing,    // ✅ delete crawl
  getAdminAllListings,     // ✅ admin tổng hợp
} from '../controllers/listing.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// CRUD listing user
router.post('/create', verifyToken, createListing);
router.delete('/delete/:id', verifyToken, deleteListing);
router.post('/update/:id', verifyToken, updateListing);
router.get('/get/:id', getListing);
router.get('/get', getListings);

// dữ liệu crawl
router.get('/crawl', getCrawledListings);
router.get('/crawl/:id', getCrawledListingById);
router.put('/crawl/:id', verifyToken, updateCrawledListing);   // ✅
router.delete('/crawl/:id', verifyToken, deleteCrawledListing); // ✅

// admin tổng hợp
router.get('/admin/all', verifyToken, getAdminAllListings);

export default router;
