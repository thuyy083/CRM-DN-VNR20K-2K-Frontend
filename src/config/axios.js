import axios from "axios";

let store;

export const injectStore = (_store) => {
  store = _store;
};

const axiosClient = axios.create({
  baseURL: "http://localhost:8080"
});

// request interceptor
axiosClient.interceptors.request.use((config) => {

  const token = store?.getState()?.auth?.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;

});

// response interceptor
axiosClient.interceptors.response.use(

  (response) => response,

  (error) => {

    const status = error.response?.status;
    const url = error.config?.url;

    // ❗ BỎ QUA login API
    if (status === 401 && !url.includes("/login")) {

      localStorage.removeItem("token");

      window.location.href = "/login";
    }


    return Promise.reject(error);

  }

);

export default axiosClient;