import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ListingItem from '../components/ListingItem';

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebardata, setSidebardata] = useState({
    searchTerm: '',
    type: 'all',
    parking: false,
    furnished: false,
    offer: false,
    sort: 'createdAt',
    order: 'desc',
  });

  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);
  const [showMore, setShowMore] = useState(false);

  // ====== DỮ LIỆU CRAWL + PHÂN TRANG ======
  const [crawledListings, setCrawledListings] = useState([]);
  const [crawledPage, setCrawledPage] = useState(1);

  const CRAWLED_PAGE_SIZE = 20;
  const CRAWLED_MAX_TOTAL = 800; // tối đa 800 tin
  const CRAWLED_MAX_PAGES = CRAWLED_MAX_TOTAL / CRAWLED_PAGE_SIZE; // 40 trang

  // map dữ liệu crawl về format mà ListingItem hiểu được
  const normalizeCrawled = (doc) => ({
    ...doc,
    source: 'alonhadat', // đánh dấu là tin crawl
    name: doc.title, // ListingItem đang dùng listing.name
    imageUrls: doc.image ? [doc.image] : [], // hiện tại image = null thì sẽ dùng fallback trong ListingItem
    address: doc.address,
    // KHÔNG set regularPrice ở đây để tránh bị hiển thị $0
    // giá sẽ dùng doc.price_text / price_value trong ListingItem
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    const typeFromUrl = urlParams.get('type');
    const parkingFromUrl = urlParams.get('parking');
    const furnishedFromUrl = urlParams.get('furnished');
    const offerFromUrl = urlParams.get('offer');
    const sortFromUrl = urlParams.get('sort');
    const orderFromUrl = urlParams.get('order');

    // đọc trang hiện tại của tin crawl từ URL
    const crawlPageFromUrl = parseInt(urlParams.get('crawlPage') || '1', 10);
    const safePage =
      Number.isNaN(crawlPageFromUrl) || crawlPageFromUrl < 1
        ? 1
        : Math.min(crawlPageFromUrl, CRAWLED_MAX_PAGES);
    setCrawledPage(safePage);

    if (
      searchTermFromUrl ||
      typeFromUrl ||
      parkingFromUrl ||
      furnishedFromUrl ||
      offerFromUrl ||
      sortFromUrl ||
      orderFromUrl
    ) {
      setSidebardata({
        searchTerm: searchTermFromUrl || '',
        type: typeFromUrl || 'all',
        parking: parkingFromUrl === 'true',
        furnished: furnishedFromUrl === 'true',
        offer: offerFromUrl === 'true',
        sort: sortFromUrl || 'createdAt',
        order: orderFromUrl || 'desc',
      });
    }

    const fetchListings = async () => {
      setLoading(true);
      setShowMore(false);
      const searchQuery = urlParams.toString(); // có cả sort & order
      const res = await fetch(`/api/listing/get?${searchQuery}`);
      const data = await res.json();
      if (data.length > 8) {
        setShowMore(true);
      } else {
        setShowMore(false);
      }
      setListings(data);
      setLoading(false);
    };

    const fetchCrawledListings = async (page) => {
      try {
        const crawlParams = new URLSearchParams(urlParams.toString());
        const startIndex = (page - 1) * CRAWLED_PAGE_SIZE;

        crawlParams.set('startIndex', startIndex.toString());
        crawlParams.set('limit', CRAWLED_PAGE_SIZE.toString());

        const res = await fetch(`/api/listing/crawl?${crawlParams.toString()}`);
        const data = await res.json();

        setCrawledListings(data.map(normalizeCrawled));
      } catch (err) {
        console.error('Error fetching crawled listings:', err);
      }
    };

    fetchListings();
    fetchCrawledListings(safePage);
  }, [location.search]);

  const handleChange = (e) => {
    if (
      e.target.id === 'all' ||
      e.target.id === 'rent' ||
      e.target.id === 'sale'
    ) {
      setSidebardata({ ...sidebardata, type: e.target.id });
    }

    if (e.target.id === 'searchTerm') {
      setSidebardata({ ...sidebardata, searchTerm: e.target.value });
    }

    if (
      e.target.id === 'parking' ||
      e.target.id === 'furnished' ||
      e.target.id === 'offer'
    ) {
      setSidebardata({
        ...sidebardata,
        [e.target.id]: e.target.checked ? true : false,
      });
    }

    if (e.target.id === 'sort_order') {
      const sort = e.target.value.split('_')[0] || 'createdAt';
      const order = e.target.value.split('_')[1] || 'desc';
      setSidebardata({ ...sidebardata, sort, order });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();
    urlParams.set('searchTerm', sidebardata.searchTerm);
    urlParams.set('type', sidebardata.type);
    urlParams.set('parking', sidebardata.parking);
    urlParams.set('furnished', sidebardata.furnished);
    urlParams.set('offer', sidebardata.offer);
    urlParams.set('sort', sidebardata.sort);
    urlParams.set('order', sidebardata.order);

    // reset về trang 1 khi search/filter
    urlParams.set('crawlPage', '1');

    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  const onShowMoreClick = async () => {
    const numberOfListings = listings.length;
    const startIndex = numberOfListings;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('startIndex', startIndex);
    const searchQuery = urlParams.toString();
    const res = await fetch(`/api/listing/get?${searchQuery}`);
    const data = await res.json();
    if (data.length < 9) {
      setShowMore(false);
    }
    setListings([...listings, ...data]);
  };

  // đổi trang tin crawl
  const handleCrawledPageChange = (page) => {
    if (page < 1 || page > CRAWLED_MAX_PAGES) return;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('crawlPage', page.toString());
    navigate(`/search?${urlParams.toString()}`);
  };

  return (
    <div className='flex flex-col md:flex-row w-full'>
      {/* SIDEBAR – rộng hơn, ăn hết cột bên trái */}
      <div className='w-full md:w-[320px] lg:w-[360px] p-7 border-b-2 md:border-r-2 md:min-h-screen flex-shrink-0'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-8'>
          <div className='flex flex-col gap-2'>
            <label className='font-semibold'>Search Term:</label>
            <input
              type='text'
              id='searchTerm'
              placeholder='Search...'
              className='border rounded-lg p-3 w-full'
              value={sidebardata.searchTerm}
              onChange={handleChange}
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-semibold'>Type:</label>
            <div className='flex flex-wrap gap-3'>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='all'
                  className='w-5'
                  onChange={handleChange}
                  checked={sidebardata.type === 'all'}
                />
                <span>Rent & Sale</span>
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='rent'
                  className='w-5'
                  onChange={handleChange}
                  checked={sidebardata.type === 'rent'}
                />
                <span>Rent</span>
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='sale'
                  className='w-5'
                  onChange={handleChange}
                  checked={sidebardata.type === 'sale'}
                />
                <span>Sale</span>
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='offer'
                  className='w-5'
                  onChange={handleChange}
                  checked={sidebardata.offer}
                />
                <span>Offer</span>
              </label>
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-semibold'>Amenities:</label>
            <div className='flex flex-wrap gap-3'>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='parking'
                  className='w-5'
                  onChange={handleChange}
                  checked={sidebardata.parking}
                />
                <span>Parking</span>
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='furnished'
                  className='w-5'
                  onChange={handleChange}
                  checked={sidebardata.furnished}
                />
                <span>Furnished</span>
              </label>
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <label className='font-semibold'>Sort:</label>
            <select
              onChange={handleChange}
              defaultValue={'createdAt_desc'}
              id='sort_order'
              className='border rounded-lg p-3'
            >
              <option value='regularPrice_desc'>Price high to low</option>
              <option value='regularPrice_asc'>Price low to hight</option>
              <option value='createdAt_desc'>Latest</option>
              <option value='createdAt_asc'>Oldest</option>
            </select>
          </div>

          <button className='bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95'>
            Search
          </button>
        </form>
      </div>

      {/* KẾT QUẢ LISTING USER */}
      <div className='flex-1 min-w-0'>
        <h1 className='text-3xl font-semibold border-b p-3 text-slate-700 mt-5'>
          Listing results:
        </h1>

        <div className='p-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {!loading && listings.length === 0 && (
            <p className='text-xl text-slate-700'>No listing found!</p>
          )}
          {loading && (
            <p className='text-xl text-slate-700 text-center w-full'>
              Loading...
            </p>
          )}

          {!loading &&
            listings &&
            listings.map((listing) => (
              <ListingItem key={listing._id} listing={listing} />
            ))}

          {showMore && (
            <button
              onClick={onShowMoreClick}
              className='text-green-700 hover:underline p-7 text-center col-span-full'
            >
              Show more
            </button>
          )}
        </div>

        {/* Crawled listings */}
        {crawledListings.length > 0 && (
          <>
            <h1 className='text-3xl font-semibold border-b p-3 text-slate-700 mt-5'>
              Crawled listings (Đà Nẵng):
            </h1>
            <div className='p-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {crawledListings.map((listing) => (
                <ListingItem key={listing._id} listing={listing} />
              ))}
            </div>

            {/* PHÂN TRANG – DÃY SỐ TRANG */}
            <div className='flex justify-center items-center gap-2 flex-wrap pb-8'>
              <button
                className='px-3 py-1 text-sm border rounded-full disabled:opacity-40'
                onClick={() => handleCrawledPageChange(crawledPage - 1)}
                disabled={crawledPage === 1}
              >
                Trước
              </button>

              {Array.from({ length: CRAWLED_MAX_PAGES }, (_, idx) => {
                const page = idx + 1;
                const isActive = page === crawledPage;
                return (
                  <button
                    key={page}
                    onClick={() => handleCrawledPageChange(page)}
                    className={`px-3 py-1 text-sm rounded-full border min-w-[36px] text-center ${
                      isActive
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                className='px-3 py-1 text-sm border rounded-full disabled:opacity-40'
                onClick={() => handleCrawledPageChange(crawledPage + 1)}
                disabled={
                  crawledPage === CRAWLED_MAX_PAGES ||
                  crawledListings.length < CRAWLED_PAGE_SIZE
                }
              >
                Sau
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
