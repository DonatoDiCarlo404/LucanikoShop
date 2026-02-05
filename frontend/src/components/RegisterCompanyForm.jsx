import { useState } from 'react';
import { Form, Button, Alert, InputGroup, Dropdown, Badge, Modal } from 'react-bootstrap';
import { authAPI } from '../services/api';

const RegisterCompanyForm = ({ onSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [uniqueCode, setUniqueCode] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [password, setPassword] = useState('');
  const [subscription, setSubscription] = useState('1anno');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!acceptTerms) {
      setError('Devi accettare i Termini & Condizioni Venditore di Lucaniko Shop');
      return;
    }
    
    if (!firstName.trim()) {
      setError('Il nome è obbligatorio');
      return;
    }
    
    if (!lastName.trim()) {
      setError('Il cognome è obbligatorio');
      return;
    }
    
    setLoading(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const result = await authAPI.register({
        name: fullName,
        businessName,
        vatNumber,
        address,
        city,
        zipCode,
        uniqueCode,
        email,
        phoneNumber,
        categories: selectedCategories,
        subscription,
        password,
        role: 'seller',
        registeredByAdmin: true,
      });
      if (result && result._id) {
        setSuccess(true);
        if (onSuccess) onSuccess();
        setFirstName('');
        setLastName('');
        setBusinessName('');
        setVatNumber('');
        setAddress('');
        setCity('');
        setZipCode('');
        setUniqueCode('');
        setEmail('');
        setPhoneNumber('');
        setSelectedCategories([]);
        setPassword('');
      } else {
        setError(result.message || 'Errore nella registrazione');
      }
    } catch (err) {
      setError(err.message || 'Errore nella registrazione');
    }
    setLoading(false);
  };

  return (
    <>
    <Form onSubmit={handleSubmit} className="p-3 border rounded bg-light">
      <h5>Registra Azienda per conto terzi</h5>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Azienda registrata con successo!</Alert>}
      
      <Form.Group className="mb-3" controlId="firstName">
        <Form.Label>Nome Referente <span style={{color: 'red'}}>*</span></Form.Label>
        <Form.Control
          type="text"
          placeholder="Es: Mario"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
          required
        />
      </Form.Group>
      
      <Form.Group className="mb-3" controlId="lastName">
        <Form.Label>Cognome Referente <span style={{color: 'red'}}>*</span></Form.Label>
        <Form.Control
          type="text"
          placeholder="Es: Rossi"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
          required
        />
      </Form.Group>
      
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
        <Form.Text className="text-muted">11 cifre per P.IVA italiana</Form.Text>
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
      <Form.Group className="mb-3" controlId="email">
        <Form.Label>Email <span style={{color: 'red'}}>*</span></Form.Label>
        <Form.Control
          type="email"
          placeholder="Email aziendale"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="phoneNumber">
        <Form.Label>Telefono <span style={{color: 'red'}}>*</span></Form.Label>
        <Form.Control
          type="tel"
          placeholder="Es: +39 123 456 7890"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          autoComplete="tel"
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
                onClick={(e) => e.stopPropagation()}
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
        {selectedCategories.length > 0 && (
          <div className="mt-2">
            {selectedCategories.map(catName => {
              return (
                <Badge 
                  key={catName} 
                  bg="primary" 
                  className="me-1 mb-1"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== catName))}
                >
                  {catName} ×
                </Badge>
              );
            })}
          </div>
        )}
        <Form.Text className="text-muted">Seleziona una o più categorie dal menu.</Form.Text>
      </Form.Group>
      <Form.Group className="mb-3" controlId="subscription">
        <Form.Label>Scegli Piano di Adesione (ZERO COMMISSIONI) <span style={{color: 'red'}}>*</span></Form.Label>
        <Form.Select value={subscription} onChange={e => setSubscription(e.target.value)} required>
          <option value="1anno">1 Anno: €250 (IVA inclusa)</option>
          <option value="2anni">2 Anni: €390 (IVA inclusa)</option>
          <option value="3anni">3 Anni: €510 (IVA inclusa)</option>
        </Form.Select>
        <Form.Text className="text-muted">Seleziona la durata del piano di adesione.</Form.Text>
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
      <Form.Group className="mb-3" controlId="password">
        <Form.Label>Password <span style={{color: 'red'}}>*</span></Form.Label>
        <InputGroup>
          <Form.Control
            type={showPassword ? "text" : "password"}
            placeholder="Password temporanea"
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
        <Form.Text className="text-muted">La password può essere cambiata dall'azienda dopo il primo accesso.</Form.Text>
      </Form.Group>
      <Button variant="primary" type="submit" className="w-100" disabled={loading}>
        {loading ? 'Registrazione...' : 'Registra Azienda'}
      </Button>
    </Form>
    <Modal show={showTermsModal} onHide={() => setShowTermsModal(false)} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Termini &amp; Condizioni – Venditori (Lucaniko Shop)</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto'}}>
        <ol>
          <li><b>Oggetto e definizioni</b><br />Il presente documento disciplina l’adesione delle aziende (“Venditori”) al marketplace Lucaniko Shop e l’utilizzo degli strumenti messi a disposizione per la vendita ai consumatori finali.</li>
          <li><b>Requisiti di ammissione</b><br />Possono candidarsi aziende con sede operativa/legale in Basilicata o che producono/vendono prodotti riconducibili al territorio lucano (criteri definiti da Lucaniko Shop).<br />Il Venditore deve fornire dati completi e veritieri (ragione sociale, P. IVA, sede, referente, contatti, SDI, ecc.).<br />Lucaniko Shop si riserva di richiedere documentazione aggiuntiva e di approvare o rifiutare la candidatura.</li>
          <li><b>Piano di Adesione e attivazione</b><br />Piano di Adesione 2026 (come da offerta in piattaforma):<br />- €250 (IVA inclusa) / 1 anno<br />- €390 (IVA inclusa) / 2 anni<br />- €510 (IVA inclusa) / 3 anni<br />INCLUDE:<br />- Registrazione e accesso alla piattaforma<br />- Onboarding e formazione iniziale<br />- Supporto operativo<br />- Accesso alla community WhatsApp aziende Lucaniko Shop (guide pratiche, best pratices, aggiornamenti, news)<br />L'accesso è attivato dopo:<br />- approvazione della richiesta<br />- pagamento effettuato online<br />- emissione fattura da parte di INSIDE DI DI PIETRO VITO<br />Il venditore potrà scegliere se rinnovare o meno la partnership alla scadenza (in caso di non rinnovo, il venditore dovrà inviare una email di disdetta, con tutti i dati aziendali di registrazione, in allegato un documento d'identità del titolare, entro 60 giorni dalla data di scadenza). In caso di mancato avviso, il rinnovo sarà automatico.</li>
          <li><b>Commissioni sulle vendite e pagamenti</b><br />- Nessuna commissione di marketplace, salvo diverso accordo.<br />- I pagamenti sono gestiti tramite Stripe: il Venditore deve creare/configurare il proprio account Stripe e completare eventuali verifiche (KYC/AML).<br />- Stripe accredita direttamente al Venditore gli importi delle vendite al netto delle commissioni Stripe e di eventuali trattenute richieste da Stripe.</li>
          <li><b>Obblighi del Venditore (prodotti, conformità e leggi)</b><br />Il Venditore è l’unico responsabile di:<br />- veridicità delle schede prodotto (descrizioni, ingredienti, taglie, compatibilità ricambi, certificazioni)<br />- conformità normativa (es. etichettatura alimentare, sicurezza prodotti, marcatura, RAEE, garanzie)<br />- disponibilità, prezzi, IVA, emissione documenti fiscali (fattura/scontrino dove previsto)<br />- gestione resi, recesso, rimborsi, garanzia e assistenza post-vendita<br />- gestione spedizioni e consegne<br />Lucaniko Shop non garantisce esclusiva di prodotto nè di prezzo. Più venditori possono offrire prodotti uguali o simili anche a prezzi differenti.<br />È vietato vendere prodotti illegali, contraffatti, pericolosi o soggetti a restrizioni non gestibili sulla Piattaforma.</li>
          <li><b>Spedizioni</b><br />Il Venditore imposta aree servite, tempi, corrieri e costi.<br />Il Venditore è responsabile di imballaggio, integrità e tracciamento.</li>
          <li><b>Termini di vendita del Venditore</b><br />Ogni Venditore deve pubblicare i propri Termini e Condizioni di vendita (spedizioni, resi, recesso, garanzie, contatti), che l’Acquirente dovrà accettare in fase di checkout.</li>
          <li><b>Pagina venditore e contenuti</b><br />Il Venditore può avere una pagina dedicata con:<br />- logo e descrizione<br />- contatti cliccabili (telefono, email, sito, social)<br />- indirizzo<br />- catalogo prodotti<br />Il Venditore garantisce di avere i diritti d’uso su logo, immagini e testi caricati e manleva Lucaniko Shop da rivendicazioni di terzi.</li>
          <li><b>Uso della Piattaforma e condotte vietate</b><br />È vietato:<br />- utilizzare la Piattaforma per finalità illecite<br />- inserire contenuti ingannevoli o non conformi<br />- aggirare i flussi di pagamento della Piattaforma se non autorizzato<br />- sollecitare pagamenti esterni per ordini generati dal marketplace</li>
          <li><b>Sospensione e cessazione</b><br />Lucaniko Shop può sospendere o disattivare l’account venditore (anche senza preavviso nei casi gravi) in caso di:<br />- violazioni normative o dei presenti Termini<br />- contestazioni ripetute, frodi, prodotti vietati<br />- inadempimenti gravi nella gestione ordini/resi<br />Il Venditore può recedere dall’adesione secondo le modalità indicate; gli importi dell’abbonamento già pagati possono essere non rimborsabili salvo obblighi di legge o diversa previsione contrattuale.</li>
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
}

export default RegisterCompanyForm;
