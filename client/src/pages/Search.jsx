import React from 'react';

export default function Search() {
  return (
    // BỎ max-w-6xl mx-auto để không chồng layout với App.jsx
    <div className='flex flex-col md:flex-row'>
      {/* Cột filter bên trái */}
      <div className='p-7 border-b-2 md:border-r-2 md:min-h-screen'>
        <form className='flex flex-col gap-8'>
          
          {/* Search term */}
          <div className='flex items-center gap-2'>
            <label className='whitespace-nowrap font-semibold'>
              Search Term:
            </label>
            <input
              type='text'
              id='searchTerm'
              placeholder='Search...'
              className='border rounded-lg p-3 w-full'
            />
          </div>

          {/* Type */}
          <div className='flex gap-2 flex-wrap items-center'>
            <label className='font-semibold'>Type:</label>

            <div className='flex gap-2'>
              <input type='checkbox' id='all' className='w-5' />
              <span>Rent & Sale</span>
            </div>

            <div className='flex gap-2'>
              <input type='checkbox' id='rent' className='w-5' />
              <span>Rent</span>
            </div>

            <div className='flex gap-2'>
              <input type='checkbox' id='sale' className='w-5' />
              <span>Sale</span>
            </div>

            <div className='flex gap-2'>
              <input type='checkbox' id='offer' className='w-5' />
              <span>Offer</span>
            </div>
          </div>

          {/* Amenities */}
          <div className='flex gap-2 flex-wrap items-center'>
            <label className='font-semibold'>Amenities:</label>

            <div className='flex gap-2'>
              <input type='checkbox' id='parking' className='w-5' />
              <span>Parking</span>
            </div>

            <div className='flex gap-2'>
              <input type='checkbox' id='furnished' className='w-5' />
              <span>Furnished</span>
            </div>
          </div>

          {/* Sort */}
          <div className='flex items-center gap-2 '>
            <label className='font-semibold'>Sort:</label>
            <select id='sort_order' className='border rounded-lg p-3'>
              <option value='desc'>Price high to low</option>
              <option value='asc'>Price low to high</option>
              <option value='latest'>Latest</option>
              <option value='oldest'>Oldest</option>
            </select>
          </div>

          {/* Search button */}
          <button className='bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95'>
            Search
          </button>
        </form>
      </div>

      {/* Cột kết quả */}
      <div className='flex-1'>
        <h1 className='text-3xl font-semibold border-b p-3 text-slate-700 mt-5 md:mt-0'>
          Listing results:
        </h1>

        {/* Kết quả sẽ hiển thị ở đây */}
      </div>
    </div>
  );
}
