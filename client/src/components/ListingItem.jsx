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

  // giá hiển thị
  let displayPrice = '';
  if (typeof listing.regularPrice === 'number') {
    const priceNumber = listing.offer
      ? listing.discountPrice ?? listing.regularPrice
      : listing.regularPrice;
    displayPrice = `$${priceNumber.toLocaleString('en-US')}`;
  } else if (listing.price_text) {
    displayPrice = listing.price_text;
  } else if (listing.price) {
    displayPrice = listing.price;
  }

  const isRent = listing.type === 'rent';

  return (
    <div className='bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden rounded-lg w-full sm:w-[330px]'>
      <Link to={linkTo}>
        <img
          src={imageSrc}
          alt='listing cover'
          className='h-[320px] sm:h-[220px] w-full object-cover hover:scale-105 transition-scale duration-300'
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
            <p className='text-slate-500 mt-2 font-semibold '>
              {displayPrice}
              {isRent && ' / month'}
            </p>
          )}

          {/* Bed/Bath chỉ hiển thị nếu có dữ liệu */}
          <div className='text-slate-700 flex gap-4'>
            {typeof listing.bedrooms === 'number' && (
              <div className='font-bold text-xs'>
                {listing.bedrooms > 1
                  ? `${listing.bedrooms} beds`
                  : `${listing.bedrooms} bed`}
              </div>
            )}
            {typeof listing.bathrooms === 'number' && (
              <div className='font-bold text-xs'>
                {listing.bathrooms > 1
                  ? `${listing.bathrooms} baths`
                  : `${listing.bathrooms} bath`}
              </div>
            )}
          </div>

          {/* Tag phân biệt tin crawl (tuỳ thích) */}
          {isCrawled && (
            <span className='mt-1 text-[11px] font-semibold text-orange-600'>
              Tin crawl
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
