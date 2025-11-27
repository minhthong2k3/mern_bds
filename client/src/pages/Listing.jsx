// src/pages/Listing.jsx
import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore from 'swiper';
import { useSelector } from 'react-redux';
import { Navigation } from 'swiper/modules';
import 'swiper/css/bundle';
import {
  FaBath,
  FaBed,
  FaChair,
  FaMapMarkerAlt,
  FaParking,
  FaShare,
} from 'react-icons/fa';
import Contact from '../components/Contact';

export default function Listing() {
  SwiperCore.use([Navigation]);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState(false);

  const params = useParams();
  const location = useLocation();
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(false);

        // nếu URL là /crawl/:id thì gọi API crawl, ngược lại gọi API listing gốc
        const isCrawledDetail = location.pathname.startsWith('/crawl/');
        const endpoint = isCrawledDetail
          ? `/api/listing/crawl/${params.listingId}`
          : `/api/listing/get/${params.listingId}`;

        const res = await fetch(endpoint);
        const data = await res.json();
        if (data.success === false) {
          setError(true);
          setLoading(false);
          return;
        }

        // đánh dấu nguồn để phía UI biết đây là tin crawl hay tin user
        const normalized = isCrawledDetail
          ? { ...data, source: 'alonhadat' }
          : data;

        setListing(normalized);
        setLoading(false);
        setError(false);
      } catch (error) {
        console.log(error);
        setError(true);
        setLoading(false);
      }
    };
    fetchListing();
  }, [params.listingId, location.pathname]);

  // ---- Fallback & helper cho cả listing gốc + dữ liệu crawl ----
  const defaultImage =
    'https://53.fs1.hubspotusercontent-na1.net/hub/53/hubfs/Sales_Blog/real-estate-business-compressor.jpg?width=595&height=400&name=real-estate-business-compressor.jpg';

  const isCrawled = listing && listing.source === 'alonhadat';

  // Mảng ảnh hiển thị trong Swiper
  const images =
    listing &&
    (Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0
      ? listing.imageUrls
      : listing.image
      ? [listing.image]
      : listing.thumbnail
      ? [listing.thumbnail]
      : [defaultImage]);

  // Tiêu đề
  const displayName =
    listing && (listing.name || listing.title || 'Listing');

  // Mô tả
  const displayDescription =
    listing && (listing.description || listing.brief || '');

  // Giá
  let displayPrice = '';
  if (listing) {
    if (listing.regularPrice !== undefined) {
      const priceNumber = listing.offer
        ? listing.discountPrice
        : listing.regularPrice;
      displayPrice = `$${priceNumber.toLocaleString('en-US')}${
        listing.type === 'rent' ? ' / month' : ''
      }`;
    } else if (listing.price_text) {
      // tin crawl dùng price_text
      displayPrice = listing.price_text;
    } else if (listing.price_value) {
      displayPrice =
        listing.price_value.toLocaleString('vi-VN') + ' (giá trị)';
    } else if (listing.price) {
      // trường hợp price là string crawl về
      displayPrice = listing.price;
    }
  }

  // Có info bed/bath/parking/furnished không?
  const hasBed = listing && typeof listing.bedrooms === 'number';
  const hasBath = listing && typeof listing.bathrooms === 'number';
  const hasParking = listing && typeof listing.parking === 'boolean';
  const hasFurnished = listing && typeof listing.furnished === 'boolean';

  return (
    <main>
      {loading && <p className='text-center my-7 text-2xl'>Loading...</p>}
      {error && (
        <p className='text-center my-7 text-2xl'>Something went wrong!</p>
      )}
      {listing && !loading && !error && (
        <div>
          {/* Ảnh */}
          <Swiper navigation>
            {images.map((url) => (
              <SwiperSlide key={url}>
                <div
                  className='h-[550px]'
                  style={{
                    background: `url(${url}) center no-repeat`,
                    backgroundSize: 'cover',
                  }}
                ></div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Nút share */}
          <div className='fixed top-[13%] right-[3%] z-10 border rounded-full w-12 h-12 flex justify-center items-center bg-slate-100 cursor-pointer'>
            <FaShare
              className='text-slate-500'
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                }, 2000);
              }}
            />
          </div>
          {copied && (
            <p className='fixed top-[23%] right-[5%] z-10 rounded-md bg-slate-100 p-2'>
              Link copied!
            </p>
          )}

          {/* Nội dung chi tiết */}
          <div className='flex flex-col max-w-4xl mx-auto p-3 my-7 gap-4'>
            {/* Tiêu đề + giá */}
            <p className='text-2xl font-semibold'>
              {displayName}
              {displayPrice && (
                <>
                  {' '}
                  - <span>{displayPrice}</span>
                </>
              )}
            </p>

            {/* Địa chỉ */}
            {listing.address && (
              <p className='flex items-center mt-6 gap-2 text-slate-600 text-sm'>
                <FaMapMarkerAlt className='text-green-700' />
                {listing.address}
              </p>
            )}

            {/* Thông tin riêng cho tin crawl – dùng field mới */}
            {isCrawled && (
              <div className='mt-4 border rounded-lg p-4 bg-slate-50'>
                <h2 className='text-lg font-semibold mb-2 text-slate-700'>
                  Thông tin bất động sản (nguồn thu thập)
                </h2>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-sm text-slate-700'>
                  {/* Giá hiển thị */}
                  {listing.price_text && (
                    <p>
                      <span className='font-semibold'>Giá: </span>
                      {listing.price_text}
                    </p>
                  )}

                  {/* Diện tích */}
                  {(listing.area_m2 || listing.area_text) && (
                    <p>
                      <span className='font-semibold'>Diện tích: </span>
                      {listing.area_m2
                        ? `${listing.area_m2} m²`
                        : listing.area_text}
                    </p>
                  )}

                  {/* Kích thước (size_text) */}
                  {listing.size_text && (
                    <p>
                      <span className='font-semibold'>Kích thước: </span>
                      {listing.size_text}
                    </p>
                  )}

                  {/* Đường vào nhà (street_width) */}
                  {listing.street_width && (
                    <p>
                      <span className='font-semibold'>Đường vào nhà: </span>
                      {listing.street_width}
                    </p>
                  )}

                  {/* Hướng (direction) */}
                  {listing.direction && (
                    <p>
                      <span className='font-semibold'>Hướng: </span>
                      {listing.direction}
                    </p>
                  )}

                  {/* Thời điểm đăng nếu có */}
                  {listing.posted_time && (
                    <p>
                      <span className='font-semibold'>Thời điểm đăng: </span>
                      {listing.posted_time}
                    </p>
                  )}
                </div>

                {/* Link bài gốc nếu có */}
                {listing.url && (
                  <a
                    href={listing.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-block mt-3 text-sm text-blue-700 hover:underline'
                  >
                    Xem bài gốc trên Alonhadat
                  </a>
                )}
              </div>
            )}

            {/* Badge chỉ hiển thị nếu là listing gốc (có type/offer) */}
            {listing.type && (
              <div className='flex gap-4'>
                <p className='bg-red-900 w-full max-w-[200px] text-white text-center p-1 rounded-md'>
                  {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
                </p>
                {listing.offer && listing.regularPrice !== undefined && (
                  <p className='bg-green-900 w-full max-w-[200px] text-white text-center p-1 rounded-md'>
                    $
                    {(
                      +listing.regularPrice - +listing.discountPrice
                    ).toLocaleString('en-US')}{' '}
                    OFF
                  </p>
                )}
              </div>
            )}

            {/* Mô tả */}
            {displayDescription && (
              <p className='text-slate-800'>
                <span className='font-semibold text-black'>
                  Description -{' '}
                </span>
                {displayDescription}
              </p>
            )}

            {/* Thông tin tiện ích chỉ hiển thị khi có dữ liệu */}
            {(hasBed || hasBath || hasParking || hasFurnished) && (
              <ul className='text-green-900 font-semibold text-sm flex flex-wrap items-center gap-4 sm:gap-6'>
                {hasBed && (
                  <li className='flex items-center gap-1 whitespace-nowrap '>
                    <FaBed className='text-lg' />
                    {listing.bedrooms > 1
                      ? `${listing.bedrooms} beds `
                      : `${listing.bedrooms} bed `}
                  </li>
                )}
                {hasBath && (
                  <li className='flex items-center gap-1 whitespace-nowrap '>
                    <FaBath className='text-lg' />
                    {listing.bathrooms > 1
                      ? `${listing.bathrooms} baths `
                      : `${listing.bathrooms} bath `}
                  </li>
                )}
                {hasParking && (
                  <li className='flex items-center gap-1 whitespace-nowrap '>
                    <FaParking className='text-lg' />
                    {listing.parking ? 'Parking spot' : 'No Parking'}
                  </li>
                )}
                {hasFurnished && (
                  <li className='flex items-center gap-1 whitespace-nowrap '>
                    <FaChair className='text-lg' />
                    {listing.furnished ? 'Furnished' : 'Unfurnished'}
                  </li>
                )}
              </ul>
            )}

            {/* Contact landlord: chỉ dùng cho listing gốc (có userRef) */}
            {currentUser &&
              listing.userRef &&
              listing.userRef !== currentUser._id &&
              !contact && (
                <button
                  onClick={() => setContact(true)}
                  className='bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 p-3'
                >
                  Contact landlord
                </button>
              )}
            {contact && !isCrawled && <Contact listing={listing} />}
          </div>
        </div>
      )}
    </main>
  );
}
