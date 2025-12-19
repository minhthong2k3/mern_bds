// src/pages/Profile.jsx
import { useSelector, useDispatch } from 'react-redux';
import { useRef, useState, useEffect } from 'react';

import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  signOutUserStart,
} from '../redux/user/userSlice';
import { Link, useNavigate } from 'react-router-dom';

export default function Profile() {
  const fileRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentUser, loading, error } = useSelector((state) => state.user);
  const isAdmin = currentUser?.isAdmin === true;

  const [file, setFile] = useState(undefined);
  const [filePerc, setFilePerc] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [showListingsError, setShowListingsError] = useState(false);
  const [userListings, setUserListings] = useState([]); // listing user
  const [crawledListings, setCrawledListings] = useState([]); // listing crawl

  const [users, setUsers] = useState([]); // danh sách user cho admin
  const [showUsersError, setShowUsersError] = useState(false);

  // 'listings' | 'users' | null
  const [activeSection, setActiveSection] = useState(null);

  // ====== IMAGEKIT upload avatar ======
  const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';
  const FALLBACK_PUBLIC_KEY = 'public_WJ0ZrBs/mTD1Fv70YslbRWmKGx0='; // fallback nếu backend không trả publicKey

  const uploadAvatarToImageKit = async (selectedFile) => {
    // reset UI
    setFilePerc(0);
    setFileUploadError(false);

    // basic validate
    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (!selectedFile) return;
    if (selectedFile.size > maxBytes) {
      setFileUploadError('Ảnh quá lớn (tối đa 2MB).');
      return;
    }

    try {
      // 1) lấy chữ ký upload từ server
      const authRes = await fetch('/api/imagekit/auth');
      const authData = await authRes.json();

      if (authData?.success === false) {
        setFileUploadError(authData.message || 'Không lấy được chữ ký upload ImageKit.');
        return;
      }

      const token = authData?.token;
      const expire = authData?.expire;
      const signature = authData?.signature;
      const publicKey = authData?.publicKey || FALLBACK_PUBLIC_KEY;

      if (!token || !expire || !signature) {
        setFileUploadError('Thiếu token/expire/signature từ server.');
        return;
      }

      // 2) upload lên ImageKit bằng XHR để có progress
      const uploaded = await new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('file', selectedFile);
        form.append(
          'fileName',
          `avatar_${currentUser?._id || 'user'}_${Date.now()}_${selectedFile.name}`
        );
        form.append('folder', '/avatars'); // bạn có thể đổi folder
        form.append('publicKey', publicKey);
        form.append('signature', signature);
        form.append('expire', String(expire));
        form.append('token', token);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', IMAGEKIT_UPLOAD_URL, true);

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const percent = Math.round((event.loaded / event.total) * 100);
          setFilePerc(percent);
        };

        xhr.onload = () => {
          try {
            const resJson = JSON.parse(xhr.responseText || '{}');
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(resJson);
            } else {
              reject(resJson);
            }
          } catch (e) {
            reject(new Error('Upload failed: invalid response'));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed: network error'));
        xhr.send(form);
      });

      // 3) set avatar url vào formData để submit update user
      if (!uploaded?.url) {
        setFileUploadError('Upload xong nhưng không nhận được URL ảnh.');
        return;
      }

      setFormData((prev) => ({ ...prev, avatar: uploaded.url }));
      setFilePerc(100);
    } catch (err) {
      console.error(err);
      setFileUploadError('Upload avatar thất bại.');
    }
  };

  // upload avatar khi chọn file
  useEffect(() => {
    if (file) uploadAvatarToImageKit(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(updateUserFailure(data.message));
        return;
      }
      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
    } catch (err) {
      dispatch(updateUserFailure(err.message));
    }
  };

  // user thường mới được tự xoá account
  const handleDeleteUser = async () => {
    if (isAdmin) return; // safety
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (err) {
      dispatch(deleteUserFailure(err.message));
    }
  };

  const handleSignOut = async () => {
    try {
      dispatch(signOutUserStart());
      const res = await fetch('/api/auth/signout');
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (err) {
      dispatch(deleteUserFailure(err.message));
    }
  };

  // ========== SHOW LISTINGS ==========
  const handleShowListings = async () => {
    try {
      setShowListingsError(false);
      setActiveSection('listings'); // đang xem listings
      setUsers([]); // ẩn danh sách user

      if (!isAdmin) {
        // user thường: chỉ lấy listing của chính mình
        const res = await fetch(`/api/user/listings/${currentUser._id}`);
        const data = await res.json();
        if (data.success === false) {
          setShowListingsError(true);
          return;
        }
        setUserListings(data);
        setCrawledListings([]);
      } else {
        // admin: lấy cả listing user + crawl
        const res = await fetch('/api/listing/admin/all');
        const data = await res.json();
        if (data.success === false) {
          setShowListingsError(true);
          return;
        }
        setUserListings(data.userListings || []);
        setCrawledListings(data.crawledListings || []);
      }
    } catch (err) {
      console.log(err);
      setShowListingsError(true);
    }
  };

  // xoá listing của user (admin hoặc chính chủ)
  const handleListingDelete = async (listingId) => {
    try {
      const res = await fetch(`/api/listing/delete/${listingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success === false) {
        console.log(data.message);
        return;
      }
      setUserListings((prev) => prev.filter((l) => l._id !== listingId));
    } catch (err) {
      console.log(err.message);
    }
  };

  // admin xoá tin crawl
  const handleCrawledDelete = async (id) => {
    try {
      const res = await fetch(`/api/listing/crawl/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success === false) {
        console.log(data.message);
        return;
      }
      setCrawledListings((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      console.log(err.message);
    }
  };

  // ========== SHOW USERS (ADMIN) ==========
  const handleShowUsers = async () => {
    if (!isAdmin) return;
    try {
      setShowUsersError(false);
      setActiveSection('users'); // đang xem users
      setUserListings([]); // ẩn listings
      setCrawledListings([]);

      const res = await fetch('/api/user/admin/all');
      const data = await res.json();
      if (data.success === false) {
        setShowUsersError(true);
        return;
      }
      setUsers(data);
    } catch (err) {
      console.log(err);
      setShowUsersError(true);
    }
  };

  const handleAdminDeleteUser = async (userId) => {
    try {
      const res = await fetch(`/api/user/admin/delete/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success === false) {
        console.log(data.message);
        return;
      }
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className='p-3 max-w-3xl mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>
        {isAdmin ? 'Admin Profile' : 'Profile'}
      </h1>

      {/* FORM UPDATE PROFILE (CHUNG CHO CẢ ADMIN & USER) */}
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input
          type='file'
          hidden
          accept='image/*'
          ref={fileRef}
          onChange={(e) => setFile(e.target.files?.[0])}
        />

        {/* Avatar + nút Quản lý tin (user thường) */}
        <div className='flex items-center justify-center gap-3 mt-2'>
          <img
            onClick={() => fileRef.current?.click()}
            src={formData.avatar || currentUser.avatar}
            alt='profile'
            className='rounded-full h-24 w-24 object-cover cursor-pointer'
          />
          {!isAdmin && (
            <button
              type='button'
              onClick={() => navigate('/my-listings')}
              className='text-xs sm:text-sm px-3 py-1 rounded-lg border border-sky-600 text-sky-700 hover:bg-sky-50'
            >
              Quản lý tin
            </button>
          )}
        </div>

        <p className='text-sm self-center'>
          {fileUploadError ? (
            <span className='text-red-700'>
              {typeof fileUploadError === 'string'
                ? fileUploadError
                : 'Error Image upload (image must be less than 2 mb)'}
            </span>
          ) : filePerc > 0 && filePerc < 100 ? (
            <span className='text-slate-700'>{`Uploading ${filePerc}%`}</span>
          ) : filePerc === 100 ? (
            <span className='text-green-700'>Image successfully uploaded!</span>
          ) : (
            ''
          )}
        </p>

        <input
          type='text'
          id='username'
          defaultValue={currentUser.username}
          placeholder='username'
          className='border p-3 rounded-lg'
          onChange={handleChange}
        />
        <input
          type='email'
          id='email'
          defaultValue={currentUser.email}
          placeholder='email'
          className='border p-3 rounded-lg'
          onChange={handleChange}
        />
        <input
          type='password'
          id='password'
          placeholder='password'
          className='border p-3 rounded-lg'
          onChange={handleChange}
        />

        <button
          disabled={loading}
          className='bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80'
        >
          {loading ? 'Loading...' : 'Update'}
        </button>

        {/* User thường mới có nút create listing + quản lý tin của mình */}
        {!isAdmin && (
          <>
            <Link
              to='/create-listing'
              className='bg-green-700 text-white p-3 rounded-lg uppercase text-center hover:opacity-95'
            >
              Create Listing
            </Link>

            <Link
              to='/my-listings'
              className='bg-slate-700 text-white p-3 rounded-lg uppercase text-center hover:opacity-95'
            >
              Quản lý tin của tôi
            </Link>
          </>
        )}
      </form>

      {/* DELETE / SIGN OUT */}
      <div className='flex justify-between mt-5'>
        {!isAdmin && (
          <span
            onClick={handleDeleteUser}
            className='text-red-700 cursor-pointer'
          >
            Delete account
          </span>
        )}
        <span onClick={handleSignOut} className='text-red-700 cursor-pointer'>
          Sign out
        </span>
      </div>

      <p className='text-red-700 mt-5'>{error || ''}</p>
      <p className='text-green-700 mt-5'>
        {updateSuccess ? 'User is updated successfully!' : ''}
      </p>

      {/* BUTTONS SHOW LISTINGS / USERS */}
      <div className='flex flex-col gap-2 mt-6'>
        <button
          onClick={handleShowListings}
          className='text-green-700 w-full border rounded-lg py-2 hover:bg-green-50'
        >
          {isAdmin ? 'Show ALL Listings (user + crawl)' : 'Show Listings'}
        </button>

        {isAdmin && (
          <>
            <button
              onClick={handleShowUsers}
              className='text-blue-700 w-full border rounded-lg py-2 hover:bg-blue-50'
            >
              Show Users
            </button>

            <Link
              to='/admin/listings'
              className='w-full text-center border rounded-lg py-2 mt-1 text-purple-700 hover:bg-purple-50 uppercase text-sm font-semibold'
            >
              Quản lý tin người dùng
            </Link>
          </>
        )}
      </div>

      {/* lỗi listings chỉ hiện khi đang xem tab listings */}
      {activeSection === 'listings' && (
        <p className='text-red-700 mt-3'>
          {showListingsError ? 'Error showing listings' : ''}
        </p>
      )}

      {/* lỗi users chỉ hiện khi đang xem tab users */}
      {isAdmin && activeSection === 'users' && (
        <p className='text-red-700 mt-1'>
          {showUsersError ? 'Error showing users' : ''}
        </p>
      )}

      {/* LISTINGS SECTION */}
      {activeSection === 'listings' && userListings.length > 0 && (
        <div className='flex flex-col gap-4 mt-7'>
          <h2 className='text-center text-2xl font-semibold'>
            {isAdmin ? 'User Listings' : 'Your Listings'}
          </h2>
          {userListings.map((listing) => (
            <div
              key={listing._id}
              className='border rounded-lg p-3 flex justify-between items-center gap-4'
            >
              <Link
                to={`/listing/${listing._id}`}
                className='flex items-center gap-3 flex-1'
              >
                <img
                  src={listing.imageUrls?.[0]}
                  alt='listing cover'
                  className='h-16 w-16 object-cover rounded'
                />
                <p className='text-slate-700 font-semibold hover:underline truncate'>
                  {listing.name}
                </p>
              </Link>

              <div className='flex flex-col items-end text-xs font-semibold gap-1'>
                <button
                  onClick={() => handleListingDelete(listing._id)}
                  className='text-red-700 uppercase'
                >
                  Delete
                </button>
                <Link to={`/update-listing/${listing._id}`}>
                  <button className='text-green-700 uppercase'>Edit</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRAWLED LISTINGS (ADMIN) */}
      {isAdmin &&
        activeSection === 'listings' &&
        crawledListings.length > 0 && (
          <div className='flex flex-col gap-4 mt-7'>
            <h2 className='text-center text-2xl font-semibold'>
              Crawled Listings
            </h2>
            {crawledListings.map((item) => (
              <div
                key={item._id}
                className='border rounded-lg p-3 flex justify-between items-center gap-4'
              >
                <Link
                  to={`/crawl/${item._id}`}
                  className='flex flex-col flex-1 overflow-hidden'
                >
                  <span className='font-semibold text-slate-800 truncate'>
                    {item.title}
                  </span>
                  <span className='text-sm text-slate-500 truncate'>
                    {item.address}
                  </span>
                  <span className='text-sm text-emerald-700 mt-1'>
                    {item.price_text}
                  </span>
                </Link>

                <div className='flex flex-col items-end text-xs font-semibold gap-1'>
                  <button
                    onClick={() => handleCrawledDelete(item._id)}
                    className='text-red-700 uppercase'
                  >
                    Delete
                  </button>

                  <Link to={`/admin/crawl-edit/${item._id}`}>
                    <button className='text-green-700 uppercase'>Edit</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* USERS LIST (ADMIN) */}
      {isAdmin && activeSection === 'users' && users.length > 0 && (
        <div className='flex flex-col gap-4 mt-7'>
          <h2 className='text-center text-2xl font-semibold'>Users</h2>
          {users.map((user) => (
            <div
              key={user._id}
              className='border rounded-lg p-3 flex justify-between items-center gap-4'
            >
              <div className='flex flex-col'>
                <span className='font-semibold'>{user.username}</span>
                <span className='text-sm text-slate-500'>{user.email}</span>
                {user.isAdmin && (
                  <span className='text-xs text-amber-600 font-bold'>
                    ADMIN
                  </span>
                )}
              </div>

              <div className='flex flex-col items-end gap-1 text-xs font-semibold'>
                {!user.isAdmin && (
                  <>
                    <button
                      onClick={() => handleAdminDeleteUser(user._id)}
                      className='text-red-700 uppercase'
                    >
                      Delete
                    </button>
                    <Link to={`/admin/users/${user._id}`}>
                      <button className='text-green-700 uppercase'>Edit</button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
