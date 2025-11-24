// src/pages/EditCrawledListing.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function EditCrawledListing() {
  const navigate = useNavigate();
  const { crawlId } = useParams(); // từ route /admin/crawl-edit/:crawlId

  const [formData, setFormData] = useState({
    title: '',
    brief: '',
    address: '',
    area_m2: '',
    duong_truoc_nha: '',
    phap_ly: '',
    price_text: '',
    price_value: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lấy dữ liệu tin crawl để fill vào form
  useEffect(() => {
    const fetchCrawled = async () => {
      try {
        const res = await fetch(`/api/listing/crawl/${crawlId}`);
        const data = await res.json();
        if (data.success === false) {
          setError(data.message || 'Cannot load crawled listing');
          return;
        }

        setFormData((prev) => ({
          ...prev,
          title: data.title || '',
          brief: data.brief || '',
          address: data.address || '',
          area_m2: data.area_m2 ?? '',
          duong_truoc_nha: data.duong_truoc_nha || '',
          phap_ly: data.phap_ly || '',
          price_text: data.price_text || '',
          price_value: data.price_value ?? '',
        }));
      } catch (err) {
        console.error(err);
        setError('Failed to load crawled listing');
      }
    };

    fetchCrawled();
  }, [crawlId]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Gửi PUT lên backend admin update
      const res = await fetch(`/api/listing/crawl/${crawlId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success === false) {
        setError(data.message || 'Update failed');
        return;
      }

      // Sau khi update xong, điều hướng về trang profile hoặc detail
      navigate('/profile');
      // hoặc: navigate(`/crawl/${crawlId}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Update failed');
      setLoading(false);
    }
  };

  return (
    <main className='p-3 max-w-3xl mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>
        Edit Crawled Listing
      </h1>

      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input
          type='text'
          id='title'
          className='border p-3 rounded-lg'
          placeholder='Title'
          value={formData.title}
          onChange={handleChange}
          required
        />

        <textarea
          id='brief'
          className='border p-3 rounded-lg'
          placeholder='Brief / mô tả ngắn'
          value={formData.brief}
          onChange={handleChange}
          rows={3}
        />

        <input
          type='text'
          id='address'
          className='border p-3 rounded-lg'
          placeholder='Address'
          value={formData.address}
          onChange={handleChange}
        />

        <div className='flex flex-wrap gap-4'>
          <div className='flex flex-col flex-1 min-w-[120px]'>
            <label className='text-sm text-slate-600 mb-1'>Diện tích (m²)</label>
            <input
              type='number'
              id='area_m2'
              className='border p-3 rounded-lg'
              value={formData.area_m2}
              onChange={handleChange}
              min='0'
            />
          </div>

          <div className='flex flex-col flex-1 min-w-[120px]'>
            <label className='text-sm text-slate-600 mb-1'>
              Đường trước nhà
            </label>
            <input
              type='text'
              id='duong_truoc_nha'
              className='border p-3 rounded-lg'
              value={formData.duong_truoc_nha}
              onChange={handleChange}
              placeholder='Ví dụ: 7,5m'
            />
          </div>
        </div>

        <div className='flex flex-col'>
          <label className='text-sm text-slate-600 mb-1'>Pháp lý</label>
          <input
            type='text'
            id='phap_ly'
            className='border p-3 rounded-lg'
            value={formData.phap_ly}
            onChange={handleChange}
            placeholder='Sổ hồng / Sổ đỏ...'
          />
        </div>

        <div className='flex flex-wrap gap-4'>
          <div className='flex flex-col flex-1 min-w-[140px]'>
            <label className='text-sm text-slate-600 mb-1'>
              Giá hiển thị (price_text)
            </label>
            <input
              type='text'
              id='price_text'
              className='border p-3 rounded-lg'
              value={formData.price_text}
              onChange={handleChange}
              placeholder='Ví dụ: 6,5 tỷ'
            />
          </div>

          <div className='flex flex-col flex-1 min-w-[140px]'>
            <label className='text-sm text-slate-600 mb-1'>
              Giá numeric (price_value)
            </label>
            <input
              type='number'
              id='price_value'
              className='border p-3 rounded-lg'
              value={formData.price_value}
              onChange={handleChange}
              min='0'
              placeholder='Ví dụ: 6180000000'
            />
          </div>
        </div>

        <button
          type='submit'
          disabled={loading}
          className='p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80'
        >
          {loading ? 'Updating...' : 'Update crawled listing'}
        </button>

        {error && <p className='text-red-700 text-sm mt-2'>{error}</p>}
      </form>
    </main>
  );
}
