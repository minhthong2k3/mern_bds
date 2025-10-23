import React from 'react'
import { Link } from 'react-router-dom'
export default function SignUp() {
  return (
    <div>
      <h1 className='text-3xl text-center font-semibold my-7'>SignUp</h1>
      <form action="">
        <input type="text" placeholder='Username' className='border border-gray-400 rounded-md px-3 py-2 w-full max-w-md block mx-auto my-3'
        id = 'username'/>
        <input type="email" placeholder='Email' className='border border-gray-400 rounded-md px-3 py-2 w-full max-w-md block mx-auto my-3'
        id = 'email'/>
        <input type="password" placeholder='Password' className='border border-gray-400 rounded-md px-3 py-2 w-full max-w-md block mx-auto my-3'
        id = 'password'/>
        <button className='bg-blue-500 text-white px-4 py-2 rounded-md w-full max-w-md block mx-auto my-3 uppercase hover:bg-blue-600 disabled:bg-blue-300'>Sign Up</button> 
      </form>
      <div className='text-center mt-4'>
        <span>Already have an account? </span>
        <Link to ={"/sign-in"}>
        <span className='text-blue-500 hover:underline'>Sign In</span>
        </Link>
      </div>
    </div>
  )
}
