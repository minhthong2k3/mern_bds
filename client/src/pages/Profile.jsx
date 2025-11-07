import { useSelector } from 'react-redux';
import { useRef, useState } from 'react';
import imagekit from '../imageKitConfig'; // Nhớ import cấu hình ImageKit

export default function Profile() {
  const { currentUser } = useSelector((state) => state.user);
  const fileRef = useRef(null);
  
  // Tạo state để theo dõi file, tiến độ và lỗi
  const [file, setFile] = useState(null);
  const [filePerc, setFilePerc] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(false);

  // Hàm xử lý khi người dùng chọn file ảnh
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Hàm xử lý tải ảnh lên ImageKit
  const handleFileUpload = () => {
    if (!file) {
      setFileUploadError(true);
      return;
    }

    // Tạo tên file duy nhất
    const fileName = new Date().getTime() + file.name;

    // Tạo upload task từ ImageKit
    const uploadTask = imagekit.upload({
      file: file, // File cần upload
      fileName: fileName, // Tên file
      onProgress: (progress) => {
        const percentage = (progress.loaded / progress.total) * 100;
        setFilePerc(Math.round(percentage)); // Cập nhật tiến độ upload
      },
    });

    // Xử lý upload thành công hoặc thất bại
    uploadTask
      .then((response) => {
        console.log("Upload Successful", response);
        setFileUploadError(false);
        // Cập nhật URL ảnh tải lên (ví dụ: dùng URL ảnh vào profile)
        setFile(null); // Sau khi upload xong có thể reset file
      })
      .catch((err) => {
        console.log("Upload Failed", err);
        setFileUploadError(true);
      });
  };

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">Profile</h1>

      <form className="flex flex-col gap-4">
        <input
          type="file"
          ref={fileRef}
          hidden
          accept='image/*'
          onChange={handleFileChange} // Thêm onChange để theo dõi file
        />
        
        {/* Hiển thị ảnh đại diện và cho phép người dùng thay đổi */}
        <img
          onClick={() => fileRef.current.click()}
          src={file ? URL.createObjectURL(file) : currentUser.avatar}
          alt="profile"
          className="rounded-full h-24 w-24 object-cover cursor-pointer self-center mt-2"
        />

        {/* Các trường khác */}
        <input
          type="text"
          placeholder="username"
          className="border p-3 rounded-lg"
        />
        <input
          type="email"
          placeholder="email"
          className="border p-3 rounded-lg"
        />
        <input
          type="password"
          placeholder="password"
          className="border p-3 rounded-lg"
        />

        <button
          type="button"
          onClick={handleFileUpload} // Gọi hàm upload khi bấm nút Update
          className="bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80"
        >
          Update
        </button>
      </form>

      {/* Hiển thị trạng thái tiến trình tải lên */}
      {filePerc > 0 && filePerc < 100 && (
        <div>Uploading: {filePerc}%</div>
      )}
      {filePerc === 100 && <div>Upload Complete!</div>}
      {fileUploadError && <div className="text-red-700">Error uploading image. Please try again.</div>}

      {/* Các tùy chọn khác */}
      <div className="flex justify-between mt-5">
        <span className="text-red-700 cursor-pointer">Delete account</span>
        <span className="text-red-700 cursor-pointer">Sign out</span>
      </div>
    </div>
  );
}
