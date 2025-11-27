import { Link } from 'react-router-dom';
import { MdLocationOn } from 'react-icons/md';

export default function ListingItem({ listing }) {
  const fallbackImage =
    'https://53.fs1.hubspotusercontent-na1.net/hub/53/hubfs/Sales_Blog/real-estate-business-compressor.jpg?width=595&height=400&name=real-estate-business-compressor.jpg';

  // xác định có phải tin crawl không
  const isCrawled = listing.source === 'alonhadat';

  // route chi tiết
  const linkTo = isCrawled
    ? `/crawl/${listing._id}`
    : `/listing/${listing._id}`;

  // ảnh
  const imageSrc =
    listing.imageUrls?.[0] ||
    listing.thumbnail ||
    listing.image ||
    fallbackImage;

  // tên hiển thị
  const displayName = listing.name || listing.title || 'Listing';

  // mô tả (nếu có)
  const displayDescription = listing.description || listing.brief || '';

  // ====== GIÁ HIỂN THỊ ======
  let displayPrice = '';
  if (!isCrawled && typeof listing.regularPrice === 'number') {
    // listing user
    const priceNumber = listing.offer
      ? listing.discountPrice ?? listing.regularPrice
      : listing.regularPrice;
    displayPrice = `$${priceNumber.toLocaleString('en-US')}${
      listing.type === 'rent' ? ' / month' : ''
    }`;
  } else {
    // tin crawl
    if (listing.price_text) {
      displayPrice = listing.price_text;
    } else if (typeof listing.price_value === 'number') {
      displayPrice = listing.price_value.toLocaleString('vi-VN') + ' đ';
    } else if (listing.price) {
      displayPrice = listing.price;
    }
  }

  // ====== DÒNG INFO PHỤ ======
  let subInfo = '';
  if (isCrawled) {
    const area =
      listing.area_text ||
      (listing.area_m2 ? `${listing.area_m2} m²` : '');
    const street = listing.street_width || '';
    const size = listing.size_text || '';
    const direction = listing.direction || '';

    subInfo = [area, street, size, direction].filter(Boolean).join(' • ');
  } else {
    const bed =
      typeof listing.bedrooms === 'number'
        ? `${listing.bedrooms} ${listing.bedrooms > 1 ? 'beds' : 'bed'}`
        : '';
    const bath =
      typeof listing.bathrooms === 'number'
        ? `${listing.bathrooms} ${listing.bathrooms > 1 ? 'baths' : 'bath'}`
        : '';
    subInfo = [bed, bath].filter(Boolean).join(' • ');
  }

  return (
    <div className='bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden rounded-lg w-full sm:w-[330px]'>
      <Link to={linkTo}>
        <img
          src={imageSrc}
          alt='listing cover'
          className='h-[320px] sm:h-[220px] w-full object-cover hover:scale-105 transition-transform duration-300'
        />
        <div className='p-3 flex flex-col gap-2 w-full'>
          {/* Tên */}
          <p className='truncate text-lg font-semibold text-slate-700'>
            {displayName}
          </p>

          {/* Địa chỉ */}
          {listing.address && (
            <div className='flex items-center gap-1'>
              <MdLocationOn className='h-4 w-4 text-green-700' />
              <p className='text-sm text-gray-600 truncate w-full'>
                {listing.address}
              </p>
            </div>
          )}

          {/* Mô tả (nếu có) */}
          {displayDescription && (
            <p className='text-sm text-gray-600 line-clamp-2'>
              {displayDescription}
            </p>
          )}

          {/* Giá (nếu có) */}
          {displayPrice && (
            <p className='text-slate-500 mt-2 font-semibold'>
              {displayPrice}
            </p>
          )}

          {/* Info phụ (bed/bath hoặc area/đường/kích thước/hướng) */}
          {subInfo && (
            <p className='text-xs text-slate-500 truncate'>
              {subInfo}
            </p>
          )}

          {/* Tag phân biệt tin crawl / tin user */}
          <div className='mt-1 flex items-center gap-2 text-[11px]'>
            {isCrawled ? (
              <span className='px-2 py-1 bg-amber-50 text-amber-700 rounded-full'>
                Tin crawl (alonhadat)
              </span>
            ) : (
              <>
                {listing.type && (
                  <span className='px-2 py-1 bg-slate-100 text-slate-700 rounded-full'>
                    {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
                  </span>
                )}
                {listing.offer && (
                  <span className='px-2 py-1 bg-green-100 text-green-700 rounded-full'>
                    Offer
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
