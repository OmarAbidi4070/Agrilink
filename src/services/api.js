import axios from 'axios';

// Créer une instance axios
const api = axios.create({
  baseURL: '/api',
});

// Ajouter un intercepteur pour les requêtes
api.interceptors.request.use(
  (config) => {
    // Récupérer le token du localStorage
    const token = localStorage.getItem('token');
    
    // Si le token existe, l'ajouter aux headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Ajouter un intercepteur pour les réponses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Gérer les erreurs 401 (non autorisé)
    if (error.response && error.response.status === 401) {
      // Rediriger vers la page de connexion
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;