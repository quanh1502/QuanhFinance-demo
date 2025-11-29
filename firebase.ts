import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Cấu hình Firebase của bạn (Đã điền sẵn thông tin bạn cung cấp)
const firebaseConfig = {
  apiKey: "AIzaSyAuiboUAf_4bz4GoC2DiZ_wLepvdpVVVuE",
  authDomain: "quanhfinance.firebaseapp.com",
  projectId: "quanhfinance",
  storageBucket: "quanhfinance.firebasestorage.app",
  messagingSenderId: "888255491312",
  appId: "1:888255491312:web:53033ead0cfbe82355a635"
};

// 1. Khởi tạo ứng dụng Firebase
const app = initializeApp(firebaseConfig);

// 2. Xuất (Export) các công cụ để dùng ở file App.tsx
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
