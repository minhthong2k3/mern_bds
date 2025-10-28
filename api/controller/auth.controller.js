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
      return next(errorHandler(404, 'User not found'));
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

