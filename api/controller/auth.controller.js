import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { handleError } from '../ultis/error.js';
import jwt from 'jsonwebtoken';
import e from 'express';
export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;
  // Here you would typically add logic to save the user to the database
  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = new User({ username, email, password: hashedPassword });
  try {
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    next(error);
    //next(handleError(500, 'error from ultis function'));
  }

  
};
export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const validUser = await User.findOne({ email });
    if (!validUser) {
      return next(handleError(404, 'User not found'));
    }
    const validPassword = bcrypt.compareSync(password, validUser.password);
    if (!validPassword) {
      return next(handleError(401, 'Invalid password'));
    } 
    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET)
    const { password: pass, ...rest } = validUser._doc;
    res.cookie("access_token", token, { httpOnly: true}).status(200).json(rest);
    
  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) => {
  try {
    const { email, name, photo } = req.body;
    if (!email) return next(handleError(400, 'Email is required'));

    // Đã có user -> đăng nhập
    let user = await User.findOne({ email });
    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      const { password, ...safe } = user.toObject();
      return res
        .cookie('access_token', token, { httpOnly: true, sameSite: 'lax' })
        .status(200)
        .json(safe);
    }

    // Chưa có -> tạo mới (username & password bắt buộc theo schema)
    const base =
      (name || email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20) || 'user';
    const username = `${base}_${Math.random().toString(36).slice(2, 7)}`;

    const randomPass = Math.random().toString(36).slice(2) + Date.now();
    const hashedPassword = bcrypt.hashSync(randomPass, 10);

    user = await User.create({
      username,                 // ✅ đúng field
      email,
      password: hashedPassword, // vì schema required
      avatar: photo             // ✅ đúng field trong schema
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    const { password, ...safe } = user.toObject();
    return res
      .cookie('access_token', token, { httpOnly: true, sameSite: 'lax' })
      .status(200)
      .json(safe);
  } catch (error) {
    next(error);
  }
};
