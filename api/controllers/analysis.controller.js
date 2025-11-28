// api/controllers/analysis.controller.js
import mongoose from 'mongoose';
import { errorHandler } from '../utils/error.js';

// Lấy collection crawl gốc
function getCrawlCollection() {
  const collectionName = 'alonhadat_da_nang';
  return mongoose.connection.db.collection(collectionName);
}

// ---- Helper: tách phường từ address ----
// Ví dụ: "Đường Mỹ Đa Tây 11 , Phường Khuê Mỹ , Ngũ Hành Sơn , Đà Nẵng"
function extractWard(address = '') {
  if (!address) return null;

  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  // tìm mảnh có chữ "phường"
  const wardPart =
    parts.find((p) => p.toLowerCase().includes('phường')) || null;

  if (!wardPart) return null;

  // chuẩn hoá: viết hoa chữ đầu, luôn giữ chữ "Phường"
  const lower = wardPart.toLowerCase().replace('phường', '').trim();
  if (!lower) return null;
  const name =
    'Phường ' +
    lower
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(' ');

  return name;
}

// ---- Helper: tính giá/m2 từ doc crawl ----
function computePricePerM2(doc) {
  const rawPrice = Number(doc.price_value);
  const area = Number(doc.area_m2);

  if (!rawPrice || !area || area <= 0) return null;

  // Ở crawler ta đã quy ước price_value là tổng giá lô đất
  return rawPrice / area; // đơn vị: VND / m2
}

// ====================================================================
// GÓI 1: Phân tích theo phường
// GET /api/analysis/wards
// ====================================================================
export const wardAnalysis = async (req, res, next) => {
  try {
    const col = getCrawlCollection();
    const docs = await col
      .find({
        // chỉ lấy những tin có ít nhất address & price_value & area_m2
        address: { $exists: true, $ne: '' },
        price_value: { $exists: true },
        area_m2: { $exists: true },
      })
      .limit(800) // giới hạn ~700–800 tin
      .toArray();

    if (!docs.length) {
      return res.status(200).json({ total: 0, wards: [] });
    }

    const wardStats = {};
    let globalTotalPrice = 0;
    let globalTotalArea = 0;

    for (const doc of docs) {
      const wardName = extractWard(doc.address);
      if (!wardName) continue;

      const area = Number(doc.area_m2) || 0;
      const price = Number(doc.price_value) || 0;
      const pricePerM2 = computePricePerM2(doc);

      if (!wardStats[wardName]) {
        wardStats[wardName] = {
          ward: wardName,
          count: 0,
          totalArea: 0,
          totalPrice: 0,
          pricePerM2List: [],
        };
      }

      const w = wardStats[wardName];
      w.count += 1;
      w.totalArea += area;
      w.totalPrice += price;
      if (pricePerM2) w.pricePerM2List.push(pricePerM2);

      globalTotalArea += area;
      globalTotalPrice += price;
    }

    const totalListings = Object.values(wardStats).reduce(
      (sum, w) => sum + w.count,
      0
    );

    const wards = Object.values(wardStats)
      .map((w) => {
        const avgPricePerM2 =
          w.pricePerM2List.length > 0
            ? w.pricePerM2List.reduce((a, b) => a + b, 0) /
              w.pricePerM2List.length
            : null;

        return {
          ward: w.ward,
          count: w.count,
          percentage:
            totalListings > 0
              ? +(100 * (w.count / totalListings)).toFixed(2)
              : 0,
          totalArea: +w.totalArea.toFixed(2),
          totalPrice: w.totalPrice,
          avgPricePerM2: avgPricePerM2
            ? +avgPricePerM2.toFixed(0)
            : null,
        };
      })
      // sắp xếp theo giá/m2 giảm dần
      .sort((a, b) => (b.avgPricePerM2 || 0) - (a.avgPricePerM2 || 0));

    res.status(200).json({
      total: totalListings,
      globalTotalArea: +globalTotalArea.toFixed(2),
      globalTotalPrice,
      wards,
    });
  } catch (err) {
    next(errorHandler(500, err.message || 'Ward analysis failed'));
  }
};

// ====================================================================
// GÓI 3: Phân tích theo hướng nhà
// GET /api/analysis/directions
// ====================================================================
export const directionAnalysis = async (req, res, next) => {
  try {
    const col = getCrawlCollection();
    const docs = await col
      .find({
        direction: { $exists: true, $ne: '' },
        price_value: { $exists: true },
        area_m2: { $exists: true },
      })
      .limit(800)
      .toArray();

    if (!docs.length) {
      return res.status(200).json({ total: 0, directions: [] });
    }

    const dirStats = {};

    for (const doc of docs) {
      const rawDir = (doc.direction || '').trim();
      if (!rawDir) continue;

      const key = rawDir.toLowerCase(); // dùng key để gộp
      const label = rawDir; // giữ label hiển thị

      const area = Number(doc.area_m2) || 0;
      const price = Number(doc.price_value) || 0;
      const pricePerM2 = computePricePerM2(doc);

      if (!dirStats[key]) {
        dirStats[key] = {
          direction: label,
          count: 0,
          totalArea: 0,
          totalPrice: 0,
          pricePerM2List: [],
        };
      }

      const d = dirStats[key];
      d.count += 1;
      d.totalArea += area;
      d.totalPrice += price;
      if (pricePerM2) d.pricePerM2List.push(pricePerM2);
    }

    const totalListings = Object.values(dirStats).reduce(
      (sum, d) => sum + d.count,
      0
    );

    const directions = Object.values(dirStats)
      .map((d) => {
        const avgPricePerM2 =
          d.pricePerM2List.length > 0
            ? d.pricePerM2List.reduce((a, b) => a + b, 0) /
              d.pricePerM2List.length
            : null;

        return {
          direction: d.direction,
          count: d.count,
          percentage:
            totalListings > 0
              ? +(100 * (d.count / totalListings)).toFixed(2)
              : 0,
          totalArea: +d.totalArea.toFixed(2),
          totalPrice: d.totalPrice,
          avgPricePerM2: avgPricePerM2
            ? +avgPricePerM2.toFixed(0)
            : null,
        };
      })
      .sort((a, b) => (b.count || 0) - (a.count || 0));

    res.status(200).json({
      total: totalListings,
      directions,
    });
  } catch (err) {
    next(errorHandler(500, err.message || 'Direction analysis failed'));
  }
};

// ====================================================================
// GÓI 4: Phân tích theo độ rộng đường
// GET /api/analysis/street-width
// ====================================================================

// helper: chuyển "7,5m" -> 7.5
function parseStreetWidth(text = '') {
  if (!text) return null;
  const m = text.replace(',', '.').match(/([\d]+(?:\.\d+)?)/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  return Number.isNaN(v) ? null : v;
}

// bucket độ rộng thành các khoảng
function bucketStreetWidth(num) {
  if (num == null) return 'Không rõ';
  if (num < 4) return 'Dưới 4m';
  if (num < 6) return '4–6m';
  if (num < 8) return '6–8m';
  if (num < 10) return '8–10m';
  return 'Trên 10m';
}

export const streetWidthAnalysis = async (req, res, next) => {
  try {
    const col = getCrawlCollection();
    const docs = await col
      .find({
        street_width: { $exists: true, $ne: '' },
        price_value: { $exists: true },
        area_m2: { $exists: true },
      })
      .limit(800)
      .toArray();

    if (!docs.length) {
      return res.status(200).json({ total: 0, widths: [] });
    }

    const widthStats = {};

    for (const doc of docs) {
      const num = parseStreetWidth(doc.street_width);
      const bucket = bucketStreetWidth(num);

      const area = Number(doc.area_m2) || 0;
      const price = Number(doc.price_value) || 0;
      const pricePerM2 = computePricePerM2(doc);

      if (!widthStats[bucket]) {
        widthStats[bucket] = {
          label: bucket,
          count: 0,
          totalArea: 0,
          totalPrice: 0,
          pricePerM2List: [],
        };
      }

      const w = widthStats[bucket];
      w.count += 1;
      w.totalArea += area;
      w.totalPrice += price;
      if (pricePerM2) w.pricePerM2List.push(pricePerM2);
    }

    const totalListings = Object.values(widthStats).reduce(
      (sum, w) => sum + w.count,
      0
    );

    const widths = Object.values(widthStats)
      .map((w) => {
        const avgPricePerM2 =
          w.pricePerM2List.length > 0
            ? w.pricePerM2List.reduce((a, b) => a + b, 0) /
              w.pricePerM2List.length
            : null;

        return {
          bucket: w.label,
          count: w.count,
          percentage:
            totalListings > 0
              ? +(100 * (w.count / totalListings)).toFixed(2)
              : 0,
          totalArea: +w.totalArea.toFixed(2),
          totalPrice: w.totalPrice,
          avgPricePerM2: avgPricePerM2
            ? +avgPricePerM2.toFixed(0)
            : null,
        };
      })
      .sort((a, b) => (b.count || 0) - (a.count || 0));

    res.status(200).json({
      total: totalListings,
      widths,
    });
  } catch (err) {
    next(errorHandler(500, err.message || 'Street width analysis failed'));
  }
};
