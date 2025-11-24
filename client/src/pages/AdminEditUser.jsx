// src/pages/AdminEditUser.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

export default function AdminEditUser() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '', // new password (optional)
  });

  const [listings, setListings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // --- Fetch user info + listings ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [userRes, listingRes] = await Promise.all([
          fetch(`/api/user/${userId}`),
          fetch(`/api/user/admin/${userId}/listings`),
        ]);

        const userData = await userRes.json();
        const listingData = await listingRes.json();

        if (userData.success === false) {
          setError(userData.message || 'Failed to load user');
          setLoading(false);
          return;
        }

        setFormData({
          username: userData.username || '',
          email: userData.email || '',
          password: '',
        });

        if (Array.isArray(listingData)) {
          setListings(listingData);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // --- Handlers ---
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      // chỉ gửi các field cần thiết
      const body = {
        username: formData.username,
        email: formData.email,
      };
      if (formData.password) {
        body.password = formData.password; // backend sẽ hash
      }

      const res = await fetch(`/api/user/admin/update/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setSaving(false);

      if (data.success === false) {
        setError(data.message || 'Update failed');
        return;
      }

      setSuccess(true);
      setFormData((prev) => ({
        ...prev,
        password: '', // clear password field
      }));
    } catch (err) {
      console.error(err);
      setSaving(false);
      setError('Update failed');
    }
  };

  const handleDeleteListing = async (listingId) => {
    const ok = window.confirm('Delete this listing?');
    if (!ok) return;

    try {
      const res = await fetch(`/api/listing/delete/${listingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success === false) {
        alert(data.message || 'Delete failed');
        return;
      }
      setListings((prev) => prev.filter((l) => l._id !== listingId));
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  if (loading) {
    return (
      <main className="p-3 max-w-3xl mx-auto">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="p-3 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">
        Edit User (Admin)
      </h1>

      {/* FORM EDIT USER */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Username</label>
          <input
            type="text"
            id="username"
            className="border p-3 rounded-lg"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold">Email</label>
          <input
            type="email"
            id="email"
            className="border p-3 rounded-lg"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold">
            New password{' '}
            <span className="text-sm font-normal text-slate-500">
              (leave blank to keep current)
            </span>
          </label>
          <input
            type="password"
            id="password"
            className="border p-3 rounded-lg"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter new password"
          />
        </div>

        {error && <p className="text-red-700 text-sm">{error}</p>}
        {success && (
          <p className="text-green-700 text-sm">
            User updated successfully!
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 border border-slate-400 text-slate-700 rounded-lg p-3 uppercase hover:bg-slate-50"
          >
            Back
          </button>
        </div>
      </form>

      {/* LISTINGS CỦA USER NÀY */}
      {listings.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            User Listings
          </h2>
          <div className="flex flex-col gap-4">
            {listings.map((listing) => (
              <div
                key={listing._id}
                className="border rounded-lg p-3 flex justify-between items-center gap-4"
              >
                <Link
                  to={`/listing/${listing._id}`}
                  className="flex items-center gap-3 flex-1"
                >
                  {listing.imageUrls?.[0] && (
                    <img
                      src={listing.imageUrls[0]}
                      alt="listing cover"
                      className="h-16 w-16 object-cover rounded"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 truncate">
                      {listing.name}
                    </span>
                    <span className="text-sm text-slate-500 truncate">
                      {listing.address}
                    </span>
                  </div>
                </Link>

                <div className="flex flex-col items-end text-xs font-semibold gap-1">
                  <button
                    onClick={() => handleDeleteListing(listing._id)}
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
        </section>
      )}
    </main>
  );
}
