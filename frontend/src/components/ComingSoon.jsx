import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ComingSoon.css';

function ComingSoon() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check se c'è il bypass tramite URL (?bypass=codice)
    const urlParams = new URLSearchParams(window.location.search);
    const bypassCode = urlParams.get('bypass');
    
    if (bypassCode === import.meta.env.VITE_BYPASS_CODE) {
      sessionStorage.setItem('maintenance_bypass', 'true');
      window.location.href = '/';
    }
  }, [navigate]);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Ottieni le email autorizzate dal .env
    const authorizedEmails = (import.meta.env.VITE_AUTHORIZED_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase());

    // Verifica se l'email inserita è autorizzata
    if (authorizedEmails.includes(email.trim().toLowerCase())) {
      sessionStorage.setItem('maintenance_bypass', 'true');
      window.location.href = '/';
    } else {
      setError('Email non autorizzata');
      setEmail('');
    }
  };

  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        <img src="/LucanikoShopPNG-01.png" alt="Lucaniko Shop Logo" className="coming-soon-logo" />
        <h1>🌶️ Stiamo arrivando</h1>

        {/* Pulsante discreto per mostrare il campo email */}
        {!showInput && (
          <div 
            className="access-trigger"
            onClick={() => setShowInput(true)}
          >
            •
          </div>
        )}

        {/* Form per email autorizzate */}
        {showInput && (
          <form onSubmit={handleEmailSubmit} className="access-form">
            <input
              type="email"
              placeholder="Email autorizzata"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <button type="submit">Accedi</button>
            {error && <p className="error-message">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

export default ComingSoon;
