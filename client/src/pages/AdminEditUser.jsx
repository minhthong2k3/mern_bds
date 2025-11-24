import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function AdminEditUser() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    avatar: '',
    isAdmin: false,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // load thông tin user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setFetching(true);
        setError('');
        const res = await fetch(`/api/user/${userId}`);
        const data = await res.json();
        if (data.success === false) {
          setError(data.message || 'Error fetching user');
          setFetching(false);
          return;
        }
        setFormData({
          username: data.username || '',
          email: data.email || '',
          avatar: data.avatar || '',
          isAdmin: data.isAdmin === true,
        });
        setFetching(false);
      } catch (err) {
        setError(err.message || 'Error fetching user');
        setFetching(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    if (id === 'isAdmin') {
      setFormData((prev) => ({ ...prev, isAdmin: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      setLoading(true);
      const res = await fetch(`/api/user/admin/update/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success === false) {
        setError(data.message || 'Update failed');
        return;
      }
      setSuccessMsg('User updated successfully!');
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Update failed');
    }
  };

  // Nếu currentUser không phải admin (trong trường hợp nào đó) thì chặn
  if (!currentUser?.isAdmin) {
    return (
      <div className="p-3 max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold text-center my-7">
          Admin only
        </h1>
        <p className="text-center text-red-700">
          You are not allowed to access this page.
        </p>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="p-3 max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold text-center my-7">
          Edit User
        </h1>
        <p className="text-center text-slate-600">Loading user...</p>
      </div>
    );
  }

  return (
    <div className="p-3 max-w-xl mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">
        Edit User (Admin)
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={formData.username}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full"
            placeholder="username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full"
            placeholder="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Avatar URL
          </label>
          <input
            type="text"
            id="avatar"
            value={formData.avatar}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full"
            placeholder="Avatar image URL"
          />
        </div>

        <label className="inline-flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="isAdmin"
            checked={formData.isAdmin}
            onChange={handleChange}
            className="w-4 h-4"
          />
          <span className="text-sm text-slate-700">
            Is admin
          </span>
        </label>

        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80"
          >
            {loading ? 'Saving...' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex-1 border border-slate-400 text-slate-700 rounded-lg p-3 uppercase hover:bg-slate-50"
          >
            Back
          </button>
        </div>
      </form>

      {error && <p className="text-red-700 mt-4 text-sm">{error}</p>}
      {successMsg && (
        <p className="text-green-700 mt-4 text-sm">{successMsg}</p>
      )}
    </div>
  );
}
