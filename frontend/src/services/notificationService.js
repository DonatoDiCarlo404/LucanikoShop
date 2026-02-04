import { API_URL } from './api';

// Helper per ottenere gli header con token
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper per gestire le risposte
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Errore nella richiesta');
  }
  return data;
};

// Ottieni notifiche dell'utente
export const getNotifications = async (read) => {
  const params = read !== undefined ? `?read=${read}` : '';
  const response = await fetch(`${API_URL}/notifications${params}`, {
    method: 'GET',
    headers: getHeaders()
  });
  return handleResponse(response);
};

// Segna notifica come letta
export const markNotificationAsRead = async (notificationId) => {
  const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: getHeaders()
  });
  return handleResponse(response);
};

// Segna tutte le notifiche come lette
export const markAllNotificationsAsRead = async () => {
  const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
    method: 'PATCH',
    headers: getHeaders()
  });
  return handleResponse(response);
};
