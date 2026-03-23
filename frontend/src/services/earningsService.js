import { API_URL } from './api';

/**
 * Service per gestire le chiamate API relative agli earnings dei venditori
 */

// Ottieni riepilogo earnings
export const getEarningsSummary = async (token, vendorId = null) => {
  const queryParams = vendorId ? `?vendorId=${vendorId}` : '';
  const response = await fetch(`${API_URL}/vendor/earnings/summary${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Errore nel caricamento earnings');
  }

  return response.json();
};
