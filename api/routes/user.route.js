// routes/user.route.js
import express from 'express';
import {
  deleteUser,
  test,
  updateUser,
  getUserListings,
  getUser,
  adminGetAllUsers,
  adminDeleteUser,
  adminUpdateUser,
  adminGetUserListings,
} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/test', test);

// ===== USER TỰ QUẢN LÝ =====
router.post('/update/:id', verifyToken, updateUser);
router.delete('/delete/:id', verifyToken, deleteUser);
router.get('/listings/:id', verifyToken, getUserListings);

// ===== ADMIN QUẢN LÝ USER =====
router.get('/admin/all', verifyToken, adminGetAllUsers);
router.post('/admin/update/:id', verifyToken, adminUpdateUser);
router.delete('/admin/delete/:id', verifyToken, adminDeleteUser);

// ===== XEM THÔNG TIN 1 USER (chủ tài khoản hoặc admin) =====
router.get('/:id', verifyToken, getUser);
// admin xem toàn bộ listings của 1 user
router.get('/admin/:id/listings', verifyToken, adminGetUserListings);

export default router;
