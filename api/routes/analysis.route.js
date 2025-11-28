// api/routes/analysis.route.js
import express from 'express';
import {
  wardAnalysis,
  directionAnalysis,
  streetWidthAnalysis,
} from '../controllers/analysis.controller.js';

const router = express.Router();

// Gói 1: phân tích theo phường
router.get('/wards', wardAnalysis);

// Gói 3: phân tích theo hướng nhà
router.get('/directions', directionAnalysis);

// Gói 4: phân tích theo độ rộng đường
router.get('/street-width', streetWidthAnalysis);

export default router;
