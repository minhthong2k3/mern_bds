// src/pages/UserListingManager.jsx
import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

export default function UserListingManager() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('approved'); // 'approved' | 'pending' | 'rejected'

  useEffect(() => {
    if (!currentUser?._id) return;

    const fetchListings = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`/api/user/listings/${currentUser._id}`);
        const data = await res.json();

        if (data.success === false) {
          setError(data.message || 'Cannot fetch listings');
          setListings([]);
        } else {
          setListings(data || []);
        }
      } catch (err) {
        console.error(err);
        setError('Error fetching listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [currentUser?._id]);

  // xoá listing (user tự xoá)
  const handleDelete = async (listingId) => {
    if (!window.confirm('Bạn có chắc muốn xoá tin này?')) return;
    try {
      const res = await fetch(`/api/listing/delete/${listingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success === false) {
        alert(data.message || 'Xoá tin thất bại');
        return;
      }
      setListings((prev) => prev.filter((l) => l._id !== listingId));
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi xoá tin');
    }
  };

  const filteredListings = useMemo(() => {
    return listings.filter((l) => l.status === activeFilter);
  }, [listings, activeFilter]);

  const getStatusBadge = (status) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          Đang hiển thị
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
          Chờ duyệt
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          Không duyệt
        </span>
      );
    }
    return null;
  };

  const countByStatus = useMemo(() => {
    const result = { approved: 0, pending: 0, rejected: 0 };
    listings.forEach((l) => {
      if (l.status && result[l.status] !== undefined) {
        result[l.status] += 1;
      }
    });
    return result;
  }, [listings]);

  if (!currentUser) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <p className="text-center text-red-600">
          Vui lòng đăng nhập để quản lý tin.
        </p>
      </div>
    );
  }

  return (
    <main className="p-3 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          Quản lý tin đăng của bạn
        </h1>
        <button
          onClick={() => navigate('/profile')}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Quay lại trang Profile
        </button>
      </div>

      {/* Thanh filter trạng thái */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <button
          type="button"
          onClick={() => setActiveFilter('approved')}
          className={`border rounded-lg px-3 py-2 text-left transition ${
            activeFilter === 'approved'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-green-700">
              Đang hiển thị
            </span>
            <span className="text-xs font-bold text-green-800">
              {countByStatus.approved}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-green-400" />
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('pending')}
          className={`border rounded-lg px-3 py-2 text-left transition ${
            activeFilter === 'pending'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-yellow-700">
              Chờ duyệt
            </span>
            <span className="text-xs font-bold text-yellow-800">
              {countByStatus.pending}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-yellow-400" />
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('rejected')}
          className={`border rounded-lg px-3 py-2 text-left transition ${
            activeFilter === 'rejected'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-red-700">
              Không duyệt
            </span>
            <span className="text-xs font-bold text-red-800">
              {countByStatus.rejected}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-red-400" />
        </button>
      </div>

      {loading && (
        <p className="text-center text-gray-500">Đang tải danh sách tin...</p>
      )}
      {error && (
        <p className="text-center text-red-600 mb-4">{error}</p>
      )}

      {!loading && filteredListings.length === 0 && (
        <p className="text-center text-gray-500">
          Không có tin nào ở trạng thái này.
        </p>
      )}

      {/* Danh sách tin theo trạng thái đã chọn */}
      <div className="flex flex-col gap-4 mt-4">
        {filteredListings.map((listing) => (
          <div
            key={listing._id}
            className="border rounded-lg p-3 flex justify-between items-center gap-4"
          >
            <Link
              to={`/listing/${listing._id}`}
              className="flex items-center gap-3 flex-1"
            >
              <img
                src={listing.imageUrls?.[0]}
                alt="listing cover"
                className="h-16 w-16 object-cover rounded"
              />
              <div className="flex flex-col gap-1">
                <p className="text-slate-700 font-semibold hover:underline truncate">
                  {listing.name}
                </p>
                <div>{getStatusBadge(listing.status)}</div>
                {listing.status === 'rejected' &&
                  listing.rejectReason && (
                    <p className="text-xs text-red-600">
                      Lý do: {listing.rejectReason}
                    </p>
                  )}
              </div>
            </Link>

            <div className="flex flex-col items-end text-xs font-semibold gap-1">
              <button
                onClick={() => handleDelete(listing._id)}
                className="text-red-700 uppercase"
              >
                Delete
              </button>
              <Link to={`/update-listing/${listing._id}`}>
                <button className="text-green-700 uppercase">
                  Edit
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
