import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.code === "ERR_CANCELED") {
      return Promise.reject(error);
    }

    if (!error.response) {
      console.error("Network error:", error.message);

      return Promise.reject(error);
    }

    const status = error.response.status;

    // HTTP error seperti 401, 403, 404, dan 422
    // biasanya sudah ditangani oleh masing-masing component.
    // Jangan tampilkan sebagai Console Error.
    if (status >= 500) {
      console.error("API error:", status, error.response.data);
    }

    return Promise.reject(error);
  },
);

export default api;
