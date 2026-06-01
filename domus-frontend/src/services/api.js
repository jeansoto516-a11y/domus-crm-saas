import axios from "axios";

const api = axios.create({
    baseURL: "https://domus-backend-5li2.onrender.com",
});

api.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;