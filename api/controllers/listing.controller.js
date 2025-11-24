// controllers/listing.controller.js
import mongoose from 'mongoose';
import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

// =============== LISTING USER TỰ ĐĂNG ===============

export const createListing = async (req, res, next) => {
  try {
    const listing = await Listing.create(req.body);
    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return next(errorHandler(404, 'Listing not found!'));
  }

  // ✅ ADMIN hoặc CHÍNH CHỦ mới được xoá
  if (!req.user.isAdmin && req.user.id !== listing.userRef) {
    return next(errorHandler(401, 'You can only delete your own listings!'));
  }

  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json('Listing has been deleted!');
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return next(errorHandler(404, 'Listing not found!'));
  }

  // ✅ ADMIN hoặc CHÍNH CHỦ mới được sửa
  if (!req.user.isAdmin && req.user.id !== listing.userRef) {
    return next(errorHandler(401, 'You can only update your own listings!'));
  }

  try {
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, 'Listing not found!'));
    }
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;
    let offer = req.query.offer;

    if (offer === undefined || offer === 'false') {
      offer = { $in: [false, true] };
    }

    let furnished = req.query.furnished;
    if (furnished === undefined || furnished === 'false') {
      furnished = { $in: [false, true] };
    }

    let parking = req.query.parking;
    if (parking === undefined || parking === 'false') {
      parking = { $in: [false, true] };
    }

    let type = req.query.type;
    if (type === undefined || type === 'all') {
      type = { $in: ['sale', 'rent'] };
    }

    const searchTerm = req.query.searchTerm || '';
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order || 'desc';

    const listings = await Listing.find({
      name: { $regex: searchTerm, $options: 'i' },
      offer,
      furnished,
      parking,
      type,
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

// =============== ĐỌC DỮ LIỆU CRAWL TỪ MongoDB ===============

// Phân trang: tối đa 100 tin, mỗi trang 20 tin
// GET /api/listing/crawl?startIndex=0&searchTerm=&sort=regularPrice|createdAt&order=asc|desc
export const getCrawledListings = async (req, res, next) => {
  try {
    const PAGE_SIZE = 20; // 20 tin / 1 request
    const MAX_TOTAL = 100; // tổng tối đa 100 tin

    const startIndex = parseInt(req.query.startIndex) || 0;
    const requestedLimit = parseInt(req.query.limit) || PAGE_SIZE;
    let limit = Math.min(requestedLimit, PAGE_SIZE);

    const searchTerm = req.query.searchTerm || '';

    // sort/order từ frontend
    const sortParam = req.query.sort || 'createdAt';
    const orderParam = req.query.order || 'desc';

    // collection crawl
    const collectionName = 'alonhadat_da_nang';
    const col = mongoose.connection.db.collection(collectionName);

    const filter = {};
    if (searchTerm) {
      filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { address: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // Lấy tối đa 100 tin, chưa sort/skip (để tự chuẩn hoá & sort)
    const rawDocs = await col.find(filter).limit(MAX_TOTAL).toArray();

    // Chuẩn hoá giá & gắn key sort
    const docsWithKey = rawDocs.map((doc) => {
      let sortKey = 0;

      if (sortParam === 'regularPrice') {
        // mặc định lấy price_value
        let price = typeof doc.price_value === 'number' ? doc.price_value : 0;
        const text = (doc.price_text || '').toLowerCase();

        // nếu là giá theo m2 (vd: "68 triệu /m2", "68 triệu / m²")
        const isPerM2 =
          text.includes('/m2') ||
          text.includes('/m²') ||
          (text.includes('/m') && text.includes('triệu'));

        if (isPerM2) {
          const area =
            typeof doc.area_m2 === 'number' && doc.area_m2 > 0
              ? doc.area_m2
              : null;
          if (area) {
            // chuẩn hoá: tổng giá = đơn giá * diện tích
            price = price * area;
          }
        }

        sortKey = price;
      } else {
        // sort theo thời gian crawl
        const t = doc.crawled_at ? new Date(doc.crawled_at).getTime() : 0;
        sortKey = t;
      }

      return { ...doc, _sortKey: sortKey };
    });

    // Sort theo _sortKey
    docsWithKey.sort((a, b) => {
      if (orderParam === 'asc') return a._sortKey - b._sortKey;
      return b._sortKey - a._sortKey;
    });

    // Phân trang trên mảng đã chuẩn hoá
    const total = Math.min(docsWithKey.length, MAX_TOTAL);
    if (startIndex >= total) {
      return res.status(200).json([]);
    }

    const end = Math.min(startIndex + limit, total);
    const paged = docsWithKey.slice(startIndex, end);

    // bỏ _sortKey trước khi trả về
    const result = paged.map(({ _sortKey, ...rest }) => rest);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// GET /api/listing/crawl/:id
export const getCrawledListingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const collectionName = 'alonhadat_da_nang';
    const col = mongoose.connection.db.collection(collectionName);
    const { ObjectId } = mongoose.Types;

    const doc = await col.findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return next(errorHandler(404, 'Crawled listing not found!'));
    }

    res.status(200).json(doc);
  } catch (error) {
    next(error);
  }
};

// ================= ADMIN: UPDATE / DELETE CRAWLED LISTING =================

// PUT /api/listing/crawl/:id
export const updateCrawledListing = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      return next(errorHandler(403, 'Admin only!'));
    }

    const { id } = req.params;
    const { ObjectId } = mongoose.Types;
    const collectionName = 'alonhadat_da_nang';
    const col = mongoose.connection.db.collection(collectionName);

    // những field cho phép sửa (có thể thêm/bớt tuỳ bạn)
    const {
      title,
      brief,
      address,
      area_m2,
      duong_truoc_nha,
      phap_ly,
      price_text,
      price_value,
    } = req.body;

    const updateDoc = {
      ...(title !== undefined && { title }),
      ...(brief !== undefined && { brief }),
      ...(address !== undefined && { address }),
      ...(area_m2 !== undefined && { area_m2 }),
      ...(duong_truoc_nha !== undefined && { duong_truoc_nha }),
      ...(phap_ly !== undefined && { phap_ly }),
      ...(price_text !== undefined && { price_text }),
      ...(price_value !== undefined && { price_value }),
      updated_at: new Date(),
    };

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return next(errorHandler(404, 'Crawled listing not found!'));
    }

    res.status(200).json(result.value);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/listing/crawl/:id
export const deleteCrawledListing = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      return next(errorHandler(403, 'Admin only!'));
    }

    const { id } = req.params;
    const { ObjectId } = mongoose.Types;
    const collectionName = 'alonhadat_da_nang';
    const col = mongoose.connection.db.collection(collectionName);

    const result = await col.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return next(errorHandler(404, 'Crawled listing not found!'));
    }

    res.status(200).json('Crawled listing has been deleted!');
  } catch (error) {
    next(error);
  }
};

// =============== ADMIN: LẤY LISTING USER + CRAWL ===============
// GET /api/listing/admin/all
export const getAdminAllListings = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      return next(errorHandler(403, 'Admin only!'));
    }

    const userListings = await Listing.find({})
      .sort({ createdAt: -1 })
      .limit(100);

    const collectionName = 'alonhadat_da_nang';
    const col = mongoose.connection.db.collection(collectionName);

    const crawledListings = await col
      .find({})
      .sort({ crawled_at: -1 })
      .limit(100)
      .toArray();

    res.status(200).json({
      userListings,
      crawledListings,
    });
  } catch (error) {
    next(error);
  }
};
