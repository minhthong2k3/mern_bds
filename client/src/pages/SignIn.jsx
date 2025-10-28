import React from 'react'

import { useState } from 'react';
import { set } from 'mongoose';
import { Link, useNavigate } from 'react-router-dom';
export default function SignIn() {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleChange = (e) => {
    setFormData({
       ...formData,
        [e.target.id]: e.target.value 
      });
  }
  
  const handleSummit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      console.log(data);
      if(data.success===false){
        setLoading(false);
        setError(data.message);
        return
      } 
      setLoading(false);
      setError(null);  
      navigate('/');
    } catch (error) {
      setLoading(false);
      setError(error.message);
    }
  }
  return (
    <div>
      <h1 className='text-3xl text-center font-semibold my-7'>Sign In</h1>
      <form onSubmit={handleSummit}>
       
        <input type="email" placeholder='Email' className='border border-gray-400 rounded-md px-3 py-2 w-full max-w-md block mx-auto my-3'
        id = 'email' onChange={handleChange}/>
        <input type="password" placeholder='Password' className='border border-gray-400 rounded-md px-3 py-2 w-full max-w-md block mx-auto my-3'
        id = 'password' onChange={handleChange}/>
        <button disabled={loading} className='bg-blue-500 text-white px-4 py-2 rounded-md w-full max-w-md block mx-auto my-3 uppercase hover:bg-blue-600 disabled:bg-blue-300'>{loading ? 'Loading...' : 'Sign In'}</button> 
      </form>
      <div className='text-center mt-4'>
        <span>Don't have an account? </span>
        <Link to ={"/sign-up"}>
        <span className='text-blue-500 hover:underline'>Sign Up</span>
        </Link>
      </div>
      {error && <div className='max-w-md mx-auto mt-4 p-3 border border-red-500 text-red-500 rounded-md text-center'>{error}</div>}
    </div>
  )
}
