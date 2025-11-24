// controllers/user.controller.js
import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import Listing from '../models/listing.model.js';

export const test = (req, res) => {
  res.json({
    message: 'Api route is working!',
  });
};

//
// ================== USER TỰ QUẢN LÝ TÀI KHOẢN ==================
//

// USER tự update chính mình
export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, 'You can only update your own account!'));
  }

  try {
    if (req.body.password) {
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
          avatar: req.body.avatar,
        },
      },
      { new: true }
    );

    const { password, ...rest } = updatedUser._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

// USER tự xoá chính mình + xoá luôn tất cả listing của mình
export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, 'You can only delete your own account!'));
  }
  try {
    const userId = req.params.id;

    // Xoá toàn bộ listing do user này tạo
    await Listing.deleteMany({ userRef: userId });

    // Xoá user
    await User.findByIdAndDelete(userId);

    res.clearCookie('access_token');
    res
      .status(200)
      .json('User and all listings have been deleted!');
  } catch (error) {
    next(error);
  }
};

// Lấy listing của 1 user (chỉ chủ tài khoản)
export const getUserListings = async (req, res, next) => {
  if (req.user.id === req.params.id) {
    try {
      const listings = await Listing.find({ userRef: req.params.id });
      res.status(200).json(listings);
    } catch (error) {
      next(error);
    }
  } else {
    return next(errorHandler(401, 'You can only view your own listings!'));
  }
};

// Lấy thông tin 1 user (chủ tài khoản hoặc admin)
export const getUser = async (req, res, next) => {
  try {
    // chỉ cho chính chủ hoặc admin xem
    if (!req.user?.isAdmin && req.user.id !== req.params.id) {
      return next(errorHandler(401, 'You can only view your own account!'));
    }

    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, 'User not found!'));

    const { password: pass, ...rest } = user._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

//
// ================== ADMIN QUẢN LÝ USER KHÁC ==================
//

// Lấy tất cả listing của một user (chỉ admin)
export const adminGetUserListings = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      return next(errorHandler(403, 'Admin only!'));
    }

    const { id } = req.params; // id của user
    const listings = await Listing.find({ userRef: id }).sort({ createdAt: -1 });

    res.status(200).json(listings);
  } catch (err) {
    next(err);
  }
};

// Lấy toàn bộ danh sách user (ẩn password)
export const adminGetAllUsers = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      return next(errorHandler(403, 'Admin only!'));
    }

    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

// Admin xoá user khác (không xoá chính mình) + xoá luôn tất cả listing của user đó
export const adminDeleteUser = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      return next(errorHandler(403, 'Admin only!'));
    }

    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, 'User not found!'));

    // không cho xoá tài khoản admin đang đăng nhập
    if (user._id.toString() === req.user.id) {
      return next(errorHandler(400, 'Cannot delete main admin account!'));
    }

    const userId = user._id.toString();

    // Xoá toàn bộ listing do user này tạo
    await Listing.deleteMany({ userRef: userId });

    // Xoá user
    await User.findByIdAndDelete(userId);

    res
      .status(200)
      .json('User and all listings have been deleted by admin!');
  } catch (err) {
    next(err);
  }
};

// Admin update user khác
export const adminUpdateUser = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      return next(errorHandler(403, 'Admin only!'));
    }

    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, 'User not found!'));

    // chính admin muốn sửa mình thì dùng /user/update/:id
    if (user._id.toString() === req.user.id) {
      return next(
        errorHandler(400, 'Use profile page to update main admin account!')
      );
    }

    const updateFields = {};

    if (req.body.username !== undefined)
      updateFields.username = req.body.username;
    if (req.body.email !== undefined) updateFields.email = req.body.email;
    if (req.body.avatar !== undefined) updateFields.avatar = req.body.avatar;

    if (req.body.password) {
      updateFields.password = bcryptjs.hashSync(req.body.password, 10);
    }

    // tuỳ ý: cho phép set isAdmin cho user khác
    if (typeof req.body.isAdmin === 'boolean') {
      updateFields.isAdmin = req.body.isAdmin;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};
