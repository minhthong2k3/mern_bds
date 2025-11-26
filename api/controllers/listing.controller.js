// controllers/listing.controller.js
import mongoose from 'mongoose';
import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

// =============== LISTING USER TỰ ĐĂNG ===============

// Tạo listing mới (user)
export const createListing = async (req, res, next) => {
  try {
    // Không tin ai từ body cả, ép lại các field nhạy cảm
    const payload = {
      ...req.body,
      userRef: req.user.id,    // luôn là user hiện tại
      source: 'user',          // đánh dấu nguồn
      status: 'pending',       // luôn chờ duyệt
      rejectReason: '',        // rỗng
    };

    // Nếu client cố gửi mấy field này thì cũng bỏ qua
    delete payload._id;
    delete payload.createdAt;
    delete payload.updatedAt;

    const listing = await Listing.create(payload);
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
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, 'Listing not found!'));
    }

    const isOwner = listing.userRef.toString() === req.user.id;

    // ✅ Chỉ cho ADMIN hoặc CHÍNH CHỦ sửa
    if (!req.user.isAdmin && !isOwner) {
      return next(errorHandler(401, 'You can only update your own listings!'));
    }

    // copy dữ liệu update từ body ra
    const updateData = { ...req.body };

    // ===== PHÂN BIỆT USER / ADMIN ĐỐI VỚI userRef & status =====

    if (!req.user.isAdmin) {
      // 👉 USER thường:
      // - luôn ép userRef = chính user đang đăng nhập
      // - không cho tự sửa status / rejectReason
      // - mỗi lần sửa -> đưa tin về pending, xoá lý do reject
      updateData.userRef = req.user.id;
      delete updateData.status;
      delete updateData.rejectReason;

      updateData.status = 'pending';
      updateData.rejectReason = '';
    } else {
      // 👉 ADMIN:

      // Nếu admin đang sửa tin của người khác: không cho đổi chủ tin
      if (!isOwner && 'userRef' in updateData) {
        delete updateData.userRef;
      }

      // Admin được phép chỉnh status + rejectReason, nhưng ta chuẩn hoá:
      if (updateData.status) {
        const allowed = ['pending', 'approved', 'rejected'];
        if (!allowed.includes(updateData.status)) {
          return next(errorHandler(400, 'Invalid status value'));
        }

        // nếu admin duyệt hoặc chuyển về pending -> xoá lý do reject
        if (updateData.status === 'approved' || updateData.status === 'pending') {
          updateData.rejectReason = '';
        }

        // nếu admin reject mà không gửi lý do thì giữ lý do cũ (nếu có)
        if (updateData.status === 'rejected' && updateData.rejectReason === undefined) {
          updateData.rejectReason = listing.rejectReason || '';
        }
      } else {
        // không gửi status -> không đụng rejectReason
        delete updateData.status;
      }
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      updateData,
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

// Public search: CHỈ hiển thị tin đã duyệt (approved)
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
      status: 'approved',      // 👈 chỉ tin đã duyệt
      source: 'user',          // 👈 chỉ tin user tự đăng (nếu muốn tách khỏi crawler)
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

//
// =============== ADMIN QUẢN LÝ TRẠNG THÁI LISTING USER ===============
//

// GET /api/listing/admin/user-listings?status=pending|approved|rejected
export const adminGetListingsByStatus = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      return next(errorHandler(403, 'Admin only!'));
    }

    const status = req.query.status || 'pending';
    const allowed = ['pending', 'approved', 'rejected'];
    if (!allowed.includes(status)) {
      return next(errorHandler(400, 'Invalid status value'));
    }

    const listings = await Listing.find({
      source: 'user',
      status,
    })
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

// PUT /api/listing/admin/status/:id
// body: { status: 'approved' | 'rejected' | 'pending', rejectReason?: string }
export const adminUpdateListingStatus = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      return next(errorHandler(403, 'Admin only!'));
    }

    const { status, rejectReason } = req.body;
    const allowed = ['pending', 'approved', 'rejected'];
    if (!allowed.includes(status)) {
      return next(errorHandler(400, 'Invalid status value'));
    }

    const update = { status };

    if (status === 'rejected') {
      update.rejectReason = rejectReason || '';
    } else {
      // approved / pending => clear lý do reject
      update.rejectReason = '';
    }

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );

    if (!listing) {
      return next(errorHandler(404, 'Listing not found!'));
    }

    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

//
// =============== ĐỌC DỮ LIỆU CRAWL TỪ MongoDB ===============
//

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
    // luôn ép price_value về Number
    let price = Number(doc.price_value);
    if (Number.isNaN(price)) price = 0;

    const text = (doc.price_text || '').toLowerCase();

    const isPerM2 =
      text.includes('/m2') ||
      text.includes('/m²') ||
      (text.includes('/m') && text.includes('triệu'));

    if (isPerM2) {
      let area = Number(doc.area_m2);
      if (!Number.isNaN(area) && area > 0) {
        price = price * area;
      }
    }

    sortKey = price;
  } else {
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
// PUT /api/listing/crawl/:id
// PUT /api/listing/crawl/:id
// body cho phép sửa: title, brief, address, area_m2,
// street_width, size_text, direction, price_text, price_value, image
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
    let {
      title,
      brief,
      address,
      area_m2,
      street_width,
      size_text,
      direction,
      price_text,
      price_value,
      image,
    } = req.body;

    const updateDoc = {};

    if (title !== undefined) updateDoc.title = title;
    if (brief !== undefined) updateDoc.brief = brief;
    if (address !== undefined) updateDoc.address = address;
    if (street_width !== undefined) updateDoc.street_width = street_width;
    if (size_text !== undefined) updateDoc.size_text = size_text;
    if (direction !== undefined) updateDoc.direction = direction;
    if (price_text !== undefined) updateDoc.price_text = price_text;
    if (image !== undefined) updateDoc.image = image;

    // ÉP KIỂU SỐ CHO area_m2
    if (area_m2 !== undefined) {
      const nArea = Number(area_m2);
      if (!Number.isNaN(nArea)) {
        updateDoc.area_m2 = nArea;
      }
      // nếu NaN thì bỏ qua để không ghi đè giá trị cũ
    }

    // ÉP KIỂU SỐ CHO price_value (dùng để sort high/low)
    if (price_value !== undefined) {
      const nPrice = Number(price_value);
      if (!Number.isNaN(nPrice)) {
        updateDoc.price_value = nPrice;
      }
      // nếu NaN thì bỏ qua, giữ nguyên giá trị cũ
    }

    updateDoc.updated_at = new Date();

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
