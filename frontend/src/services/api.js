import { createSession } from "react-router-dom";

const API_URL = 'http://localhost:5000/api';

// Helper per gestire le chiamate fetch
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Qualcosa è andato storto');
  }
  
  return data;
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  login: async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  getProfile: async (token) => {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
};

// Products API
export const productsAPI = {
  // Ottieni tutti i prodotti (con filtri)
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/products?${queryString}`);
    return handleResponse(response);
  },

  // Ottieni singolo prodotto
  getById: async (id) => {
    const response = await fetch(`${API_URL}/products/${id}`);
    return handleResponse(response);
  },

  // Crea prodotto (seller/admin)
  create: async (productData, token) => {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
    return handleResponse(response);
  },

  // Aggiorna prodotto (seller/admin)
  update: async (id, productData, token) => {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
    return handleResponse(response);
  },

  // Elimina prodotto (seller/admin)
  delete: async (id, token) => {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  // Aggiungi immagine al prodotto
  addImage: async (id, imageData, token) => {
    const response = await fetch(`${API_URL}/products/${id}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(imageData),
    });
    return handleResponse(response);
  },

  // Ottieni i prodotti del seller loggato
  getMyProducts: async (token) => {
    const response = await fetch(`${API_URL}/products/seller/my-products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
};

// Upload API
export const uploadAPI = {
  uploadProductImage: async (file, token) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_URL}/upload/product`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return handleResponse(response);
  },
};

// Admin API
export const adminAPI = {
  // Get statistiche
  getStats: async (token) => {
    const response = await fetch(`${API_URL}/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  // Get venditori in attesa
  getPendingSellers: async (token) => {
    const response = await fetch(`${API_URL}/admin/pending-sellers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  // Get tutti i venditori
  getAllSellers: async (token) => {
    const response = await fetch(`${API_URL}/admin/sellers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  // Approva venditore
  approveSeller: async (id, token) => {
    const response = await fetch(`${API_URL}/admin/approve-seller/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  // Rifiuta venditore
  rejectSeller: async (id, token) => {
    const response = await fetch(`${API_URL}/admin/reject-seller/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
};

// Checkout API
export const checkoutAPI = {
  // Crea sessione di Stripe Checkout
  createSession: async (cartItems, token) => {
    const response = await fetch(`${API_URL}/checkout/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ cartItems }),
    });
    return handleResponse(response);
  },
};