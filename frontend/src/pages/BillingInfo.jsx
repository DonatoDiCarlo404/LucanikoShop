import { useState } from 'react';
import { Container, Card, Button, Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/authContext';
import { checkoutAPI } from '../services/api';
import { toast } from 'react-toastify';

const BillingInfo = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { user } = useAuth();
  // Stato per i dati di fatturazione (da aggiungere campi in seguito)
  const [formData, setFormData] = useState({});
  // Stato per nazione e regione
  const [billingCountry, setBillingCountry] = useState('Italia');
  const [billingRegion, setBillingRegion] = useState('');
  // Stato per indirizzo di spedizione alternativo
  const [useAltShipping, setUseAltShipping] = useState(false);
  // Stato per il modale di riepilogo
  const [showSummary, setShowSummary] = useState(false);

  // Handler per invio dati
  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSummary(true);
  };

  const handleProceedToCheckout = async () => {
    try {
      // Estrai l'email corretta dal formData in base al tipo di acquirente
      const customerEmail = formData.buyerType === 'azienda' 
        ? formData.aziendaEmail 
        : formData.email;

      const { sessionId, url } = await checkoutAPI.createSession(
        cartItems, 
        user ? user.token : null,
        customerEmail
      );

      localStorage.setItem('cart', JSON.stringify(cartItems));
      await new Promise(resolve => setTimeout(resolve, 100));

      window.location.href = url;
    } catch (error) {
      console.error('Errore durante il checkout:', error);
      toast.error('Errore durante il checkout. Riprova.');
    }
  };

  return (
    <Container className="py-5">
      <Card className="mx-auto" style={{ maxWidth: 500 }}>
        <Card.Header>
          <h4>Dati di Fatturazione</h4>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Tipo di acquirente</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  id="privato"
                  name="buyerType"
                  label="Privato"
                  value="privato"
                  checked={formData.buyerType === 'privato'}
                  onChange={e => setFormData({ ...formData, buyerType: e.target.value })}
                />
                <Form.Check
                  type="radio"
                  id="azienda"
                  name="buyerType"
                  label="Azienda"
                  value="azienda"
                  checked={formData.buyerType === 'azienda'}
                  onChange={e => setFormData({ ...formData, buyerType: e.target.value })}
                />
              </div>
            </Form.Group>

            {/* Campi per Privato */}
            {formData.buyerType === 'privato' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Nome <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nome || ''}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    required
                    placeholder="Inserisci il nome"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Cognome <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.cognome || ''}
                    onChange={e => setFormData({ ...formData, cognome: e.target.value })}
                    required
                    placeholder="Inserisci il cognome"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Codice Fiscale <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.codiceFiscale || ''}
                    onChange={e => setFormData({ ...formData, codiceFiscale: e.target.value })}
                    required
                    placeholder="Inserisci il codice fiscale"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Nazione <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Select
                    value={billingCountry}
                    onChange={e => setBillingCountry(e.target.value)}
                    required
                    aria-label="Seleziona nazione"
                  >
                    <option value="Italia">Italia</option>
                    <option value="Francia">Francia</option>
                    <option value="Germania">Germania</option>
                    <option value="Spagna">Spagna</option>
                    <option value="Portogallo">Portogallo</option>
                    <option value="Paesi Bassi">Paesi Bassi</option>
                    <option value="Belgio">Belgio</option>
                    <option value="Albania">Albania</option>
                    <option value="Austria">Austria</option>
                    <option value="Svizzera">Svizzera</option>
                    <option value="Polonia">Polonia</option>
                    <option value="Grecia">Grecia</option>
                    <option value="Svezia">Svezia</option>
                    <option value="Danimarca">Danimarca</option>
                    <option value="Finlandia">Finlandia</option>
                    <option value="Repubblica Ceca">Repubblica Ceca</option>
                    <option value="Ungheria">Ungheria</option>
                    <option value="Romania">Romania</option>
                    <option value="Bulgaria">Bulgaria</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Indirizzo e Numero Civico <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.indirizzo || ''}
                    onChange={e => setFormData({ ...formData, indirizzo: e.target.value })}
                    required
                    placeholder="Inserisci l'indirizzo e il numero civico"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>CAP <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.cap || ''}
                    onChange={e => setFormData({ ...formData, cap: e.target.value })}
                    required
                    placeholder="Inserisci il CAP"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Città <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.citta || ''}
                    onChange={e => setFormData({ ...formData, citta: e.target.value })}
                    required
                    placeholder="Inserisci la città"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Numero di telefono <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.telefono || ''}
                    onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                    required
                    placeholder="Inserisci il numero di telefono"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="Inserisci l'email"
                  />
                </Form.Group>

                {/* Note aggiuntive solo se NON flaggato indirizzo alternativo */}
                {!useAltShipping && (
                  <Form.Group className="mb-3">
                    <Form.Label>Note aggiuntive sull'acquisto</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={formData.noteAggiuntive || ''}
                      onChange={e => setFormData({ ...formData, noteAggiuntive: e.target.value })}
                      placeholder="Inserisci eventuali richieste particolari o note per il venditore"
                    />
                  </Form.Group>
                )}

                {/* Checkbox per altro indirizzo di spedizione */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="alt-shipping"
                    label="Scegli un altro indirizzo di spedizione"
                    checked={useAltShipping}
                    onChange={e => setUseAltShipping(e.target.checked)}
                  />
                </Form.Group>

                {/* Campi indirizzo di spedizione alternativo */}
                {useAltShipping && (
                  <div className="border rounded p-3 mb-3 bg-light">
                    <Form.Group className="mb-3">
                      <Form.Label>Destinatario <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.altDestinatario || ''}
                        onChange={e => setFormData({ ...formData, altDestinatario: e.target.value })}
                        required
                        placeholder="Inserisci il destinatario"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Nazione <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Select
                        value={formData.altNazione || 'Italia'}
                        onChange={e => setFormData({ ...formData, altNazione: e.target.value })}
                        required
                        aria-label="Seleziona nazione"
                      >
                        <option value="Italia">Italia</option>
                        <option value="Francia">Francia</option>
                        <option value="Germania">Germania</option>
                        <option value="Spagna">Spagna</option>
                        <option value="Portogallo">Portogallo</option>
                        <option value="Paesi Bassi">Paesi Bassi</option>
                        <option value="Belgio">Belgio</option>
                        <option value="Albania">Albania</option>
                        <option value="Austria">Austria</option>
                        <option value="Svizzera">Svizzera</option>
                        <option value="Polonia">Polonia</option>
                        <option value="Grecia">Grecia</option>
                        <option value="Svezia">Svezia</option>
                        <option value="Danimarca">Danimarca</option>
                        <option value="Finlandia">Finlandia</option>
                        <option value="Repubblica Ceca">Repubblica Ceca</option>
                        <option value="Ungheria">Ungheria</option>
                        <option value="Romania">Romania</option>
                        <option value="Bulgaria">Bulgaria</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Indirizzo e Numero Civico <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.altIndirizzo || ''}
                        onChange={e => setFormData({ ...formData, altIndirizzo: e.target.value })}
                        required
                        placeholder="Inserisci l'indirizzo e il numero civico"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>CAP <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.altCap || ''}
                        onChange={e => setFormData({ ...formData, altCap: e.target.value })}
                        required
                        placeholder="Inserisci il CAP"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Città <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.altCitta || ''}
                        onChange={e => setFormData({ ...formData, altCitta: e.target.value })}
                        required
                        placeholder="Inserisci la città"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Numero di telefono <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Control
                        type="tel"
                        value={formData.altTelefono || ''}
                        onChange={e => setFormData({ ...formData, altTelefono: e.target.value })}
                        required
                        placeholder="Inserisci il numero di telefono"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Email <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Control
                        type="email"
                        value={formData.altEmail || ''}
                        onChange={e => setFormData({ ...formData, altEmail: e.target.value })}
                        required
                        placeholder="Inserisci l'email"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Note aggiuntive sull'acquisto</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={formData.noteAggiuntive || ''}
                        onChange={e => setFormData({ ...formData, noteAggiuntive: e.target.value })}
                        placeholder="Inserisci eventuali richieste particolari o note per il venditore"
                      />
                    </Form.Group>
                  </div>
                )}
              </>
            )}

            {/* Campi per Azienda */}
            {formData.buyerType === 'azienda' && (
              <>
                {/* Campi Nome, Cognome, Ragione Sociale */}
                <Form.Group className="mb-3">
                  <Form.Label>Nome <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.aziendaNome || ''}
                    onChange={e => setFormData({ ...formData, aziendaNome: e.target.value })}
                    required
                    placeholder="Inserisci il nome"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Cognome <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.aziendaCognome || ''}
                    onChange={e => setFormData({ ...formData, aziendaCognome: e.target.value })}
                    required
                    placeholder="Inserisci il cognome"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Ragione Sociale <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.aziendaRagioneSociale || ''}
                    onChange={e => setFormData({ ...formData, aziendaRagioneSociale: e.target.value })}
                    required
                    placeholder="Inserisci la ragione sociale"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Partita IVA <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.aziendaPartitaIVA || ''}
                    onChange={e => setFormData({ ...formData, aziendaPartitaIVA: e.target.value })}
                    required
                    placeholder="Inserisci la partita IVA"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>PEC/Codice SDI <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.aziendaPecSdi || ''}
                    onChange={e => setFormData({ ...formData, aziendaPecSdi: e.target.value })}
                    required
                    placeholder="Inserisci PEC o Codice SDI"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Nazione <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Select
                    value={billingCountry}
                    onChange={e => setBillingCountry(e.target.value)}
                    required
                    aria-label="Seleziona nazione"
                  >
                    <option value="Italia">Italia</option>
                    <option value="Francia">Francia</option>
                    <option value="Germania">Germania</option>
                    <option value="Spagna">Spagna</option>
                    <option value="Portogallo">Portogallo</option>
                    <option value="Paesi Bassi">Paesi Bassi</option>
                    <option value="Belgio">Belgio</option>
                    <option value="Albania">Albania</option>
                    <option value="Austria">Austria</option>
                    <option value="Svizzera">Svizzera</option>
                    <option value="Polonia">Polonia</option>
                    <option value="Grecia">Grecia</option>
                    <option value="Svezia">Svezia</option>
                    <option value="Danimarca">Danimarca</option>
                    <option value="Finlandia">Finlandia</option>
                    <option value="Repubblica Ceca">Repubblica Ceca</option>
                    <option value="Ungheria">Ungheria</option>
                    <option value="Romania">Romania</option>
                    <option value="Bulgaria">Bulgaria</option>
                  </Form.Select>
                </Form.Group>

                {/* Campi Indirizzo, CAP, Città, Telefono, Email obbligatori */}
                <Form.Group className="mb-3">
                  <Form.Label>Indirizzo e Numero Civico <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.aziendaIndirizzo || ''}
                    onChange={e => setFormData({ ...formData, aziendaIndirizzo: e.target.value })}
                    required
                    placeholder="Inserisci l'indirizzo e il numero civico"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>CAP <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.aziendaCap || ''}
                    onChange={e => setFormData({ ...formData, aziendaCap: e.target.value })}
                    required
                    placeholder="Inserisci il CAP"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Città <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.aziendaCitta || ''}
                    onChange={e => setFormData({ ...formData, aziendaCitta: e.target.value })}
                    required
                    placeholder="Inserisci la città"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Numero di telefono <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.aziendaTelefono || ''}
                    onChange={e => setFormData({ ...formData, aziendaTelefono: e.target.value })}
                    required
                    placeholder="Inserisci il numero di telefono"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.aziendaEmail || ''}
                    onChange={e => setFormData({ ...formData, aziendaEmail: e.target.value })}
                    required
                    placeholder="Inserisci l'email"
                  />
                </Form.Group>

                {/* Note aggiuntive solo se NON flaggato indirizzo alternativo */}
                {!useAltShipping && (
                  <Form.Group className="mb-3">
                    <Form.Label>Note aggiuntive sull'acquisto</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={formData.noteAggiuntive || ''}
                      onChange={e => setFormData({ ...formData, noteAggiuntive: e.target.value })}
                      placeholder="Inserisci eventuali richieste particolari o note per il venditore"
                    />
                  </Form.Group>
                )}

                {/* Checkbox per altro indirizzo di spedizione */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="alt-shipping-azienda"
                    label="Scegli un altro indirizzo di spedizione"
                    checked={useAltShipping}
                    onChange={e => setUseAltShipping(e.target.checked)}
                  />
                </Form.Group>

                {/* Campi indirizzo di spedizione alternativo */}
                {useAltShipping && (
                  <div className="border rounded p-3 mb-3 bg-light">
                    <Form.Group className="mb-3">
                      <Form.Label>Destinatario <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.altDestinatario || ''}
                        onChange={e => setFormData({ ...formData, altDestinatario: e.target.value })}
                        required
                        placeholder="Inserisci il destinatario"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Nazione <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Select
                        value={formData.altNazione || 'Italia'}
                        onChange={e => setFormData({ ...formData, altNazione: e.target.value })}
                        required
                        aria-label="Seleziona nazione"
                      >
                        <option value="Italia">Italia</option>
                        <option value="Francia">Francia</option>
                        <option value="Germania">Germania</option>
                        <option value="Spagna">Spagna</option>
                        <option value="Portogallo">Portogallo</option>
                        <option value="Paesi Bassi">Paesi Bassi</option>
                        <option value="Belgio">Belgio</option>
                        <option value="Albania">Albania</option>
                        <option value="Austria">Austria</option>
                        <option value="Svizzera">Svizzera</option>
                        <option value="Polonia">Polonia</option>
                        <option value="Grecia">Grecia</option>
                        <option value="Svezia">Svezia</option>
                        <option value="Danimarca">Danimarca</option>
                        <option value="Finlandia">Finlandia</option>
                        <option value="Repubblica Ceca">Repubblica Ceca</option>
                        <option value="Ungheria">Ungheria</option>
                        <option value="Romania">Romania</option>
                        <option value="Bulgaria">Bulgaria</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Indirizzo e Numero Civico <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.altIndirizzo || ''}
                        onChange={e => setFormData({ ...formData, altIndirizzo: e.target.value })}
                        required
                        placeholder="Inserisci l'indirizzo e il numero civico"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>CAP <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.altCap || ''}
                        onChange={e => setFormData({ ...formData, altCap: e.target.value })}
                        required
                        placeholder="Inserisci il CAP"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Città <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.altCitta || ''}
                        onChange={e => setFormData({ ...formData, altCitta: e.target.value })}
                        required
                        placeholder="Inserisci la città"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Numero di telefono <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Control
                        type="tel"
                        value={formData.altTelefono || ''}
                        onChange={e => setFormData({ ...formData, altTelefono: e.target.value })}
                        required
                        placeholder="Inserisci il numero di telefono"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Email <span style={{color: 'red'}}>*</span></Form.Label>
                      <Form.Control
                        type="email"
                        value={formData.altEmail || ''}
                        onChange={e => setFormData({ ...formData, altEmail: e.target.value })}
                        required
                        placeholder="Inserisci l'email"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Note aggiuntive sull'acquisto</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={formData.noteAggiuntive || ''}
                        onChange={e => setFormData({ ...formData, noteAggiuntive: e.target.value })}
                        placeholder="Inserisci eventuali richieste particolari o note per il venditore"
                      />
                    </Form.Group>
                  </div>
                )}
              </>
            )}

            {/* Qui verranno aggiunti i campi */}

            <Button variant="primary" type="submit">
              Continua
            </Button>
          </Form>

          {/* Modale riepilogo dati fatturazione */}
          <Modal show={showSummary} onHide={() => setShowSummary(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Riepilogo dati di Fatturazione/Spedizione</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {/* Riepilogo dinamico dei dati inseriti */}
              <ul className="list-unstyled">
                {Object.entries(formData).map(([key, value], idx, arr) => {
                  if (key === 'buyerType') return null;
                  // Inserisci una riga di separazione tra dati principali e indirizzo alternativo
                  if (key === 'altDestinatario' && value) {
                    return [
                      <hr key="sep-alt" className="my-2" />,
                      <li key={key}><strong>{'Destinatario'}:</strong> {value}</li>
                    ];
                  }
                  if (key.startsWith('alt') && value) {
                    // Rimuovi il prefisso 'alt' e formatta la label
                    const label = key.replace(/^alt/, '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
                    return <li key={key}><strong>{label}:</strong> {value}</li>;
                  }
                  return value ? (
                    <li key={key}><strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {value}</li>
                  ) : null;
                })}
              </ul>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowSummary(false)}>
                Modifica
              </Button>
              <Button variant="primary" onClick={handleProceedToCheckout}>
                Conferma e procedi al pagamento
              </Button>
            </Modal.Footer>
          </Modal>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BillingInfo;
