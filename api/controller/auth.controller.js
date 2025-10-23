import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { handleError } from '../ultis/error.js';
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
