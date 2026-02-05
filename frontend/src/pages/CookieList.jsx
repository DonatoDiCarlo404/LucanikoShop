import React from 'react';
import { Container, Row, Col, Card, Table, Badge } from 'react-bootstrap';
import SEOHelmet from '../components/SEOHelmet';

const CookieList = () => {
  const cookieData = [
    // Cookie Tecnici/Necessari
    {
      category: 'Tecnici/Necessari',
      name: 'lucaniko_auth_token',
      provider: 'Lucaniko Shop',
      purpose: 'Mantiene la sessione utente autenticato',
      type: 'HTTP Cookie',
      duration: 'Sessione o 30 giorni (se "Ricordami")',
      consent: false
    },
    {
      category: 'Tecnici/Necessari',
      name: 'lucaniko_cookie_consent',
      provider: 'Lucaniko Shop',
      purpose: 'Memorizza le preferenze cookie dell\'utente',
      type: 'LocalStorage',
      duration: 'Permanente (finché non viene cancellato)',
      consent: false
    },
    {
      category: 'Tecnici/Necessari',
      name: 'cart_items',
      provider: 'Lucaniko Shop',
      purpose: 'Memorizza i prodotti nel carrello',
      type: 'LocalStorage',
      duration: 'Permanente (finché non viene svuotato)',
      consent: false
    },
    {
      category: 'Tecnici/Necessari',
      name: 'XSRF-TOKEN',
      provider: 'Lucaniko Shop',
      purpose: 'Protezione contro attacchi Cross-Site Request Forgery',
      type: 'HTTP Cookie',
      duration: 'Sessione',
      consent: false
    },
    
    // Cookie di Preferenza/Funzionalità
    {
      category: 'Preferenza/Funzionalità',
      name: 'language_preference',
      provider: 'Lucaniko Shop',
      purpose: 'Memorizza la lingua preferita dall\'utente',
      type: 'LocalStorage',
      duration: '1 anno',
      consent: true
    },
    {
      category: 'Preferenza/Funzionalità',
      name: 'theme_mode',
      provider: 'Lucaniko Shop',
      purpose: 'Memorizza la preferenza tema chiaro/scuro',
      type: 'LocalStorage',
      duration: '1 anno',
      consent: true
    },
    {
      category: 'Preferenza/Funzionalità',
      name: 'product_view_mode',
      provider: 'Lucaniko Shop',
      purpose: 'Memorizza la modalità di visualizzazione prodotti (griglia/lista)',
      type: 'LocalStorage',
      duration: '6 mesi',
      consent: true
    },
    
    // Cookie Analitici
    {
      category: 'Analitici',
      name: '_ga',
      provider: 'Google Analytics',
      purpose: 'Distingue gli utenti e misura le interazioni con il sito',
      type: 'HTTP Cookie',
      duration: '2 anni',
      consent: true
    },
    {
      category: 'Analitici',
      name: '_ga_*',
      provider: 'Google Analytics',
      purpose: 'Raccoglie dati sulle visite e le pagine visualizzate',
      type: 'HTTP Cookie',
      duration: '2 anni',
      consent: true
    },
    {
      category: 'Analitici',
      name: '_gid',
      provider: 'Google Analytics',
      purpose: 'Distingue gli utenti per 24 ore',
      type: 'HTTP Cookie',
      duration: '24 ore',
      consent: true
    },
    {
      category: 'Analitici',
      name: '_gat',
      provider: 'Google Analytics',
      purpose: 'Limita la velocità di richiesta',
      type: 'HTTP Cookie',
      duration: '1 minuto',
      consent: true
    },
    
    // Cookie Marketing/Profilazione
    {
      category: 'Marketing/Profilazione',
      name: 'VISITOR_INFO1_LIVE',
      provider: 'YouTube (Google)',
      purpose: 'Traccia le preferenze video e statistiche',
      type: 'HTTP Cookie',
      duration: '6 mesi',
      consent: true
    },
    {
      category: 'Marketing/Profilazione',
      name: 'YSC',
      provider: 'YouTube (Google)',
      purpose: 'Registra un ID univoco per statistiche video',
      type: 'HTTP Cookie',
      duration: 'Sessione',
      consent: true
    },
    {
      category: 'Marketing/Profilazione',
      name: '_fbp',
      provider: 'Facebook Pixel',
      purpose: 'Traccia le visite e le conversioni per pubblicità mirate',
      type: 'HTTP Cookie',
      duration: '3 mesi',
      consent: true
    },
    {
      category: 'Marketing/Profilazione',
      name: 'fr',
      provider: 'Facebook',
      purpose: 'Fornisce pubblicità mirata e misura l\'efficacia',
      type: 'HTTP Cookie',
      duration: '3 mesi',
      consent: true
    },
    {
      category: 'Marketing/Profilazione',
      name: 'IDE',
      provider: 'Google DoubleClick',
      purpose: 'Pubblicità personalizzata e remarketing',
      type: 'HTTP Cookie',
      duration: '1 anno',
      consent: true
    },
    {
      category: 'Marketing/Profilazione',
      name: 'test_cookie',
      provider: 'Google DoubleClick',
      purpose: 'Verifica se il browser accetta i cookie',
      type: 'HTTP Cookie',
      duration: '15 minuti',
      consent: true
    },
    
    // Cookie Payment Providers
    {
      category: 'Tecnici/Necessari',
      name: '__stripe_mid',
      provider: 'Stripe',
      purpose: 'Prevenzione frodi nei pagamenti',
      type: 'HTTP Cookie',
      duration: '1 anno',
      consent: false
    },
    {
      category: 'Tecnici/Necessari',
      name: '__stripe_sid',
      provider: 'Stripe',
      purpose: 'Prevenzione frodi nei pagamenti',
      type: 'HTTP Cookie',
      duration: '30 minuti',
      consent: false
    }
  ];

  // Raggruppa per categoria
  const categories = [
    'Tecnici/Necessari',
    'Preferenza/Funzionalità',
    'Analitici',
    'Marketing/Profilazione'
  ];

  const categoryDescriptions = {
    'Tecnici/Necessari': 'Cookie essenziali per il funzionamento del sito. Non richiedono consenso.',
    'Preferenza/Funzionalità': 'Cookie che memorizzano le preferenze dell\'utente per migliorare l\'esperienza di navigazione.',
    'Analitici': 'Cookie che permettono di analizzare come gli utenti utilizzano il sito per migliorarne le prestazioni.',
    'Marketing/Profilazione': 'Cookie utilizzati per mostrare contenuti pubblicitari personalizzati in base agli interessi dell\'utente.'
  };

  const categoryColors = {
    'Tecnici/Necessari': 'success',
    'Preferenza/Funzionalità': 'info',
    'Analitici': 'warning',
    'Marketing/Profilazione': 'danger'
  };

  return (
    <>
      <SEOHelmet 
        title="Elenco Cookie - Lucaniko Shop"
        description="Elenco completo dei cookie utilizzati da Lucaniko Shop, marketplace dell'artigianato lucano. Informazioni su cookie tecnici, analitici e di marketing."
        keywords="elenco cookie, cookie policy, GDPR, privacy, cookie tecnici, cookie analitici"
        url="https://lucanikoshop.it/cookie-list"
      />
      
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={11} xl={10}>
            <h1 className="text-center mb-4" style={{ color: '#2c3e50', fontWeight: 700 }}>
              🍪 Elenco Cookie Utilizzati
            </h1>
            
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-3">Informazioni sull'Elenco Cookie</h5>
                <p style={{ lineHeight: 1.8 }}>
                  In questa pagina troverai l'elenco completo e dettagliato di tutti i cookie utilizzati 
                  dal sito <strong>Lucaniko Shop</strong>. Ogni cookie è classificato per categoria, 
                  con informazioni su finalità, durata, provider e necessità di consenso secondo il 
                  Regolamento GDPR (UE) 2016/679.
                </p>
                <p className="mb-0" style={{ lineHeight: 1.8 }}>
                  Ultimo aggiornamento: <strong>5 febbraio 2026</strong>
                </p>
              </Card.Body>
            </Card>

            {categories.map((category) => {
              const categoryCookies = cookieData.filter(c => c.category === category);
              
              return (
                <Card key={category} className="mb-4 border-0 shadow-sm">
                  <Card.Header className={`bg-${categoryColors[category]} text-white`}>
                    <h4 className="mb-2">
                      {category}
                      <Badge bg="light" text="dark" className="ms-3">
                        {categoryCookies.length} cookie
                      </Badge>
                    </h4>
                    <p className="mb-0 small">{categoryDescriptions[category]}</p>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: '15%' }}>Nome Cookie</th>
                            <th style={{ width: '15%' }}>Provider</th>
                            <th style={{ width: '30%' }}>Finalità</th>
                            <th style={{ width: '10%' }}>Tipo</th>
                            <th style={{ width: '15%' }}>Durata</th>
                            <th style={{ width: '15%' }}>Consenso</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryCookies.map((cookie, idx) => (
                            <tr key={idx}>
                              <td>
                                <code style={{ 
                                  fontSize: '0.85rem',
                                  color: '#e83e8c',
                                  backgroundColor: '#f8f9fa',
                                  padding: '2px 6px',
                                  borderRadius: '3px'
                                }}>
                                  {cookie.name}
                                </code>
                              </td>
                              <td>{cookie.provider}</td>
                              <td style={{ fontSize: '0.9rem' }}>{cookie.purpose}</td>
                              <td>
                                <Badge 
                                  bg={cookie.type === 'HTTP Cookie' ? 'primary' : 'secondary'}
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  {cookie.type}
                                </Badge>
                              </td>
                              <td style={{ fontSize: '0.9rem' }}>{cookie.duration}</td>
                              <td>
                                {cookie.consent ? (
                                  <Badge bg="warning" text="dark">
                                    Richiesto
                                  </Badge>
                                ) : (
                                  <Badge bg="success">
                                    Non richiesto
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              );
            })}

            <Card className="border-0 shadow-sm bg-light">
              <Card.Body className="p-4">
                <h5 className="mb-3">
                  <i className="bi bi-gear-fill me-2"></i>
                  Come gestire i cookie
                </h5>
                <p style={{ lineHeight: 1.8 }}>
                  Puoi gestire le tue preferenze cookie in qualsiasi momento attraverso:
                </p>
                <ul style={{ lineHeight: 1.8 }}>
                  <li>Il banner cookie che appare alla prima visita del sito</li>
                  <li>Le impostazioni del tuo browser (Chrome, Firefox, Safari, Edge, Opera)</li>
                  <li>Gli strumenti di opt-out specifici dei provider (es. Google Analytics Opt-out)</li>
                </ul>
                
                <h6 className="mt-4 mb-3">Link utili:</h6>
                <ul style={{ lineHeight: 1.8 }}>
                  <li>
                    <a href="/privacy-policy" className="text-decoration-none">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="/cookie-policy" className="text-decoration-none">
                      Cookie Policy
                    </a>
                  </li>
                  <li>
                    <a href="https://tools.google.com/dlpage/gaoptout" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-decoration-none">
                      Google Analytics Opt-out Browser Add-on
                    </a>
                  </li>
                  <li>
                    <a href="https://www.youronlinechoices.com/it/" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-decoration-none">
                      Your Online Choices (gestione cookie pubblicitari)
                    </a>
                  </li>
                </ul>

                <div className="alert alert-info mt-4 mb-0">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  <strong>Nota:</strong> La disabilitazione dei cookie tecnici potrebbe compromettere 
                  alcune funzionalità del sito, come l'autenticazione e il carrello acquisti.
                </div>
              </Card.Body>
            </Card>

            <div className="text-center mt-4">
              <p className="text-muted mb-0">
                Per domande o richieste relative ai cookie, contattaci all'indirizzo:{' '}
                <a href="mailto:info@lucanikoshop.it" className="text-decoration-none">
                  info@lucanikoshop.it
                </a>
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default CookieList;
