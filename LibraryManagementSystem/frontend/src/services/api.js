import axios from 'axios';

const api = axios.create({

  baseURL:
    'http://localhost:18080/api'

});

api.interceptors.request.use(

  (config) => {

    const token =
      localStorage.getItem(
        'library_token'
      );

    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

export default api;