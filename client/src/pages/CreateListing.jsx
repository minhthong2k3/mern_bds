// client/src/pages/CreateListing.jsx
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [files, setFiles] = useState([]); // Array<File>
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: '',
    description: '',
    address: '',
    type: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });

  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPerc, setUploadPerc] = useState(0);

  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // ===== IMAGEKIT (client chỉ dùng publicKey; signature lấy từ server) =====
  const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';
  const FALLBACK_PUBLIC_KEY = 'public_WJ0ZrBs/mTD1Fv70YslbRWmKGx0=';

  const getImageKitAuth = async () => {
    const res = await fetch('/api/imagekit/auth');
    const data = await res.json();
    if (data?.success === false) {
      throw new Error(data.message || 'Cannot get ImageKit auth');
    }
    return {
      token: data?.token,
      expire: data?.expire,
      signature: data?.signature,
      publicKey: data?.publicKey || FALLBACK_PUBLIC_KEY,
    };
  };

  const uploadOneToImageKit = async (file, { folder = '/listings' } = {}) => {
    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      throw new Error('Image must be less than 2MB');
    }

    const { token, expire, signature, publicKey } = await getImageKitAuth();
    if (!token || !expire || !signature) {
      throw new Error('Missing token/expire/signature from server');
    }

    const fileName = `listing_${currentUser?._id || 'user'}_${Date.now()}_${file.name}`;

    const uploaded = await new Promise((resolve, reject) => {
      const form = new FormData();
      form.append('file', file);
      form.append('fileName', fileName);
      form.append('folder', folder);

      form.append('publicKey', publicKey);
      form.append('signature', signature);
      form.append('expire', String(expire));
      form.append('token', token);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', IMAGEKIT_UPLOAD_URL, true);

      xhr.onload = () => {
        try {
          const resJson = JSON.parse(xhr.responseText || '{}');
          if (xhr.status >= 200 && xhr.status < 300) resolve(resJson);
          else reject(resJson);
        } catch (e) {
          reject(new Error('Upload failed: invalid response'));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed: network error'));
      xhr.send(form);
    });

    if (!uploaded?.url) throw new Error('Upload success but missing url');
    return uploaded.url;
  };

  const handleImageSubmit = async () => {
    try {
      setImageUploadError(false);

      if (!files || files.length === 0) {
        setImageUploadError('Please choose images first');
        return;
      }

      // max 6 images per listing
      if (files.length + (formData.imageUrls?.length || 0) > 6) {
        setImageUploadError('You can only upload 6 images per listing');
        return;
      }

      setUploading(true);
      setUploadPerc(0);

      let finished = 0;
      const urls = await Promise.all(
        files.map(async (f) => {
          const url = await uploadOneToImageKit(f, { folder: '/listings' });
          finished += 1;
          setUploadPerc(Math.round((finished / files.length) * 100));
          return url;
        })
      );

      setFormData((prev) => ({
        ...prev,
        imageUrls: (prev.imageUrls || []).concat(urls),
      }));

      setUploading(false);
      setUploadPerc(100);
      setFiles([]);
    } catch (err) {
      console.error(err);
      setUploading(false);
      setUploadPerc(0);
      setImageUploadError(
        err?.message || 'Image upload failed (2 mb max per image)'
      );
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index),
    }));
  };

  const handleChange = (e) => {
    if (e.target.id === 'sale' || e.target.id === 'rent') {
      setFormData((prev) => ({
        ...prev,
        type: e.target.id,
      }));
    }

    if (
      e.target.id === 'parking' ||
      e.target.id === 'furnished' ||
      e.target.id === 'offer'
    ) {
      setFormData((prev) => ({
        ...prev,
        [e.target.id]: e.target.checked,
      }));
    }

    if (
      e.target.type === 'number' ||
      e.target.type === 'text' ||
      e.target.type === 'textarea'
    ) {
      setFormData((prev) => ({
        ...prev,
        [e.target.id]: e.target.value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // if (formData.imageUrls.length < 1)
      //   return setError('You must upload at least one image');
      if (+formData.regularPrice < +formData.discountPrice) {
        return setError('Discount price must be lower than regular price');
      }

      setLoading(true);
      setError(false);

      const res = await fetch('/api/listing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userRef: currentUser._id,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success === false) {
        setError(data.message);
        return;
      }

      navigate(`/listing/${data._id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className='p-3 max-w-4xl mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>
        Create a Listing
      </h1>

      <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-4'>
        <div className='flex flex-col gap-4 flex-1'>
          <input
            type='text'
            placeholder='Name'
            className='border p-3 rounded-lg'
            id='name'
            maxLength='62'
            minLength='10'
            required
            onChange={handleChange}
            value={formData.name}
          />

          <textarea
            type='text'
            placeholder='Description'
            className='border p-3 rounded-lg'
            id='description'
            required
            onChange={handleChange}
            value={formData.description}
          />

          <input
            type='text'
            placeholder='Address'
            className='border p-3 rounded-lg'
            id='address'
            required
            onChange={handleChange}
            value={formData.address}
          />

          <div className='flex gap-6 flex-wrap'>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='sale'
                className='w-5'
                onChange={handleChange}
                checked={formData.type === 'sale'}
              />
              <span>Sell</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='rent'
                className='w-5'
                onChange={handleChange}
                checked={formData.type === 'rent'}
              />
              <span>Rent</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='parking'
                className='w-5'
                onChange={handleChange}
                checked={formData.parking}
              />
              <span>Parking spot</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='furnished'
                className='w-5'
                onChange={handleChange}
                checked={formData.furnished}
              />
              <span>Furnished</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='offer'
                className='w-5'
                onChange={handleChange}
                checked={formData.offer}
              />
              <span>Offer</span>
            </div>
          </div>

          <div className='flex flex-wrap gap-6'>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                id='bedrooms'
                min='1'
                max='10'
                required
                className='p-3 border border-gray-300 rounded-lg'
                onChange={handleChange}
                value={formData.bedrooms}
              />
              <p>Beds</p>
            </div>

            <div className='flex items-center gap-2'>
              <input
                type='number'
                id='bathrooms'
                min='1'
                max='10'
                required
                className='p-3 border border-gray-300 rounded-lg'
                onChange={handleChange}
                value={formData.bathrooms}
              />
              <p>Baths</p>
            </div>

            <div className='flex items-center gap-2'>
              <input
                type='number'
                id='regularPrice'
                min='50'
                max='10000000'
                required
                className='p-3 border border-gray-300 rounded-lg'
                onChange={handleChange}
                value={formData.regularPrice}
              />
              <div className='flex flex-col items-center'>
                <p>Regular price</p>
                {formData.type === 'rent' && (
                  <span className='text-xs'>($ / month)</span>
                )}
              </div>
            </div>

            {formData.offer && (
              <div className='flex items-center gap-2'>
                <input
                  type='number'
                  id='discountPrice'
                  min='0'
                  max='10000000'
                  required
                  className='p-3 border border-gray-300 rounded-lg'
                  onChange={handleChange}
                  value={formData.discountPrice}
                />
                <div className='flex flex-col items-center'>
                  <p>Discounted price</p>
                  {formData.type === 'rent' && (
                    <span className='text-xs'>($ / month)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='flex flex-col flex-1 gap-4'>
          <p className='font-semibold'>
            Images:
            <span className='font-normal text-gray-600 ml-2'>
              The first image will be the cover (max 6)
            </span>
          </p>

          <div className='flex gap-4'>
            <input
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className='p-3 border border-gray-300 rounded w-full'
              type='file'
              id='images'
              accept='image/*'
              multiple
            />
            <button
              type='button'
              disabled={uploading}
              onClick={handleImageSubmit}
              className='p-3 text-green-700 border border-green-700 rounded uppercase hover:shadow-lg disabled:opacity-80'
            >
              {uploading ? `Uploading... ${uploadPerc}%` : 'Upload'}
            </button>
          </div>

          <p className='text-red-700 text-sm'>
            {imageUploadError && imageUploadError}
          </p>

          {formData.imageUrls.length > 0 &&
            formData.imageUrls.map((url, index) => (
              <div
                key={url}
                className='flex justify-between p-3 border items-center'
              >
                <img
                  src={url}
                  alt='listing image'
                  className='w-20 h-20 object-contain rounded-lg'
                />
                <button
                  type='button'
                  onClick={() => handleRemoveImage(index)}
                  className='p-3 text-red-700 rounded-lg uppercase hover:opacity-75'
                >
                  Delete
                </button>
              </div>
            ))}

          <button
            disabled={loading || uploading}
            className='p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80'
          >
            {loading ? 'Creating...' : 'Create listing'}
          </button>

          {error && <p className='text-red-700 text-sm'>{error}</p>}
        </div>
      </form>
    </main>
  );
}
