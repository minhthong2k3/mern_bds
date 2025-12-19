// server/controllers/imagekit.controller.js
import ImageKit from 'imagekit';
import { errorHandler } from '../utils/error.js';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

export const getImagekitAuth = (req, res, next) => {
  try {
    // Trả về { token, expire, signature }
    const authParams = imagekit.getAuthenticationParameters();
    return res.status(200).json(authParams);
  } catch (err) {
    return next(errorHandler(500, err.message || 'ImageKit auth failed'));
  }
};
