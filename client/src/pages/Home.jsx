import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import SwiperCore from 'swiper';
import 'swiper/css/bundle';
import ListingItem from '../components/ListingItem';

export default function Home() {
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  const [crawledListings, setCrawledListings] = useState([]); // ✅ tin crawl

  SwiperCore.use([Navigation]);

  // ảnh mặc định nếu listing không có image
  const FALLBACK_IMG =
    'https://53.fs1.hubspotusercontent-na1.net/hub/53/hubfs/Sales_Blog/real-estate-business-compressor.jpg?width=595&height=400&name=real-estate-business-compressor.jpg';

  // chuẩn hoá tin crawl cho ListingItem
  const normalizeCrawled = (doc) => ({
    ...doc,
    source: 'alonhadat',
    name: doc.title,
    imageUrls: doc.image ? [doc.image] : [],
    address: doc.address,
  });

  useEffect(() => {
    const fetchOfferListings = async () => {
      try {
        const res = await fetch('/api/listing/get?offer=true&limit=6');
        const data = await res.json();
        setOfferListings(data);
        fetchRentListings();
      } catch (error) {
        console.log(error);
      }
    };

    const fetchRentListings = async () => {
      try {
        const res = await fetch('/api/listing/get?type=rent&limit=6');
        const data = await res.json();
        setRentListings(data);
        fetchSaleListings();
      } catch (error) {
        console.log(error);
      }
    };

    const fetchSaleListings = async () => {
      try {
        const res = await fetch('/api/listing/get?type=sale&limit=6');
        const data = await res.json();
        setSaleListings(data);
        fetchCrawledListings(); // ✅ sau khi load xong sale thì load crawl
      } catch (error) {
        console.log(error);
      }
    };

    const fetchCrawledListings = async () => {
      try {
        // lấy 6 tin crawl mới nhất (backend đã sort theo crawled_at)
        const res = await fetch('/api/listing/crawl?limit=6');
        const data = await res.json();
        setCrawledListings(data.map(normalizeCrawled));
      } catch (error) {
        console.log(error);
      }
    };

    fetchOfferListings();
  }, []);

  return (
    <div>
      {/* HERO TOP */}
      <div className="bg-slate-100">
        <div className="max-w-6xl mx-auto px-3 py-16 lg:py-24 flex flex-col gap-6">
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-emerald-600 uppercase">
            Bất động sản Đà Nẵng
          </p>

          <h1 className="text-slate-800 font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight">
            Tìm nơi ở tiếp theo
            <br />
            <span className="text-slate-500">phù hợp nhất cho bạn</span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-xl">
            DaNang Estate giúp bạn dễ dàng tìm kiếm, đăng và quản lý bất động sản
            tại Đà Nẵng – từ căn hộ, nhà phố cho đến đất nền và mặt bằng kinh doanh.
          </p>

          <div className="flex items-center gap-4">
            <Link
              to="/search"
              className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold bg-slate-800 text-white hover:bg-slate-900 transition"
            >
              Bắt đầu tìm kiếm
            </Link>
            <span className="hidden sm:inline text-xs sm:text-sm text-slate-500">
              Hoặc kéo xuống để xem các tin mới nhất
            </span>
          </div>
        </div>
      </div>

      {/* SWIPER – chỉ hiển thị khi có offerListings */}
      {offerListings && offerListings.length > 0 ? (
        <Swiper navigation>
          {offerListings.map((listing) => {
            const bgImg =
              (listing.imageUrls && listing.imageUrls[0]) || FALLBACK_IMG;

            return (
              <SwiperSlide key={listing._id}>
                <div
                  style={{
                    background: `url(${bgImg}) center no-repeat`,
                    backgroundSize: 'cover',
                  }}
                  className="h-[500px]"
                ></div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      ) : (
        // Nếu chưa có tin offer nào thì hiển thị 1 banner tĩnh
        <div
          className="h-[400px] w-full"
          style={{
            background: `url(${FALLBACK_IMG}) center no-repeat`,
            backgroundSize: 'cover',
          }}
        ></div>
      )}

      {/* listing results for offer, sale and rent */}
      <div className="max-w-6xl mx-auto p-3 flex flex-col gap-8 my-10">
        {offerListings && offerListings.length > 0 && (
          <div>
            <div className="my-3">
              <h2 className="text-2xl font-semibold text-slate-600">
                Tin ưu đãi mới nhất
              </h2>
              <Link
                className="text-sm text-blue-800 hover:underline"
                to={'/search?offer=true'}
              >
                Xem thêm tin ưu đãi
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {offerListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}

        {rentListings && rentListings.length > 0 && (
          <div>
            <div className="my-3">
              <h2 className="text-2xl font-semibold text-slate-600">
                Tin cho thuê mới nhất
              </h2>
              <Link
                className="text-sm text-blue-800 hover:underline"
                to={'/search?type=rent'}
              >
                Xem thêm tin cho thuê
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {rentListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}

        {saleListings && saleListings.length > 0 && (
          <div>
            <div className="my-3">
              <h2 className="text-2xl font-semibold text-slate-600">
                Tin bán mới nhất
              </h2>
              <Link
                className="text-sm text-blue-800 hover:underline"
                to={'/search?type=sale'}
              >
                Xem thêm tin bán
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {saleListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}

        {/* ✅ block tin crawl trên homepage */}
        {crawledListings && crawledListings.length > 0 && (
          <div>
            <div className="my-3">
              <h2 className="text-2xl font-semibold text-slate-600">
                Tin thu thập từ các nguồn khác (Đà Nẵng)
              </h2>
            <Link
                className="text-sm text-blue-800 hover:underline"
                to={'/search'}
              >
                Xem thêm tin crawl
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {crawledListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
