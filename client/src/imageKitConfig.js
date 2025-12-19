// client/src/imageKitConfig.js
import ImageKit from 'imagekit-javascript';

// ⚠️ KHÔNG được để privateKey ở client
// Client chỉ cần publicKey + urlEndpoint + authenticationEndpoint (server sẽ ký)
const imagekit = new ImageKit({
  publicKey: 'public_WJ0ZrBs/mTD1Fv70YslbRWmKGx0=',
  urlEndpoint: 'https://ik.imagekit.io/thong2003',
  authenticationEndpoint: '/api/imagekit/auth', // endpoint ở server để lấy signature
});

export default imagekit;
