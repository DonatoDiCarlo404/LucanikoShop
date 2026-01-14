import { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, InputGroup, Dropdown, Badge, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { categoriesAPI } from '../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '../components/StripePaymentForm';

// Chiave pubblica Stripe
const stripePromise = loadStripe('pk_test_51SS11yRcLktP33tcvW9XbFOfI3b9jyL4pumGnEiGVfIYhr0wtKZybKrmMNApfcrUaLxSwN0spQBeTLqt6KHeqFZO00clKGog92');

// Calcolo importi con IVA 22%
const SUBSCRIPTION_PRICES = {
  '1anno': { base: 150, withVAT: 183 },
  '2anni': { base: 250, withVAT: 305 },
  '3anni': { base: 350, withVAT: 427 }
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [businessName, setBusinessName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [uniqueCode, setUniqueCode] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [subscription, setSubscription] = useState('1anno');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUserData, setRegisteredUserData] = useState(null);

  // Carica categorie all'avvio
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoriesAPI.getAll();
        setCategories(data || []);
      } catch (err) {
        console.error('Errore caricamento categorie:', err);
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  const { register } = useAuth();
  const navigate = useNavigate();

  function isPasswordStrong(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
  }

  const handlePaymentSuccess = (paymentMethodIdReceived, userData) => {
    setPaymentCompleted(true);
    setPaymentMethodId(paymentMethodIdReceived);
    setError('');
    
    // Se abbiamo userData, significa che la registrazione è stata completata
    if (userData) {
      setRegisteredUserData(userData);
      // Salva il token nel localStorage
      localStorage.setItem('token', userData.token);
      setShowSuccessModal(true);
    }
  };

  const handlePaymentError = (errorMessage) => {
    setError(`Errore pagamento: ${errorMessage}`);
    setPaymentCompleted(false);
  };

  const getSubscriptionAmount = () => {
    return SUBSCRIPTION_PRICES[subscription].withVAT;
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    // Reindirizza alla pagina di pending approval per i seller
    navigate('/pending-approval');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    if (role === 'seller' && !acceptTerms) {
      setError('Devi accettare i Termini & Condizioni Venditore di Lucaniko Shop');
      return;
    }

    if (role === 'seller' && !paymentCompleted) {
      setError('Devi completare il pagamento prima di registrarti');
      return;
    }

    if (password !== confirmPassword) {
      return setError('Le password non coincidono');
    }

    if (!isPasswordStrong(password)) {
      return setError('La password deve essere di almeno 8 caratteri e contenere almeno una maiuscola, una minuscola, un numero e un simbolo.');
    }

    setLoading(true);

    const result = await register(name, email, password, role, businessName, vatNumber);

    if (result.success) {
      // Se è un seller, vai alla pagina pending approval
      if (role === 'seller') {
        navigate('/pending-approval');
      } else {
        // Se è un buyer, vai alla home
        navigate('/');
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <>
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Card style={{ width: '400px' }}>
          <Card.Body>
            <h2 className="text-center mb-4">Registrati</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="name">
                <Form.Label>Nome e Cognome <span style={{color: 'red'}}>*</span></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Inserisci nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Email <span style={{color: 'red'}}>*</span></Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Inserisci email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="password">
                <Form.Label>Password <span style={{color: 'red'}}>*</span></Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Inserisci password (min 6 caratteri)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <i className="bi bi-eye-slash-fill"></i> : <i className="bi bi-eye-fill"></i>}
                  </Button>
                </InputGroup>
                <Form.Text className="text-muted">
                  La password deve essere di almeno 8 caratteri e contenere almeno una maiuscola, una minuscola, un numero e un simbolo.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3" controlId="confirmPassword">
                <Form.Label>Conferma Password <span style={{color: 'red'}}>*</span></Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Conferma password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <i className="bi bi-eye-slash-fill"></i> : <i className="bi bi-eye-fill"></i>}
                  </Button>
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-3" controlId="role">
                <Form.Label>Tipo di account <span style={{color: 'red'}}>*</span></Form.Label>
                <Form.Select value={role} onChange={(e) => setRole(e.target.value)} required>
                  <option value="buyer">Acquirente</option>
                  <option value="seller">Venditore</option>
                </Form.Select>
              </Form.Group>

              {/* Campi extra per venditori */}
              {role === 'seller' && (
                <>
                  <Alert variant="info" className="small">
                    <strong>ℹ️ Info Venditore:</strong> Questi campi sono obbligatori per l'approvazione come Venditore.
                  </Alert>

                  <Form.Group className="mb-3" controlId="businessName">
                    <Form.Label>Ragione Sociale <span style={{color: 'red'}}>*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Es: La Bottega del Gusto"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      autoComplete="organization"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="vatNumber">
                    <Form.Label>Partita IVA <span style={{color: 'red'}}>*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Es: 12345678901"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      maxLength={11}
                      required
                    />
                    <Form.Text className="text-muted">
                      11 cifre per P.IVA italiana
                    </Form.Text>
                  </Form.Group>


                  <Form.Group className="mb-3" controlId="address">
                    <Form.Label>Indirizzo <span style={{color: 'red'}}>*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Es: via Roma 10"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      autoComplete="street-address"
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="city">
                    <Form.Label>Città <span style={{color: 'red'}}>*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Es: Milano"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      autoComplete="address-level2"
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="zipCode">
                    <Form.Label>CAP <span style={{color: 'red'}}>*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Es: 20100"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      autoComplete="postal-code"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="uniqueCode">
                    <Form.Label>Codice Univoco o PEC <span style={{color: 'red'}}>*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Es: M5UXCR1/aziendax@pec.it"
                      value={uniqueCode}
                      onChange={(e) => setUniqueCode(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="categories">
                    <Form.Label>Categoria/e di vendita <span style={{color: 'red'}}>*</span></Form.Label>
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" id="dropdown-categories" className="w-100 text-start">
                        {selectedCategories.length === 0 
                          ? 'Seleziona categorie...' 
                          : `${selectedCategories.length} categoria/e selezionate`}
                      </Dropdown.Toggle>

                      <Dropdown.Menu style={{ maxHeight: '300px', overflowY: 'auto', width: '100%' }}>
                        {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                          <Dropdown.Item
                            key={cat._id}
                            as="div"
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer' }}
                          >
                            <Form.Check
                              type="checkbox"
                              id={`category-${cat._id}`}
                              label={cat.name}
                              checked={selectedCategories.includes(cat._id)}
                              onChange={() => {
                                if (selectedCategories.includes(cat._id)) {
                                  setSelectedCategories(selectedCategories.filter(c => c !== cat._id));
                                } else {
                                  setSelectedCategories([...selectedCategories, cat._id]);
                                }
                              }}
                            />
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                    {selectedCategories.length > 0 && (
                      <div className="mt-2">
                        {selectedCategories.map(catId => {
                          const catObj = categories.find(c => c._id === catId);
                          return catObj ? (
                            <Badge 
                              key={catObj._id} 
                              bg="primary" 
                              className="me-1 mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== catObj._id))}
                            >
                              {catObj.name} ×
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                    <Form.Text className="text-muted">Seleziona una o più categorie dal menu.</Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="subscription">
                    <Form.Label>Scegli abbonamento (ZERO COMMISSIONI) <span style={{color: 'red'}}>*</span></Form.Label>
                    <Form.Select 
                      value={subscription} 
                      onChange={e => {
                        setSubscription(e.target.value);
                        setPaymentCompleted(false);
                        setPaymentMethodId(null);
                      }} 
                      required
                      disabled={paymentCompleted}
                    >
                      <option value="1anno">1 Anno: €150 + IVA = €183,00</option>
                      <option value="2anni">2 Anni: €250 + IVA = €305,00</option>
                      <option value="3anni">3 Anni: €350 + IVA = €427,00</option>
                    </Form.Select>
                    <Form.Text className="text-muted">Seleziona la durata dell'abbonamento. IVA al 22% inclusa.</Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="acceptTerms">
                    <Form.Check
                      type="checkbox"
                      label={
                        <span>
                          Accetto i{' '}
                          <span
                            style={{ textDecoration: 'underline', color: '#007bff', cursor: 'pointer' }}
                            role="button"
                            tabIndex={0}
                            onClick={e => {
                              e.preventDefault();
                              setShowTermsModal(true);
                            }}
                            onKeyPress={e => {
                              if (e.key === 'Enter' || e.key === ' ') setShowTermsModal(true);
                            }}
                          >
                            Termini &amp; Condizioni Venditore di Lucaniko Shop
                          </span>
                          {' '}<span style={{color: 'red'}}>*</span>
                        </span>
                      }
                      checked={acceptTerms}
                      onChange={e => setAcceptTerms(e.target.checked)}
                      required
                    />
                  </Form.Group>
                </>
              )}

              {role === 'buyer' && (
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 mb-3" 
                  disabled={loading}
                >
                  {loading ? 'Caricamento...' : 'Registrati'}
                </Button>
              )}
            </Form>

            {/* Form di pagamento FUORI dal form principale per evitare nidificazione */}
            {role === 'seller' && acceptTerms && (
              <div className="mb-3 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '0.375rem', border: '1px solid #dee2e6' }}>
                <h5 className="mb-3">Pagamento Abbonamento</h5>
                {paymentCompleted ? (
                  <Alert variant="success">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Pagamento completato con successo! Importo: €{getSubscriptionAmount().toFixed(2)}
                  </Alert>
                ) : (
                  <Elements stripe={stripePromise}>
                    <StripePaymentForm
                      amount={getSubscriptionAmount()}
                      email={email}
                      subscriptionType={subscription}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                      disabled={!acceptTerms}
                      registrationData={{
                        name,
                        email,
                        password,
                        role: 'seller',
                        businessName,
                        vatNumber,
                        phoneNumber,
                        address,
                        city,
                        zipCode,
                        uniqueCode,
                        selectedCategories
                      }}
                    />
                  </Elements>
                )}
              </div>
            )}

            <div className="text-center">
              Hai già un account? <Link to="/login">Accedi</Link>
            </div>
          </Card.Body>
        </Card>
      </Container>

      {/* Modal Successo Pagamento e Registrazione */}
      <Modal show={showSuccessModal} onHide={handleModalClose} centered backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-check-circle-fill text-success me-2"></i>
            Registrazione Completata!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="success" className="mb-3">
            <h5>✅ Pagamento avvenuto con successo!</h5>
            <p className="mb-0">Importo: €{getSubscriptionAmount().toFixed(2)}</p>
          </Alert>
          <Alert variant="info">
            <h5>📝 Registrazione completata!</h5>
            <p className="mb-2">Benvenuto <strong>{name}</strong>!</p>
            <p className="mb-0">La tua registrazione come venditore è stata completata con successo. Il tuo account è ora in attesa di approvazione da parte dell'amministratore.</p>
          </Alert>
          <p className="text-muted small mt-3">
            <i className="bi bi-info-circle me-1"></i>
            Riceverai una email di conferma all'indirizzo <strong>{email}</strong> con tutti i dettagli.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleModalClose}>
            Vai alla Dashboard
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showTermsModal} onHide={() => setShowTermsModal(false)} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Termini &amp; Condizioni – Venditori (Lucaniko Shop)</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto'}}>
          <ol>
            <li><b>Oggetto e definizioni</b><br />Il presente documento disciplina l'adesione delle aziende ("Venditori") al marketplace Lucaniko Shop e l'utilizzo degli strumenti messi a disposizione per la vendita ai consumatori finali.</li>
            <li><b>Requisiti di ammissione</b><br />Possono candidarsi aziende con sede operativa/legale in Basilicata o che producono/vendono prodotti riconducibili al territorio lucano (criteri definiti da Lucaniko Shop).<br />Il Venditore deve fornire dati completi e veritieri (ragione sociale, P. IVA, sede, referente, contatti, SDI, ecc.).<br />Lucaniko Shop si riserva di richiedere documentazione aggiuntiva e di approvare o rifiutare la candidatura.</li>
            <li><b>Abbonamenti e attivazione</b><br />Piano di adesione 2026 (come da offerta in piattaforma):<br />- €150 + IVA / 1 anno<br />- €250 + IVA / 2 anni<br />- €350 + IVA / 3 anni<br />L'accesso è attivato dopo:<br />- approvazione della richiesta<br />- pagamento effettuato online<br />- emissione fattura da parte di INSIDE DI DI PIETRO VITO<br />Il venditore potrà scegliere se rinnovare o meno la partnership alla scadenza (in caso di non rinnovo, il venditore dovrà inviare una email di disdetta, con tutti i dati aziendali di registrazione, in allegato un documento d'identità del titolare, entro 60 giorni dalla data di scadenza). In caso di mancato avviso, il rinnovo sarà automatico.</li>
            <li><b>Commissioni sulle vendite e pagamenti</b><br />- Nessuna commissione di marketplace, salvo diverso accordo.<br />- I pagamenti sono gestiti tramite Stripe: il Venditore deve creare/configurare il proprio account Stripe e completare eventuali verifiche (KYC/AML).<br />- Stripe accredita direttamente al Venditore gli importi delle vendite al netto delle commissioni Stripe e di eventuali trattenute richieste da Stripe.</li>
            <li><b>Obblighi del Venditore (prodotti, conformità e leggi)</b><br />Il Venditore è l'unico responsabile di:<br />- veridicità delle schede prodotto (descrizioni, ingredienti, taglie, compatibilità ricambi, certificazioni)<br />- conformità normativa (es. etichettatura alimentare, sicurezza prodotti, marcatura, RAEE, garanzie)<br />- disponibilità, prezzi, IVA, emissione documenti fiscali (fattura/scontrino dove previsto)<br />- gestione resi, recesso, rimborsi, garanzia e assistenza post-vendita<br />- gestione spedizioni e consegne<br />Lucaniko Shop non garantisce esclusiva di prodotto nè di prezzo. Più venditori possono offrire prodotti uguali o simili anche a prezzi differenti.<br />È vietato vendere prodotti illegali, contraffatti, pericolosi o soggetti a restrizioni non gestibili sulla Piattaforma.</li>
            <li><b>Spedizioni</b><br />Il Venditore imposta aree servite, tempi, corrieri e costi.<br />Il Venditore è responsabile di imballaggio, integrità e tracciamento.</li>
            <li><b>Termini di vendita del Venditore</b><br />Ogni Venditore deve pubblicare i propri Termini e Condizioni di vendita (spedizioni, resi, recesso, garanzie, contatti), che l'Acquirente dovrà accettare in fase di checkout.</li>
            <li><b>Pagina venditore e contenuti</b><br />Il Venditore può avere una pagina dedicata con:<br />- logo e descrizione<br />- contatti cliccabili (telefono, email, sito, social)<br />- indirizzo<br />- catalogo prodotti<br />Il Venditore garantisce di avere i diritti d'uso su logo, immagini e testi caricati e manleva Lucaniko Shop da rivendicazioni di terzi.</li>
            <li><b>Uso della Piattaforma e condotte vietate</b><br />È vietato:<br />- utilizzare la Piattaforma per finalità illecite<br />- inserire contenuti ingannevoli o non conformi<br />- aggirare i flussi di pagamento della Piattaforma se non autorizzato<br />- sollecitare pagamenti esterni per ordini generati dal marketplace</li>
            <li><b>Sospensione e cessazione</b><br />Lucaniko Shop può sospendere o disattivare l'account venditore (anche senza preavviso nei casi gravi) in caso di:<br />- violazioni normative o dei presenti Termini<br />- contestazioni ripetute, frodi, prodotti vietati<br />- inadempimenti gravi nella gestione ordini/resi<br />Il Venditore può recedere dall'adesione secondo le modalità indicate; gli importi dell'abbonamento già pagati possono essere non rimborsabili salvo obblighi di legge o diversa previsione contrattuale.</li>
            <li><b>Trattamento dati: ruoli e responsabilità</b><br />Lucaniko Shop è titolare dei dati necessari alla gestione della Piattaforma.<br />Il Venditore è titolare autonomo dei dati necessari alla gestione degli ordini (spedizione, fatturazione, assistenza).<br />Le parti si impegnano a trattare i dati nel rispetto del GDPR e a fornire informative e misure di sicurezza adeguate.</li>
            <li><b>Limitazione di responsabilità e manleva</b><br />Il Venditore manleva Lucaniko Shop da danni, sanzioni, reclami e pretese derivanti da:<br />prodotti non conformi o pericolosi<br />violazioni di legge (fiscali, consumatori, etichettatura)<br />violazioni di proprietà intellettuale<br />gestione ordini, spedizioni, resi e rimborsi</li>
            <li><b>Variazione Termini &amp; Condizioni</b><br />Lucaniko Shop si riserva il diritto di modificare i Termini &amp; Condizioni in qualsiasi momento con efficace immediata dalla pubblicazione sul sito</li>
            <li><b>Legge applicabile e foro</b><br />Il rapporto è regolato dalla legge italiana. Foro competente di Potenza.</li>
          </ol>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTermsModal(false)}>
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Register;
