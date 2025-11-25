// src/pages/AdminListingManager.jsx
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminListingManager() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected'
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null); // id tin đang xử lý

  // chỉ cho admin dùng trang này
  const isAdmin = currentUser?.isAdmin === true;

  useEffect(() => {
    if (!isAdmin) return;

    const fetchListings = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(
          `/api/listing/admin/user-listings?status=${statusFilter}`
        );
        const data = await res.json();

        if (data.success === false) {
          setError(data.message || 'Không lấy được danh sách tin');
          setListings([]);
        } else {
          setListings(data || []);
        }
      } catch (err) {
        console.error(err);
        setError('Lỗi khi tải danh sách tin');
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [statusFilter, isAdmin]);

  if (!currentUser || !isAdmin) {
    return (
      <main className="p-4 max-w-3xl mx-auto">
        <p className="text-center text-red-600 font-semibold">
          Chỉ admin mới được truy cập trang này.
        </p>
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Về trang chủ
          </button>
        </div>
      </main>
    );
  }

  const getStatusLabel = (status) => {
    if (status === 'approved') return 'Đang hiển thị';
    if (status === 'pending') return 'Chờ duyệt';
    if (status === 'rejected') return 'Không duyệt';
    return status;
  };

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

  // Đổi trạng thái tin: approved / pending / rejected
  const handleChangeStatus = async (listingId, newStatus) => {
    if (!['pending', 'approved', 'rejected'].includes(newStatus)) return;

    let rejectReason = '';

    // nếu từ chối -> hỏi lý do
    if (newStatus === 'rejected') {
      // eslint-disable-next-line no-alert
      const reason = window.prompt(
        'Nhập lý do không duyệt (có thể để trống):',
        ''
      );
      if (reason === null) {
        // user bấm Cancel
        return;
      }
      rejectReason = reason.trim();
    }

    try {
      setActionLoadingId(listingId);
      const res = await fetch(`/api/listing/admin/status/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          rejectReason,
        }),
      });

      const data = await res.json();
      if (data.success === false) {
        alert(data.message || 'Cập nhật trạng thái thất bại');
        return;
      }

      // nếu admin đổi trạng thái xong, có 2 cách:
      // 1) refetch lại danh sách
      // 2) hoặc cập nhật ngay trong state
      // Ở đây: nếu trang đang filter theo status hiện tại,
      //   - nếu newStatus == statusFilter -> thay bản ghi
      //   - nếu khác -> remove khỏi list hiện tại
      setListings((prev) =>
        prev
          .map((l) => (l._id === listingId ? data : l))
          .filter((l) => l.status === statusFilter)
      );
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi cập nhật trạng thái');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Admin xoá luôn listing
  const handleDelete = async (listingId) => {
    if (!window.confirm('Bạn có chắc muốn xoá vĩnh viễn tin này?')) return;

    try {
      setActionLoadingId(listingId);
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
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <main className="p-3 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          Quản lý tin đăng của người dùng (Admin)
        </h1>
        <button
          onClick={() => navigate('/profile')}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Quay lại trang Profile
        </button>
      </div>

      {/* Thanh 3 trạng thái */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`border rounded-lg px-3 py-2 text-left transition ${
            statusFilter === 'pending'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-yellow-700">
              Chờ duyệt
            </span>
            <span className="text-xs font-bold text-yellow-800">
              {statusFilter === 'pending' ? listings.length : ''}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-yellow-400" />
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('approved')}
          className={`border rounded-lg px-3 py-2 text-left transition ${
            statusFilter === 'approved'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-green-700">
              Đang hiển thị
            </span>
            <span className="text-xs font-bold text-green-800">
              {statusFilter === 'approved' ? listings.length : ''}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-green-400" />
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('rejected')}
          className={`border rounded-lg px-3 py-2 text-left transition ${
            statusFilter === 'rejected'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-red-700">
              Không duyệt
            </span>
            <span className="text-xs font-bold text-red-800">
              {statusFilter === 'rejected' ? listings.length : ''}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-red-400" />
        </button>
      </div>

      {loading && (
        <p className="text-center text-gray-500">
          Đang tải danh sách tin {getStatusLabel(statusFilter)}...
        </p>
      )}

      {error && (
        <p className="text-center text-red-600 mb-4">{error}</p>
      )}

      {!loading && !error && listings.length === 0 && (
        <p className="text-center text-gray-500">
          Không có tin nào ở trạng thái {getStatusLabel(statusFilter)}.
        </p>
      )}

      {/* Danh sách tin theo trạng thái */}
      <div className="flex flex-col gap-4 mt-4">
        {listings.map((listing) => (
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
                <p className="text-slate-700 font-semibold hover:underline truncate max-w-xs">
                  {listing.name}
                </p>
                <p className="text-xs text-slate-500 truncate max-w-xs">
                  {listing.address}
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
              {/* Nút đổi trạng thái */}
              {listing.status !== 'approved' && (
                <button
                  disabled={actionLoadingId === listing._id}
                  onClick={() =>
                    handleChangeStatus(listing._id, 'approved')
                  }
                  className="text-green-700 uppercase disabled:opacity-60"
                >
                  {actionLoadingId === listing._id &&
                  statusFilter === 'approved'
                    ? 'Đang xử lý...'
                    : 'Duyệt'}
                </button>
              )}

              {listing.status !== 'pending' && (
                <button
                  disabled={actionLoadingId === listing._id}
                  onClick={() =>
                    handleChangeStatus(listing._id, 'pending')
                  }
                  className="text-yellow-700 uppercase disabled:opacity-60"
                >
                  Chuyển chờ duyệt
                </button>
              )}

              {listing.status !== 'rejected' && (
                <button
                  disabled={actionLoadingId === listing._id}
                  onClick={() =>
                    handleChangeStatus(listing._id, 'rejected')
                  }
                  className="text-red-700 uppercase disabled:opacity-60"
                >
                  Không duyệt
                </button>
              )}

              {/* Edit nội dung tin (dùng form cũ) */}
              <Link to={`/update-listing/${listing._id}`}>
                <button className="text-blue-700 uppercase">
                  Edit nội dung
                </button>
              </Link>

              {/* Xoá tin vĩnh viễn */}
              <button
                disabled={actionLoadingId === listing._id}
                onClick={() => handleDelete(listing._id)}
                className="text-red-800 uppercase disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
