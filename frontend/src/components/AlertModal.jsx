import React from 'react';
import { Modal } from 'react-bootstrap';

/**
 * Componente modale riutilizzabile per messaggi di successo, errore o informazione
 * Sostituisce gli alert() nativi con un'interfaccia più elegante
 * 
 * @param {boolean} show - Controlla la visibilità del modale
 * @param {function} onHide - Callback quando il modale viene chiuso
 * @param {string} message - Messaggio da visualizzare
 * @param {string} type - Tipo di messaggio: 'success', 'error', 'info', 'warning'
 * @param {number} autoClose - Millisecondi dopo cui chiudere automaticamente (opzionale)
 */
const AlertModal = ({ show, onHide, message, type = 'info', autoClose = null }) => {
  // Auto-chiusura dopo il tempo specificato
  React.useEffect(() => {
    if (show && autoClose) {
      const timer = setTimeout(() => {
        onHide();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [show, autoClose, onHide]);

  // Configurazione basata sul tipo
  const config = {
    success: {
      icon: 'bi-check-circle-fill',
      color: '#28a745',
      emoji: '✅'
    },
    error: {
      icon: 'bi-x-circle-fill',
      color: '#dc3545',
      emoji: '❌'
    },
    warning: {
      icon: 'bi-exclamation-triangle-fill',
      color: '#ffc107',
      emoji: '⚠️'
    },
    info: {
      icon: 'bi-info-circle-fill',
      color: '#17a2b8',
      emoji: 'ℹ️'
    }
  };

  const currentConfig = config[type] || config.info;

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      backdrop="static" 
      keyboard={true}
    >
      <Modal.Body className="text-center py-4">
        <div style={{ fontSize: 48, color: currentConfig.color }}>
          <i className={`bi ${currentConfig.icon}`}></i>
        </div>
        <h5 className="mt-3" style={{ whiteSpace: 'pre-line' }}>
          {message}
        </h5>
        <button
          onClick={onHide}
          className="btn btn-primary mt-3"
          style={{ minWidth: '100px' }}
        >
          OK
        </button>
      </Modal.Body>
    </Modal>
  );
};

export default AlertModal;
