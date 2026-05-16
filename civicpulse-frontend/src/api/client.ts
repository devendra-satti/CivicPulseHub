//This file is used to handle centralized backend requests
import axios from "axios";


// Create a reusable axios instance
const api = axios.create({
    // Use the cloud Render URL if available, otherwise fallback to local
    baseURL: (import.meta.env.VITE_API_URL || "http://localhost:8080") + "/api",
    
    // Crucial for session cookies/credentials over cloud networks
    withCredentials: true 
});

// Attach JWT token automatically if present
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("auth"); // stored auth info
  if (raw) {
    const { token } = JSON.parse(raw);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});




//Auto Logout when token expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
   // 1. Get the URL of the request that failed
    const failedRequestUrl = error.config?.url;

    // 2. Define URLs that should NOT trigger the auto-logout
    // (Add "/auth/signin" or whatever your login endpoint is)
    const isLoginRequest = failedRequestUrl?.includes("/auth/signin");

    // 3. Only run the "Session Expired" logic if it's NOT a login attempt
    if (error.response && error.response.status === 401 && !isLoginRequest) {
      localStorage.removeItem("auth");
      alert("Your session has expired. Please login again.");
      window.location.href = "/login";
    }

    // 4. Always reject the error so your Login component can show "Invalid Password"
    return Promise.reject(error);
  }
);

export { api };