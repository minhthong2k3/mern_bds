// src/pages/Profile.jsx
import { useSelector, useDispatch } from 'react-redux';
import { useRef, useState, useEffect } from 'react';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { app } from '../firebase';
import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  signOutUserStart,
} from '../redux/user/userSlice';
import { Link } from 'react-router-dom';

export default function Profile() {
  const fileRef = useRef(null);
  const dispatch = useDispatch();
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

  // upload avatar
  useEffect(() => {
    if (file) handleFileUpload(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const handleFileUpload = (file) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + file.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFilePerc(Math.round(progress));
      },
      () => setFileUploadError(true),
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) =>
          setFormData((prev) => ({ ...prev, avatar: downloadURL }))
        );
      }
    );
  };

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
      setActiveSection('listings');   // đang xem listings
      setUsers([]);                   // ẩn danh sách user

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
      setActiveSection('users');      // đang xem users
      setUserListings([]);            // ẩn listings
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
          onChange={(e) => setFile(e.target.files[0])}
        />
        <img
          onClick={() => fileRef.current.click()}
          src={formData.avatar || currentUser.avatar}
          alt='profile'
          className='rounded-full h-24 w-24 object-cover cursor-pointer self-center mt-2'
        />
        <p className='text-sm self-center'>
          {fileUploadError ? (
            <span className='text-red-700'>
              Error Image upload (image must be less than 2 mb)
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

        {/* User thường mới có nút create listing */}
        {!isAdmin && (
          <Link
            to='/create-listing'
            className='bg-green-700 text-white p-3 rounded-lg uppercase text-center hover:opacity-95'
          >
            Create Listing
          </Link>
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
          <button
            onClick={handleShowUsers}
            className='text-blue-700 w-full border rounded-lg py-2 hover:bg-blue-50'
          >
            Show Users
          </button>
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
                {/* click vào text để xem chi tiết như cũ */}
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

                  {/* EDIT: mở trang form chỉnh sửa */}
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
                      <button className='text-green-700 uppercase'>
                        Edit
                      </button>
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
