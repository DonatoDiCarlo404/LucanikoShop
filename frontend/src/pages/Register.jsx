import { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, InputGroup, Dropdown, Badge, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { categoriesAPI } from '../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '../components/StripePaymentForm';

// Chiave pubblica Stripe dalla variabile d'ambiente
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Prezzi Piano di Adesione 2026 (Base €290 + IVA 22% = €353,80)
const SUBSCRIPTION_PRICES = {
  '1anno': { base: 290, withVAT: 353.80 }
};

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(() => localStorage.getItem('registerRememberedEmail') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('registerRememberedPassword') || '');
  const [confirmPassword, setConfirmPassword] = useState(() => localStorage.getItem('registerRememberedPassword') || '');
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
  const [acceptTermsBuyer, setAcceptTermsBuyer] = useState(false);
  const [showTermsModalBuyer, setShowTermsModalBuyer] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUserData, setRegisteredUserData] = useState(null);
  const [rememberMe, setRememberMe] = useState(() => {
    const saved = localStorage.getItem('registerRememberMe');
    return saved === 'true';
  });

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
    if (rememberMe) {
      localStorage.setItem('registerRememberMe', 'true');
      localStorage.setItem('registerRememberedEmail', email);
      localStorage.setItem('registerRememberedPassword', password);
    } else {
      localStorage.removeItem('registerRememberMe');
      localStorage.removeItem('registerRememberedEmail');
      localStorage.removeItem('registerRememberedPassword');
    }
    e.preventDefault();

    setError('');
    if (role === 'seller' && !acceptTerms) {
      setError('Devi accettare i Termini & Condizioni Venditore di Lucaniko Shop');
      return;
    }

    if (role === 'buyer' && !acceptTermsBuyer) {
      setError('Devi accettare i Termini & Condizioni Acquirente di Lucaniko Shop');
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

    if (!firstName.trim()) return setError('Il nome è obbligatorio');
    if (!lastName.trim()) return setError('Il cognome è obbligatorio');

    setLoading(true);

    const fullName = `${firstName} ${lastName}`.trim();
    const result = await register(fullName, email, password, role, businessName, vatNumber);

    if (result.success) {
      if (role === 'seller') {
        navigate('/pending-approval');
      } else {
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
              <Form.Group className="mb-3" controlId="firstName">
                <Form.Label>Nome <span style={{color: 'red'}}>*</span></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Inserisci il nome"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="lastName">
                <Form.Label>Cognome <span style={{color: 'red'}}>*</span></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Inserisci il cognome"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  autoComplete="family-name"
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

              {/* Ricorda credenziali */}
              <Form.Group className="mb-3" controlId="rememberMe">
                <Form.Check
                  type="checkbox"
                  label="Ricorda credenziali"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
              </Form.Group>
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
                        {/* Mostra solo le macrocategorie predefinite come nel catalogo */}
                        {[
                          { name: 'Cibi e Bevande' },
                          { name: 'Abbigliamento e Accessori' },
                          { name: 'Benessere e Salute' },
                          { name: 'Calzature' },
                          { name: 'Casa, Arredi e Ufficio' },
                          { name: 'Elettronica e Informatica' },
                          { name: 'Industria, Ferramenta e Artigianato' },
                          { name: 'Libri, Media e Giocattoli' },
                          { name: 'Orologi e Gioielli' },
                          { name: 'Ricambi e accessori per auto e moto' },
                          { name: 'Sport, Hobby e Viaggi' }
                        ].map(cat => (
                          <Dropdown.Item
                            key={cat.name}
                            as="div"
                            onClick={e => e.stopPropagation()}
                            style={{ cursor: 'pointer' }}
                          >
                            <Form.Check
                              type="checkbox"
                              id={`category-${cat.name}`}
                              label={cat.name}
                              checked={selectedCategories.includes(cat.name)}
                              onChange={() => {
                                if (selectedCategories.includes(cat.name)) {
                                  setSelectedCategories(selectedCategories.filter(c => c !== cat.name));
                                } else {
                                  setSelectedCategories([...selectedCategories, cat.name]);
                                }
                              }}
                            />
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                    {/* Mostra le categorie selezionate come badge sotto il dropdown, al posto del testo */}
                    {selectedCategories.length > 0 ? (
                      <div className="mt-2">
                        {selectedCategories.map(catName => (
                          <Badge
                            key={catName}
                            bg="primary"
                            className="me-1 mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== catName))}
                          >
                            {catName} ×
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <Form.Text className="text-muted">Seleziona una o più categorie dal menu.</Form.Text>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="subscription">
                    <Form.Label>Piano di Adesione (ZERO COMMISSIONI) <span style={{color: 'red'}}>*</span></Form.Label>
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
                      <option value="1anno">1 Anno: €290 + IVA</option>
                    </Form.Select>
                    <Form.Text className="text-muted">Piano annuale: €290 + IVA 22%. L'importo finale sarà mostrato prima del pagamento.</Form.Text>
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
                <>
                  <Form.Group className="mb-3" controlId="acceptTermsBuyer">
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
                              setShowTermsModalBuyer(true);
                            }}
                            onKeyPress={e => {
                              if (e.key === 'Enter' || e.key === ' ') setShowTermsModalBuyer(true);
                            }}
                          >
                            Termini &amp; Condizioni Acquirente di Lucaniko Shop
                          </span>
                          {' '}<span style={{color: 'red'}}>*</span>
                        </span>
                      }
                      checked={acceptTermsBuyer}
                      onChange={e => setAcceptTermsBuyer(e.target.checked)}
                      required
                    />
                  </Form.Group>
                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="w-100 mb-3" 
                    disabled={loading}
                  >
                    {loading ? 'Caricamento...' : 'Registrati'}
                  </Button>
                </>
              )}
            </Form>

            {/* Form di pagamento FUORI dal form principale per evitare nidificazione */}
            {role === 'seller' && acceptTerms && (
              <div className="mb-3 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '0.375rem', border: '1px solid #dee2e6' }}>
                <h5 className="mb-3">Pagamento Piano di Adesione</h5>
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
                        firstName,
                        lastName,
                        name: `${firstName} ${lastName}`.trim(),
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
            <p className="mb-2">Benvenuto <strong>{`${firstName} ${lastName}`.trim()}</strong>!</p>
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
        <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto', fontSize: '1.05rem', lineHeight: 1.7}}>
          <div style={{ marginBottom: 28 }}>
            <strong>1) Oggetto e definizioni</strong>
            <div style={{ marginTop: 6 }}>
              Il presente documento disciplina l'adesione delle aziende ("Venditori") al marketplace Lucaniko Shop e l'utilizzo degli strumenti messi a disposizione per la vendita ai consumatori finali.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>2) Requisiti di ammissione</strong>
            <div style={{ marginTop: 6 }}>
              Possono candidarsi aziende con sede operativa/legale in Basilicata o che producono/vendono prodotti riconducibili al territorio lucano (criteri definiti da Lucaniko Shop). Il Venditore deve fornire dati completi e veritieri (ragione sociale, P. IVA, sede, referente, contatti, SDI, ecc.). Lucaniko Shop si riserva di richiedere documentazione aggiuntiva e di approvare o rifiutare la candidatura. Per la categoria di vendita CIBI E BEVANDE è obbligatorio offrire su questo marketplace solo prodotti Lucani. Tutti i prodotti non Lucani saranno rimossi senza alcun avviso e potrebbe comportare l'esclusione del venditore da Lucaniko Shop.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>3) Piano di Adesione e attivazione</strong>
            <div style={{ marginTop: 6 }}>
              <strong>Piano di Adesione 2026</strong> (come da offerta in piattaforma):
              <ul style={{ marginTop: 8 }}>
                <li>€290 + IVA (22%) / 1 anno</li>
              </ul>
              <strong>INCLUDE:</strong>
              <ul style={{ marginTop: 8 }}>
                <li>Registrazione e accesso alla piattaforma</li>
                <li>Onboarding e formazione iniziale</li>
                <li>Supporto operativo</li>
                <li>Accesso alla community WhatsApp aziende Lucaniko Shop (guide pratiche, best pratices, aggiornamenti, news)</li>
              </ul>
              <br />
              L'accesso è attivato dopo:
              <ul style={{ marginTop: 8 }}>
                <li>approvazione della richiesta</li>
                <li>pagamento effettuato online</li>
                <li>emissione fattura da parte di INSIDE DI DI PIETRO VITO</li>
              </ul>
              Il venditore potrà scegliere se rinnovare o meno la partnership alla scadenza (in caso di non rinnovo, il venditore dovrà inviare una email di disdetta, con tutti i dati aziendali di registrazione, in allegato un documento d'identità del titolare, entro 60 giorni dalla data di scadenza). In caso di mancato avviso, il rinnovo sarà automatico.
              <br /><br />
              <strong>Privacy e Sicurezza:</strong> Lucaniko Shop garantisce la privacy dei dati personali e si impegna a proteggere le informazioni sensibili. Consulta la nostra privacy policy.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>4) Obblighi del Venditore (prodotti, conformità e leggi)</strong>
            <div style={{ marginTop: 6 }}>
              Il Venditore è l'unico responsabile di:
              <ul style={{ marginTop: 8 }}>
                <li>veridicità delle schede prodotto (descrizioni, ingredienti, taglie, compatibilità ricambi, certificazioni)</li>
                <li>conformità normativa (es. etichettatura alimentare, sicurezza prodotti, marcatura, RAEE, garanzie)</li>
                <li>disponibilità, prezzi, IVA, emissione documenti fiscali (fattura/scontrino dove previsto)</li>
                <li>gestione resi, recesso, rimborsi, garanzia e assistenza post-vendita</li>
                <li>gestione spedizioni e consegne</li>
              </ul>
              Lucaniko Shop non garantisce esclusiva di prodotto nè di prezzo. Più venditori possono offrire prodotti uguali o simili anche a prezzi differenti. È vietato vendere prodotti illegali, contraffatti, pericolosi o soggetti a restrizioni non gestibili sulla Piattaforma.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>5) Spedizioni</strong>
            <div style={{ marginTop: 6 }}>
              Il Venditore imposta aree servite, tempi, corrieri e costi. Il Venditore è responsabile di imballaggio, integrità e tracciamento.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>6) Termini di vendita del Venditore</strong>
            <div style={{ marginTop: 6 }}>
              Ogni Venditore deve pubblicare i propri Termini e Condizioni di vendita (spedizioni, resi, recesso, garanzie, contatti), che l'Acquirente dovrà accettare in fase di checkout.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>7) Pagina venditore e contenuti</strong>
            <div style={{ marginTop: 6 }}>
              Il Venditore può avere una pagina dedicata con:
              <ul style={{ marginTop: 8 }}>
                <li>logo e descrizione</li>
                <li>contatti cliccabili (telefono, email, sito, social)</li>
                <li>indirizzo</li>
                <li>catalogo prodotti</li>
              </ul>
              Il Venditore garantisce di avere i diritti d'uso su logo, immagini e testi caricati e manleva Lucaniko Shop da rivendicazioni di terzi.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>8) Uso della Piattaforma e condotte vietate</strong>
            <div style={{ marginTop: 6 }}>
              È vietato:
              <ul style={{ marginTop: 8 }}>
                <li>utilizzare la Piattaforma per finalità illecite</li>
                <li>inserire contenuti ingannevoli o non conformi</li>
                <li>aggirare i flussi di pagamento della Piattaforma se non autorizzato</li>
                <li>sollecitare pagamenti esterni per ordini generati dal marketplace</li>
              </ul>
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>9) Sospensione e cessazione</strong>
            <div style={{ marginTop: 6 }}>
              Lucaniko Shop può sospendere o disattivare l'account venditore (anche senza preavviso nei casi gravi) in caso di:
              <ul style={{ marginTop: 8 }}>
                <li>violazioni normative o dei presenti Termini</li>
                <li>contestazioni ripetute, frodi, prodotti vietati</li>
                <li>inadempimenti gravi nella gestione ordini/resi</li>
              </ul>
              Il Venditore può recedere dall'adesione secondo le modalità indicate; gli importi del Piano di Adesione già pagati possono essere non rimborsabili salvo obblighi di legge o diversa previsione contrattuale.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>10) Trattamento dati: ruoli e responsabilità</strong>
            <div style={{ marginTop: 6 }}>
              Lucaniko Shop è titolare dei dati necessari alla gestione della Piattaforma. Il Venditore è titolare autonomo dei dati necessari alla gestione degli ordini (spedizione, fatturazione, assistenza). Le parti si impegnano a trattare i dati nel rispetto del GDPR e a fornire informative e misure di sicurezza adeguate.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>11) Limitazione di responsabilità e manleva</strong>
            <div style={{ marginTop: 6 }}>
              Il Venditore manleva Lucaniko Shop da danni, sanzioni, reclami e pretese derivanti da: prodotti non conformi o pericolosi violazioni di legge (fiscali, consumatori, etichettatura) violazioni di proprietà intellettuale gestione ordini, spedizioni, resi e rimborsi
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>12) Pagamenti, trasferimenti e accrediti ai Venditori – Trasparenza</strong>
            <div style={{ marginTop: 6 }}>
              Lucaniko Shop è un marketplace che utilizza Stripe Connect per gestire correttamente i flussi multi-venditore.
              <br /><br />
              <strong>Flusso economico in breve</strong>
              <ul style={{ marginTop: 8 }}>
                <li>L'Acquirente paga tramite Stripe al checkout.</li>
                <li>Stripe applica le proprie commissioni di elaborazione (variabili per carta/paese/metodo).</li>
                <li>L'importo viene contabilizzato nei flussi Stripe della Piattaforma e destinato ai Venditori interessati.</li>
                <li>Lucaniko Shop dispone i trasferimenti ai Venditori tramite Stripe Connect secondo tempi e regole del marketplace.</li>
              </ul>
              <br />
              <strong>Nessuna commissione % Lucaniko Shop</strong>
              <br /><br />
              Lucaniko Shop non applica commissioni percentuali sulle vendite. È trattenuto esclusivamente un importo fisso di €0,30 per ciascun trasferimento al Venditore, quale costo operativo di trasferimento/accredito, soggetto a fatturazione e IVA secondo la normativa vigente.
              <br /><br />
              Le commissioni Stripe non sono stabilite da Lucaniko Shop e possono variare in base al metodo di pagamento e al paese.
              <br /><br />
              <strong>Periodo di riserva: trasferimenti dopo 14 giorni</strong>
              <br /><br />
              Per ridurre rischi di contestazioni e gestire correttamente eventuali:
              <ul style={{ marginTop: 8 }}>
                <li>richieste di recesso (quando applicabile)</li>
                <li>resi/rimborsi</li>
                <li>mancata consegna</li>
                <li>contestazioni/chargeback</li>
              </ul>
              i trasferimenti ai Venditori vengono effettuati in genere dopo 14 giorni dall'incasso (o dalla conferma ordine/pagamento, secondo eventi tecnici), salvo:
              <ul style={{ marginTop: 8 }}>
                <li>casi in cui la legge impone diversamente,</li>
                <li>richieste di rimborso già attive,</li>
                <li>verifiche/limitazioni imposte da Stripe (KYC, rischio, frodi),</li>
                <li>accordi diversi formalizzati per specifiche categorie.</li>
              </ul>
              Questo periodo non modifica i diritti dei consumatori, ma è una regola di payout interna del marketplace.
              <br /><br />
              <strong>Resi e rimborsi: chi decide e come avvengono</strong>
              <br /><br />
              Il Venditore è responsabile di valutare e gestire:
              <ul style={{ marginTop: 8 }}>
                <li>richieste di recesso (se applicabile)</li>
                <li>resi per difetti/non conformità</li>
                <li>rimborsi totali o parziali</li>
              </ul>
              Se è dovuto un rimborso, esso viene gestito tramite i flussi di pagamento (Stripe) in base alle regole applicabili. Lucaniko Shop può fornire supporto tecnico sui flussi ma non sostituisce il Venditore nelle decisioni commerciali e legali.
              <br /><br />
              <strong>Contestazioni/chargeback</strong>
              <br /><br />
              Se l'Acquirente avvia una contestazione tramite banca/circuito:
              <ul style={{ marginTop: 8 }}>
                <li>Stripe può trattenere l'importo contestato e applicare costi di gestione disputa;</li>
                <li>il Venditore deve fornire prove (tracking, consegna, comunicazioni, policy);</li>
                <li>in caso di esito sfavorevole, gli importi possono essere stornati secondo regole Stripe.</li>
              </ul>
              <br />
              <strong>Verifiche Stripe e blocchi</strong>
              <br /><br />
              Stripe può richiedere al Venditore verifiche/documenti (KYC/AML). Senza verifiche complete i trasferimenti possono essere ritardati o sospesi.
              <br /><br />
              <strong>IVA e documenti fiscali</strong>
              <br /><br />
              Il Venditore è responsabile di:
              <ul style={{ marginTop: 8 }}>
                <li>IVA e regime fiscale</li>
                <li>emissione fattura/scontrino ove previsto</li>
                <li>conservazione documentale</li>
              </ul>
              Lucaniko Shop non versa IVA per conto dei Venditori.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>13) Variazione Termini &amp; Condizioni</strong>
            <div style={{ marginTop: 6 }}>
              Lucaniko Shop si riserva il diritto di modificare i Termini &amp; Condizioni in qualsiasi momento con efficace immediata dalla pubblicazione sul sito
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>14) Legge applicabile e foro</strong>
            <div style={{ marginTop: 6 }}>
              Il rapporto è regolato dalla legge italiana. Foro competente di Potenza.
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTermsModal(false)}>
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Termini & Condizioni Acquirenti */}
      <Modal show={showTermsModalBuyer} onHide={() => setShowTermsModalBuyer(false)} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Termini &amp; Condizioni – Acquirenti (Lucaniko Shop)</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto', fontSize: '1.05rem', lineHeight: 1.7}}>
          <div style={{ marginBottom: 28 }}>
            <strong>1.1 Oggetto</strong>
            <div style={{ marginTop: 6 }}>
              Lucaniko Shop consente agli Acquirenti di acquistare prodotti venduti da Venditori terzi.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>1.2 Ruolo della Piattaforma</strong>
            <div style={{ marginTop: 6 }}>
              Lucaniko Shop non è parte del contratto di vendita (salvo diversa indicazione). Il contratto è tra Acquirente e Venditore.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>1.3 Ordini multi-venditore</strong>
            <div style={{ marginTop: 6 }}>
              Checkout unico, ma vendite separate per Venditore: spedizioni/resi/rimborsi/documenti fiscali separati.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>1.4 Informazioni su prodotti e prezzi</strong>
            <div style={{ marginTop: 6 }}>
              Responsabilità del Venditore. Immagini indicative. Prezzi e IVA come indicato dal Venditore.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>1.5 Spedizioni</strong>
            <div style={{ marginTop: 6 }}>
              Gestite dal Venditore; costi e tempi visibili prima della conferma.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>1.6 Recesso (consumatori) e eccezioni – deperibili</strong>
            <div style={{ marginTop: 6 }}>
              Il consumatore può recedere entro 14 giorni salvo eccezioni previste dal Codice del Consumo, tra cui (a titolo esemplificativo):
              <ul className="d-flex flex-column align-items-center" style={{ marginTop: 8 }}>
                <li>beni deperibili o che rischiano di deteriorarsi rapidamente (molti alimentari)</li>
                <li>beni sigillati non restituibili per motivi igienici/sanitari se aperti</li>
                <li>beni personalizzati</li>
              </ul>
              La gestione del recesso/resi è in capo al Venditore.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>1.7 Garanzia legale</strong>
            <div style={{ marginTop: 6 }}>
              Per consumatori: garanzia legale di conformità ove applicabile.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>1.8 Pagamenti</strong>
            <div style={{ marginTop: 6 }}>
              Gestiti da Stripe. L'Acquirente può avviare contestazioni tramite canali bancari; il Venditore gestisce evidenze di consegna/servizio.
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <strong>1.9 Foro competente (SAFE)</strong>
            <div style={{ marginTop: 6 }}>
              Per Acquirenti consumatori, è competente in via inderogabile il foro del luogo di residenza o domicilio del consumatore (normativa consumer).<br />
              Per Acquirenti non consumatori, foro di Potenza.
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTermsModalBuyer(false)}>
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Register;
