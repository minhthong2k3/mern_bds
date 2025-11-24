import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/Signup';
import About from './pages/About';
import Profile from './pages/Profile';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import CreateListing from './pages/CreateListing';
import UpdateListing from './pages/UpdateListing';
import Listing from './pages/Listing';
import Search from './pages/Search';

// 👇 import thêm page mới
import EditCrawledListing from './pages/EditCrawledListing';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      {/* THÊM main bọc Routes như dưới */}
      <main className="max-w-6xl mx-auto">
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/sign-in' element={<SignIn />} />
          <Route path='/sign-up' element={<SignUp />} />
          <Route path='/about' element={<About />} />
          <Route path='/search' element={<Search />} />

          {/* xem chi tiết listing user */}
          <Route path='/listing/:listingId' element={<Listing />} />

          {/* xem chi tiết tin crawl (đang dùng chung component Listing) */}
          <Route path='/crawl/:listingId' element={<Listing />} />

          {/* các route cần đăng nhập */}
          <Route element={<PrivateRoute />}>
            <Route path='/profile' element={<Profile />} />
            <Route path='/create-listing' element={<CreateListing />} />
            <Route
              path='/update-listing/:listingId'
              element={<UpdateListing />}
            />

            {/* 👇 route mới: admin edit tin crawl */}
            <Route
              path='/admin/crawl-edit/:crawlId'
              element={<EditCrawledListing />}
            />
          </Route>
        </Routes>
      </main>
    </BrowserRouter>
  );
}
