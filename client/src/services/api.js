import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Request interceptor: add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("mindora_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not already on login or setup, clear token
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/login") && !currentPath.includes("/setup") && !currentPath.includes("/display") && !currentPath.includes("/connect")) {
        localStorage.removeItem("mindora_token");
        localStorage.removeItem("mindora_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
