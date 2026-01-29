import { Container, Form, Button, Alert, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from '../context/authContext';
import { API_URL } from '../services/api';

const supportTopics = [
  "registrazione e configurazione del negozio",
  "caricamento prodotti e gestione categorie",
  "impostazione spedizioni e metodi di pagamento",
  "fatturazione e abbonamenti",
  "utilizzo della piattaforma"
];

const HelpCenterVendor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nome: "",
    azienda: "",
    email: "",
    telefono: "",
    descrizione: "",
    accettaPrivacy: false
  });

  // Verifica se l'utente è autenticato e ha il ruolo corretto
  if (!user) {
    return (
      <Container className="policy-container py-4">
        <Alert variant="warning">
          Devi essere autenticato per accedere al Centro Assistenza Venditori.
          <br />
          <Link to="/login">Accedi ora</Link>
        </Alert>
      </Container>
    );
  }

  if (user.role !== 'seller' && user.role !== 'admin') {
    return (
      <Container className="policy-container py-4">
        <Alert variant="danger">
          Accesso negato. Il Centro Assistenza Venditori è riservato solo ai venditori e agli amministratori.
        </Alert>
      </Container>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accettaPrivacy) {
      setError("Devi accettare il trattamento dei dati personali per procedere.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/support/vendor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Richiesta inviata con successo! Ti contatteremo al più presto.');
        setFormData({
          nome: "",
          azienda: "",
          email: "",
          telefono: "",
          descrizione: "",
          accettaPrivacy: false
        });
      } else {
        setError(data.message || 'Errore durante l\'invio della richiesta');
      }
    } catch (err) {
      console.error('Errore invio richiesta supporto:', err);
      setError('Errore di connessione. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="policy-container py-4">
      <h2 className="mb-4 text-center">Centro Assistenza Venditori</h2>
      <p className="mb-4 text-center">
        Il Centro Assistenza Venditori è riservato alle aziende lucane registrate su Lucaniko Shop.
      </p>

      <h5 className="mt-4 mb-2 text-center">Supporto dedicato per:</h5>
      <ul className="mb-4" style={{ maxWidth: 600, margin: '0 auto' }}>
        {supportTopics.map((topic, idx) => (
          <li key={idx}>{topic}</li>
        ))}
      </ul>

      <h5 className="mt-5 mb-3 text-center">Canali di contatto</h5>
      
      <h6 className="mt-4 mb-3 text-center">Modulo di contatto online per venditori</h6>
      {success && <Alert variant="success" className="text-center">{success}</Alert>}
      {error && <Alert variant="danger" className="text-center">{error}</Alert>}
      <Form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '0 auto' }} className="mb-5">
        <Form.Group className="mb-3" controlId="formNome">
          <Form.Label>Nome e Cognome *</Form.Label>
          <Form.Control
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
            placeholder="Inserisci nome e cognome"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formAzienda">
          <Form.Label>Azienda *</Form.Label>
          <Form.Control
            type="text"
            name="azienda"
            value={formData.azienda}
            onChange={handleChange}
            required
            placeholder="Inserisci nome azienda"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formEmail">
          <Form.Label>Email *</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="email@esempio.com"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formTelefono">
          <Form.Label>Numero di Telefono *</Form.Label>
          <Form.Control
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            required
            placeholder="+39 123 456 7890"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formDescrizione">
          <Form.Label>Descrizione *</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            name="descrizione"
            value={formData.descrizione}
            onChange={handleChange}
            required
            placeholder="Descrivi la tua richiesta di assistenza"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formPrivacy">
          <Form.Check
            type="checkbox"
            name="accettaPrivacy"
            checked={formData.accettaPrivacy}
            onChange={handleChange}
            required
            label={
              <>
                Accetto il trattamento dei dati personali da parte di LucanikoShop.it (
                <Link to="/privacy">Privacy Policy</Link>)
              </>
            }
          />
        </Form.Group>

        <div className="text-center">
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Invio in corso...
              </>
            ) : (
              'Invia'
            )}
          </Button>
        </div>
      </Form>

      <div className="text-center mt-4">
        <h6>Chat WhatsApp</h6>
        <p>
          <a href="https://wa.me/393899263254" target="_blank" rel="noopener noreferrer">
            389 926 3254
          </a>
          {" / "}
          <a href="https://wa.me/393899141485" target="_blank" rel="noopener noreferrer">
            389 914 1485
          </a>
        </p>
        <p>
          <strong>Orari:</strong> LUN/VEN dalle 9:00 alle 18:00
        </p>
      </div>

      <p className="mt-5 text-center">
        Il nostro team ti accompagnerà in ogni fase per aiutarti a vendere al meglio sul marketplace.
      </p>
    </Container>
  );
};

export default HelpCenterVendor;
