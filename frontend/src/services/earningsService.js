import { API_URL } from './api';

/**
 * Service per gestire le chiamate API relative agli earnings dei venditori
 */

// Ottieni riepilogo earnings
export const getEarningsSummary = async (token) => {
  const response = await fetch(`${API_URL}/vendor/earnings/summary`, {
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

// Ottieni storico payouts
export const getVendorPayouts = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.status) queryParams.append('status', params.status);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const url = `${API_URL}/vendor/earnings/payouts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Errore nel caricamento payouts');
  }

  return response.json();
};

// Ottieni vendite in attesa di pagamento
export const getSalesPending = async (token) => {
  const response = await fetch(`${API_URL}/vendor/earnings/sales-pending`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Errore nel caricamento vendite pending');
  }

  return response.json();
};
