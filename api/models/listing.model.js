// models/listing.model.js
import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    // ================== PHẦN CŨ (giữ nguyên) ==================
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    regularPrice: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
      required: true,
    },
    bathrooms: {
      type: Number,
      required: true,
    },
    bedrooms: {
      type: Number,
      required: true,
    },
    furnished: {
      type: Boolean,
      required: true,
    },
    parking: {
      type: Boolean,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    offer: {
      type: Boolean,
      required: true,
    },
    imageUrls: {
      type: Array,
      required: true,
    },
    userRef: {
      type: String,
      required: true,
    },

    // ================== TRẠNG THÁI DUYỆT TIN ==================
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending', // user tạo mới -> chờ duyệt
    },
    // nếu bị rejected thì admin sẽ ghi lý do ở đây
    rejectReason: {
      type: String,
      default: '',
    },

    // ================== PHẦN MỚI THÊM (PHỤC VỤ CRAWL) ==================
    // đánh dấu nguồn: user tự đăng hay data crawl
    source: {
      type: String,
      enum: ['user', 'crawler'],
      default: 'user',
    },

    // id bên website nguồn (vd: listing_id của alonhadat)
    externalId: {
      type: String,
    },

    // link bài đăng gốc trên website crawl
    originalUrl: {
      type: String,
    },

    // diện tích m2 (map từ area_m2 trong crawler)
    areaM2: {
      type: Number,
    },

    // giá dạng text (map từ price_text nếu cần hiển thị)
    priceText: {
      type: String,
    },

    // thời gian đăng tin (posted_time trong crawler)
    postedTime: {
      type: String,
    },

    // các thông tin bổ sung từ crawler
    duongTruocNha: {
      type: String,
    },
    phapLy: {
      type: String,
    },
  },
  { timestamps: true }
);

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;
