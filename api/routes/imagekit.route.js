// server/routes/imagekit.route.js
import express from 'express';
import { getImagekitAuth } from '../controllers/imagekit.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Có thể yêu cầu đăng nhập mới được lấy auth upload
router.get('/auth', verifyToken, getImagekitAuth);

export default router;
