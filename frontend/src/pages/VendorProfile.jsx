import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Badge,
  Tabs,
  Tab,
  Table,
  Modal
} from 'react-bootstrap';
import { useAuth } from '../context/authContext';
import DefaultShippingRateInput from './DefaultShippingRateInput';

const VendorProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sellerId = searchParams.get('sellerId'); // ID del venditore da visualizzare (solo admin)
  
  // State per la tab attiva
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'info');

  // State per profilo
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState(null);

  // State per statistiche
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);

  // State per modal tariffe spedizione
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [editingShippingRate, setEditingShippingRate] = useState(null);
  const [shippingRateForm, setShippingRateForm] = useState({
    name: '',
    description: '',
    calculationType: 'fixed',
    baseRate: 0,
    ratePerUnit: 0,
    estimatedDays: '',
    zones: []
  });

  // State per Abbonamento
  const [vendorDocs, setVendorDocs] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardHolder: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  // State per gestione sconti
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountForm, setDiscountForm] = useState({
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    applicationType: 'all',
    products: [],
    categories: [],
    couponCode: '',
    startDate: '',
    endDate: '',
    usageLimit: null,
    minPurchaseAmount: 0,
    maxDiscountAmount: null
  });

  // State per form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessName: '',
    ragioneSociale: '',
    businessDescription: '',
    vatNumber: '',
    codiceSDI: '',
    logo: {
      url: '',
      public_id: ''
    },
    businessEmail: '',
    businessPhone: '',
    businessWhatsapp: '',
    website: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      // twitter: '',
      // linkedin: '',
      tiktok: ''
    },
    storeAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      coordinates: {
        lat: null,
        lng: null
      }
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    businessAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    bankAccount: {
      iban: '',
      bankName: ''
    },
    shopSettings: {
      paymentMethods: {
        bankTransfer: {
          enabled: true,
          iban: '',
          bankName: '',
          accountHolder: ''
        },
        paypal: {
          enabled: false,
          email: ''
        },
        stripe: {
          enabled: false,
          accountId: '',
          onboardingComplete: false
        },
        cashOnDelivery: {
          enabled: false,
          extraFee: 0
        }
      },
      termsAndConditions: {
        content: '',
        lastUpdated: null,
        version: 1
      },
      shipping: {
        freeShipping: false,
        freeShippingThreshold: 0,
        defaultShippingRate: 0,
        shippingRates: []
      },
      productSettings: {
        enableColors: false,
        availableColors: [],
        enableSizes: false,
        availableSizes: [],
        enableShoeNumbers: false,
        availableShoeNumbers: [],
        customVariants: []
      },
      returnPolicy: {
        enabled: false,
        days: 0,
        description: ''
      }
    }
  });

  // Verifica autorizzazione
  useEffect(() => {
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
      navigate('/');
    } else {
      loadProfile();
      // Carica sempre i prodotti
      loadStats();
      // Carica sconti
      loadDiscounts();
      // Non caricare documenti se admin sta visualizzando profilo altrui
      if (!(user.role === 'admin' && sellerId)) {
        loadVendorDocuments();
      }
    }
  }, [user, navigate, sellerId]);

  // Sincronizza activeTab con searchParams
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Carica documenti PDF del venditore
  const loadVendorDocuments = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/upload/vendor/${user._id}/list`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setVendorDocs(data.files || []);
      }
    } catch (err) {
      console.error('Errore caricamento documenti:', err);
    }
  };

  // Carica profilo venditore
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');

      // Se admin e sellerId presente, carica profilo del venditore specifico
      const url = (user.role === 'admin' && sellerId) 
        ? `http://localhost:5000/api/admin/sellers/${sellerId}`
        : 'http://localhost:5000/api/auth/vendor-profile';

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!res.ok) {
        throw new Error('Errore nel caricamento del profilo');
      }

      const data = await res.json();
      setProfileData(data);
      
      // Popola il form con i dati esistenti
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        businessName: data.businessName || '',
        ragioneSociale: data.ragioneSociale || '',
        businessDescription: data.businessDescription || '',
        vatNumber: data.vatNumber || '',
        codiceSDI: data.codiceSDI || '',
        logo: data.logo || { url: '', public_id: '' },
        businessEmail: data.businessEmail || '',
        businessPhone: data.businessPhone || '',
        businessWhatsapp: data.businessWhatsapp || '',
        website: data.website || '',
        socialLinks: data.socialLinks || {
          facebook: '',
          instagram: '',
          // twitter: '',
          // linkedin: '',
          tiktok: ''
        },
        storeAddress: {
          street: data.storeAddress?.street || '',
          city: data.storeAddress?.city || '',
          state: data.storeAddress?.state || '',
          zipCode: data.storeAddress?.zipCode || '',
          country: data.storeAddress?.country || '',
          coordinates: {
            lat: data.storeAddress?.coordinates?.lat || null,
            lng: data.storeAddress?.coordinates?.lng || null
          }
        },
        address: data.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        businessAddress: data.businessAddress || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        bankAccount: data.bankAccount || {
          iban: '',
          bankName: ''
        },
        shopSettings: {
          paymentMethods: {
            bankTransfer: {
              enabled: data.shopSettings?.paymentMethods?.bankTransfer?.enabled ?? true,
              iban: data.shopSettings?.paymentMethods?.bankTransfer?.iban || data.bankAccount?.iban || '',
              bankName: data.shopSettings?.paymentMethods?.bankTransfer?.bankName || data.bankAccount?.bankName || '',
              accountHolder: data.shopSettings?.paymentMethods?.bankTransfer?.accountHolder || data.name || ''
            },
            paypal: { 
              enabled: data.shopSettings?.paymentMethods?.paypal?.enabled || false, 
              email: data.shopSettings?.paymentMethods?.paypal?.email || '' 
            },
            stripe: { 
              enabled: data.shopSettings?.paymentMethods?.stripe?.enabled || false, 
              accountId: data.shopSettings?.paymentMethods?.stripe?.accountId || '', 
              onboardingComplete: data.shopSettings?.paymentMethods?.stripe?.onboardingComplete || false 
            },
            cashOnDelivery: { 
              enabled: data.shopSettings?.paymentMethods?.cashOnDelivery?.enabled || false, 
              extraFee: data.shopSettings?.paymentMethods?.cashOnDelivery?.extraFee || 0 
            }
          },
          termsAndConditions: {
            content: data.shopSettings?.termsAndConditions?.content || '',
            lastUpdated: data.shopSettings?.termsAndConditions?.lastUpdated || null,
            version: data.shopSettings?.termsAndConditions?.version || 1
          },
          shipping: {
            freeShipping: data.shopSettings?.shipping?.freeShipping || false,
            freeShippingThreshold: data.shopSettings?.shipping?.freeShippingThreshold || 0,
            defaultShippingRate: data.shopSettings?.shipping?.defaultShippingRate || 0,
            shippingRates: data.shopSettings?.shipping?.shippingRates || []
          },
          productSettings: {
            enableColors: data.shopSettings?.productSettings?.enableColors || false,
            availableColors: data.shopSettings?.productSettings?.availableColors || [],
            enableSizes: data.shopSettings?.productSettings?.enableSizes || false,
            availableSizes: data.shopSettings?.productSettings?.availableSizes || [],
            enableShoeNumbers: data.shopSettings?.productSettings?.enableShoeNumbers || false,
            availableShoeNumbers: data.shopSettings?.productSettings?.availableShoeNumbers || [],
            customVariants: data.shopSettings?.productSettings?.customVariants || []
          },
          returnPolicy: {
            enabled: data.shopSettings?.returnPolicy?.enabled || false,
            days: data.shopSettings?.returnPolicy?.days || 0,
            description: data.shopSettings?.returnPolicy?.description || ''
          }
        }
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Carica sconti del venditore
  const loadDiscounts = async () => {
    try {
      // Se admin visualizza venditore specifico, carica i suoi sconti
      const url = (user.role === 'admin' && sellerId)
        ? `http://localhost:5000/api/discounts?sellerId=${sellerId}`
        : 'http://localhost:5000/api/discounts';

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setDiscounts(data.discounts || []);
      }
    } catch (err) {
      console.error('Errore caricamento sconti:', err);
    }
  };

  // Carica statistiche
  const loadStats = async () => {
    try {
      // Carica statistiche
      const statsRes = await fetch('http://localhost:5000/api/orders/vendor/stats', {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Carica ordini recenti
      const ordersRes = await fetch('http://localhost:5000/api/orders/vendor/received', {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.slice(0, 5)); // Solo ultimi 5
      }

      // Carica prodotti - se admin visualizza venditore specifico, carica i suoi prodotti
      let productsUrl = 'http://localhost:5000/api/products/seller/my-products';
      
      // Se admin sta visualizzando profilo di un venditore specifico, carica i suoi prodotti
      if (user.role === 'admin' && sellerId) {
        // Recupera tutti i prodotti e filtra per venditore
        const allProductsRes = await fetch('http://localhost:5000/api/admin/products', {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });
        
        if (allProductsRes.ok) {
          const allProducts = await allProductsRes.json();
          const vendorProducts = allProducts.filter(p => p.seller?._id === sellerId || p.seller === sellerId);
          setProducts(vendorProducts);
        }
      } else {
        // Venditore visualizza i propri prodotti
        const productsRes = await fetch(productsUrl, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }
      }

    } catch (err) {
      console.error('Errore caricamento statistiche:', err);
    }
  };

  // Gestisce cambio input
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      } else if (parts.length === 3) {
        const [parent, child, grandchild] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [grandchild]: value
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Funzione per salvare il profilo (riutilizzabile)
  const saveProfile = async (dataToSave, successMessage = 'Profilo aggiornato con successo!') => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Se admin sta modificando profilo di un altro venditore, usa endpoint specifico
      const url = (user.role === 'admin' && sellerId)
        ? `http://localhost:5000/api/admin/sellers/${sellerId}/profile`
        : 'http://localhost:5000/api/auth/vendor-profile';

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(dataToSave)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Errore nel salvataggio del profilo');
      }


      setSuccess(successMessage);
      setProfileData(data);
      setTimeout(() => setSuccess(''), 1000);
      return true;

    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Salva profilo
  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveProfile(formData);
  };

  // Crea nuovo sconto
  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');

      // Se admin crea sconto per venditore, aggiungi sellerId
      const discountData = { ...discountForm };
      if (user.role === 'admin' && sellerId) {
        discountData.sellerId = sellerId;
      }

      const res = await fetch('http://localhost:5000/api/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(discountData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Errore nella creazione dello sconto');
      }

      setSuccess('Sconto creato con successo!');
      setTimeout(() => setSuccess(''), 3000);
      setShowDiscountModal(false);
      
      // Reset form
      setDiscountForm({
        name: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        applicationType: 'all',
        products: [],
        categories: [],
        couponCode: '',
        startDate: '',
        endDate: '',
        usageLimit: null,
        minPurchaseAmount: 0,
        maxDiscountAmount: null
      });

      // Ricarica sconti
      loadDiscounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Elimina sconto
  const handleDeleteDiscount = async (discountId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo sconto?')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/discounts/${discountId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Errore nell\'eliminazione dello sconto');
      }

      setSuccess('Sconto eliminato con successo!');
      setTimeout(() => setSuccess(''), 3000);
      loadDiscounts();
    } catch (err) {
      setError(err.message);
    }
  };

  // Attiva/Disattiva sconto
  const handleToggleDiscount = async (discountId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/discounts/${discountId}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Errore nell\'aggiornamento dello sconto');
      }

      loadDiscounts();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-3">Caricamento profilo...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5">
      {/* --- SEZIONE PUBBLICA: LOGO, CONTATTI, PRODOTTI --- */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="align-items-start">
            <Col md={5} className="text-md-start mt-4 mt-md-0">
              {/* Logo */}
              <div className="mb-3">
                {profileData?.logo?.url ? (
                  <img src={profileData.logo.url} alt="Logo" style={{ width: 140, height: 140, borderRadius: 18, border: '2.5px solid #eee', background: '#fff', objectFit: 'contain'  }} />
                ) : (
                  <div style={{ width: 90, height: 90, borderRadius: 12, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee', marginLeft: 'auto' }} >
                    <span className="text-muted">Nessun logo</span>
                  </div>
                )}
              </div>
              {/* Descrizione attività */}
              {profileData?.businessDescription && (
                <div className="text-muted mb-2" style={{ fontSize: 15 }}>{profileData.businessDescription}</div>
              )}
              {/* Contatti */}
              {profileData?.businessPhone && <div><strong>Telefono:</strong> <a href={`tel:${profileData.businessPhone}`}>{profileData.businessPhone}</a></div>}
              {/* Social */}
              {profileData?.socialLinks && (
                <>
                  <div className="mt-1">
                    {profileData.socialLinks?.facebook && <a href={profileData.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="me-2" title="Facebook"><i className="bi bi-facebook" style={{ fontSize: 22 }}></i></a>}
                    {profileData.socialLinks?.instagram && <a href={profileData.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="me-2" title="Instagram"><i className="bi bi-instagram" style={{ fontSize: 22 }}></i></a>}
                    {profileData.socialLinks?.tiktok && <a href={profileData.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="me-2" title="TikTok"><i className="bi bi-tiktok" style={{ fontSize: 22 }}></i></a>}
                    {profileData.businessWhatsapp && <a href={`https://wa.me/${profileData.businessWhatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="me-2" title="WhatsApp"><i className="bi bi-whatsapp" style={{ fontSize: 22 }}></i></a>}
                    {profileData.website && <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="me-2" title="Sito Web"><i className="bi bi-globe" style={{ fontSize: 22 }}></i></a>}
                  </div>
                  <div className="d-block d-md-none w-100" style={{ borderBottom: '1px solid #eee', margin: '12px 0' }}></div>
                </>
              )}
            </Col>
            <Col md={7}>
              <h4 className="mb-1">{profileData?.businessName || 'Negozio'}</h4>
              {profileData?.ragioneSociale && (
                <div className="text-muted" style={{ fontSize: 14 }}><strong>Ragione sociale:</strong> {profileData.ragioneSociale}</div>
              )}
              <div>
                {profileData?.vatNumber && <div><strong>P.IVA:</strong> {profileData.vatNumber}</div>}
                {profileData?.codiceSDI && <div><strong>Codice SDI:</strong> {profileData.codiceSDI}</div>}
                {profileData?.businessEmail && <div><strong>Email:</strong> <a href={`mailto:${profileData.businessEmail}`}>{profileData.businessEmail}</a></div>}
                {profileData?.businessAddress && (
                  <div><strong>Indirizzo sede legale:</strong> {[
                    profileData.businessAddress.street,
                    profileData.businessAddress.city,
                    profileData.businessAddress.state,
                    profileData.businessAddress.zipCode,
                    profileData.businessAddress.country
                  ].filter(Boolean).join(', ')}</div>
                )}
                {/* Indirizzo punto vendita (opzionale, privato) */}
                {profileData?.storeAddress &&
                  Object.values(profileData.storeAddress).some(v => typeof v === 'string' ? v.trim() : v && typeof v === 'object' && Object.values(v).some(x => x)) && (
                    <div><strong>Indirizzo punto vendita:</strong> {[
                      profileData.storeAddress.street,
                      profileData.storeAddress.city,
                      profileData.storeAddress.state,
                      profileData.storeAddress.zipCode,
                      profileData.storeAddress.country
                    ].filter(Boolean).join(', ')}</div>
                )}
                {/* Data di registrazione */}
                {(profileData?.memberSince || profileData?.createdAt) && (
                  <div><strong>Registrato su LucanikoShop:</strong> {new Date(profileData.memberSince || profileData.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                )}
                {/* Rateo recensioni ricevute */}
                <div className="mt-4 text-end" style={{ fontSize: 15 }}>
                  <span style={{ color: '#f5b50a', fontWeight: 600 }}>
                    <i className="bi bi-star-fill"></i> {profileData?.reviewStats?.avg?.toFixed(1) || stats?.reviewAvg?.toFixed(1) || '0.0'} / 5
                  </span>
                  <span className="text-muted ms-2">su {profileData?.reviewStats?.count || stats?.reviewCount || 0} recensioni</span>
                </div>
                {profileData?.bankAccount?.iban && (
                  <div><strong>IBAN:</strong> {profileData.bankAccount.iban}</div>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      {/* --- FINE SEZIONE PUBBLICA --- */}

      {/* --- SEZIONE PRODOTTI DEL VENDITORE RIMOSSA SU RICHIESTA --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>👤 Profilo Aziendale</h2>
          <p className="text-muted">Gestisci le informazioni del tuo negozio</p>
        </div>
        {profileData && !profileData.isApproved && (
          <Badge bg="warning" style={{ fontSize: '1rem', padding: '10px 15px' }}>
            ⏳ In attesa di approvazione
          </Badge>
        )}
        {profileData && profileData.isApproved && (
          <Badge bg="success" style={{ fontSize: '1rem', padding: '10px 15px' }}>
            ✅ Verificato
          </Badge>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {/* MODAL SUCCESSO PROFILO */}
      <Modal show={!!success} onHide={() => setSuccess('')} centered backdrop="static" keyboard={false}>
        <Modal.Body className="text-center py-4">
          <div style={{ fontSize: 40, color: '#28a745' }}>
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <h5 className="mt-3">Profilo aggiornato con successo!</h5>
        </Modal.Body>
      </Modal>
      {/* FINE MODAL SUCCESSO */}

      <Tabs 
        activeKey={activeTab} 
        onSelect={(k) => {
          setActiveTab(k);
          const params = new URLSearchParams(searchParams);
          params.set('tab', k);
          setSearchParams(params);
        }}
        className="mb-4"
      >
        {/* TAB INFORMAZIONI AZIENDA */}
        <Tab eventKey="info" title="📋 Informazioni Azienda">
          <Card>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <h5 className="mb-3">Dati Personali</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nome e Cognome Referente *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Telefono</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+39 123 456 7890"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-4" />

                <h5 className="mb-3">Dati Aziendali</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nome Negozio *</Form.Label>
                      <Form.Control
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                    {/* CAMPO RAGIONE SOCIALE */}
                    <Form.Group className="mb-3">
                      <Form.Label>Ragione Sociale</Form.Label>
                      <Form.Control
                        type="text"
                        name="ragioneSociale"
                        value={formData.ragioneSociale || ''}
                        onChange={handleChange}
                        placeholder="Es: Lucaniko S.r.l."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Logo Azienda</Form.Label>
                      <div className="d-flex align-items-center gap-3">
                        {formData.logo?.url ? (
                          <img src={formData.logo.url} alt="Logo" style={{ width: 60, height: 60, borderRadius: 8, border: '1px solid #eee', objectFit: 'contain', background: '#fff' }} />
                        ) : (
                          <div style={{ width: 60, height: 60, borderRadius: 8, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee' }}>
                            <span className="text-muted small">Nessun logo</span>
                          </div>
                        )}
                        <Form.Control
                          type="file"
                          accept="image/*"
                          style={{ maxWidth: 180 }}
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const formDataUpload = new FormData();
                            formDataUpload.append('image', file);
                            try {
                              const res = await fetch('http://localhost:5000/api/upload/product', {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${user.token}` },
                                body: formDataUpload
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.message || 'Errore upload logo');
                              const newLogo = { url: data.url, public_id: data.public_id };
                              setFormData(prev => ({ ...prev, logo: newLogo }));
                              // Salva subito il logo
                              await saveProfile({ ...formData, logo: newLogo }, 'Logo aggiornato!');
                            } catch (err) {
                              setError(err.message);
                            }
                          }}
                        />
                      </div>
                      <Form.Text className="text-muted">Carica un logo PNG/JPG quadrato, max 1MB.</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Partita IVA *</Form.Label>
                      <Form.Control
                        type="text"
                        name="vatNumber"
                        value={formData.vatNumber}
                        onChange={handleChange}
                        placeholder="IT12345678901"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Codice SDI</Form.Label>
                      <Form.Control
                        type="text"
                        name="codiceSDI"
                        value={formData.codiceSDI}
                        onChange={handleChange}
                        placeholder="Es: M5UXCR1"
                        maxLength={7}
                      />
                      <Form.Text className="text-muted">
                        Codice per fatturazione elettronica (7 caratteri)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Descrizione Attività</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="businessDescription"
                    value={formData.businessDescription}
                    onChange={handleChange}
                    placeholder="Descrivi la tua attività..."
                    maxLength={500}
                  />
                  <Form.Text className="text-muted">
                    {formData.businessDescription.length}/500 caratteri
                  </Form.Text>
                </Form.Group>

                <hr className="my-4" />

                <h5 className="mb-3">Indirizzo Sede Legale</h5>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Via e Numero Civico</Form.Label>
                      <Form.Control
                        type="text"
                        name="businessAddress.street"
                        value={formData.businessAddress.street}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Città</Form.Label>
                      <Form.Control
                        type="text"
                        name="businessAddress.city"
                        value={formData.businessAddress.city}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Provincia</Form.Label>
                      <Form.Control
                        type="text"
                        name="businessAddress.state"
                        value={formData.businessAddress.state}
                        onChange={handleChange}
                        placeholder="Es: RM"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>CAP</Form.Label>
                      <Form.Control
                        type="text"
                        name="businessAddress.zipCode"
                        value={formData.businessAddress.zipCode}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Paese</Form.Label>
                      <Form.Control
                        type="text"
                        name="businessAddress.country"
                        value={formData.businessAddress.country}
                        onChange={handleChange}
                        placeholder="Italia"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-4" />


                <div className="d-flex justify-content-end mt-4">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={saving}
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Salvataggio...
                      </>
                    ) : (
                      '💾 Salva Modifiche'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB CONTATTI E SOCIAL */}
        <Tab eventKey="contacts" title="📞 Contatti e Social">
          <Card>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <h5 className="mb-3">Contatti Negozio</h5>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Negozio</Form.Label>
                      <Form.Control
                        type="email"
                        name="businessEmail"
                        value={formData.businessEmail}
                        onChange={handleChange}
                        placeholder="info@mioshop.it"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Telefono Negozio</Form.Label>
                      <Form.Control
                        type="tel"
                        name="businessPhone"
                        value={formData.businessPhone}
                        onChange={handleChange}
                        placeholder="+39 123 456 7890"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>WhatsApp Negozio</Form.Label>
                      <Form.Control
                        type="tel"
                        name="businessWhatsapp"
                        value={formData.businessWhatsapp}
                        onChange={handleChange}
                        placeholder="+39 333 1234567"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Sito Web</Form.Label>
                  <Form.Control
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://www.mioshop.it"
                  />
                </Form.Group>

                <hr className="my-4" />

                <h5 className="mb-3">Link Social</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Facebook</Form.Label>
                      <Form.Control
                        type="url"
                        name="socialLinks.facebook"
                        value={formData.socialLinks.facebook}
                        onChange={handleChange}
                        placeholder="https://facebook.com/mioshop"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Instagram</Form.Label>
                      <Form.Control
                        type="url"
                        name="socialLinks.instagram"
                        value={formData.socialLinks.instagram}
                        onChange={handleChange}
                        placeholder="https://instagram.com/mioshop"
                      />
                    </Form.Group>
                  </Col>
                  {/* Twitter e LinkedIn rimossi */}
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>TikTok</Form.Label>
                      <Form.Control
                        type="url"
                        name="socialLinks.tiktok"
                        value={formData.socialLinks.tiktok}
                        onChange={handleChange}
                        placeholder="https://tiktok.com/@mioshop"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-4" />

                <h5 className="mb-3">Indirizzo Punto Vendita (opzionale)</h5>
                <Alert variant="info" className="mb-3">
                  Se l'indirizzo del tuo negozio è diverso dalla sede legale, inseriscilo qui. 
                </Alert>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Via e Numero Civico</Form.Label>
                      <Form.Control
                        type="text"
                        name="storeAddress.street"
                        value={formData.storeAddress.street}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Città</Form.Label>
                      <Form.Control
                        type="text"
                        name="storeAddress.city"
                        value={formData.storeAddress.city}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Provincia</Form.Label>
                      <Form.Control
                        type="text"
                        name="storeAddress.state"
                        value={formData.storeAddress.state}
                        onChange={handleChange}
                        placeholder="Es: RM"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>CAP</Form.Label>
                      <Form.Control
                        type="text"
                        name="storeAddress.zipCode"
                        value={formData.storeAddress.zipCode}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Paese</Form.Label>
                      <Form.Control
                        type="text"
                        name="storeAddress.country"
                        value={formData.storeAddress.country}
                        onChange={handleChange}
                        placeholder="Italia"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end mt-4">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={saving}
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Salvataggio...
                      </>
                    ) : (
                      '💾 Salva Modifiche'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB TUTTI I PRODOTTI */}
        <Tab eventKey="products" title="📦 Tutti i Prodotti">
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h5 className="mb-1">Prodotti di {profileData?.businessName || 'questo venditore'}</h5>
                  <p className="text-muted mb-0">
                    {products.length} prodotto{products.length !== 1 ? 'i' : ''} totale{products.length !== 1 ? 'i' : ''}
                  </p>
                </div>
                <Button 
                  variant="success" 
                  onClick={() => {
                    if (user.role === 'admin' && sellerId) {
                      // Admin crea prodotto per questo venditore
                      navigate(`/products/new?sellerId=${sellerId}`);
                    } else {
                      navigate('/products/new');
                    }
                  }}
                >
                  <i className="bi bi-plus-circle"></i> Nuovo Prodotto
                </Button>
              </div>

              {products.length === 0 ? (
                <Alert variant="info">
                  <i className="bi bi-info-circle"></i> Nessun prodotto caricato. Inizia creando il primo prodotto!
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>Immagine</th>
                        <th>Nome Prodotto</th>
                        <th>Categoria</th>
                        <th>Sottocategoria</th>
                        <th style={{ width: '100px' }}>Prezzo</th>
                        <th style={{ width: '80px' }}>Stock</th>
                        <th style={{ width: '100px' }}>Stato</th>
                        <th style={{ width: '120px' }}>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product._id}>
                          <td>
                            {product.images && product.images.length > 0 ? (
                              <img 
                                src={product.images[0].url} 
                                alt={product.name}
                                style={{ 
                                  width: '60px', 
                                  height: '60px', 
                                  objectFit: 'cover',
                                  borderRadius: '4px'
                                }}
                              />
                            ) : (
                              <div 
                                style={{ 
                                  width: '60px', 
                                  height: '60px', 
                                  backgroundColor: '#e9ecef',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <i className="bi bi-image text-muted"></i>
                              </div>
                            )}
                          </td>
                          <td>
                            <strong>{product.name}</strong>
                            {product.hasVariants && (
                              <Badge bg="info" className="ms-2">
                                {product.variants?.length || 0} varianti
                              </Badge>
                            )}
                          </td>
                          <td>{product.category?.name || '-'}</td>
                          <td>{product.subcategory?.name || '-'}</td>
                          <td>
                            {product.hasActiveDiscount && product.discountedPrice ? (
                              <>
                                <div className="text-decoration-line-through text-muted small">
                                  €{product.originalPrice?.toFixed(2)}
                                </div>
                                <div className="text-danger fw-bold">
                                  €{product.discountedPrice.toFixed(2)}
                                </div>
                              </>
                            ) : (
                              <strong>€{product.price?.toFixed(2)}</strong>
                            )}
                          </td>
                          <td>
                            <Badge bg={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger'}>
                              {product.stock}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={product.isActive ? 'success' : 'secondary'}>
                              {product.isActive ? 'Attivo' : 'Disattivo'}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => {
                                  if (user.role === 'admin' && sellerId) {
                                    // Admin modifica prodotto del venditore
                                    navigate(`/products/${product._id}/edit?sellerId=${sellerId}`);
                                  } else {
                                    navigate(`/products/${product._id}/edit`);
                                  }
                                }}
                                title="Modifica"
                              >
                                <i className="bi bi-pencil"></i>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-info"
                                onClick={() => navigate(`/products/${product._id}`)}
                                title="Visualizza"
                              >
                                <i className="bi bi-eye"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB GESTIONE SCONTI */}
        <Tab eventKey="discounts" title="🎉 Sconti">
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h5 className="mb-1">Gestione Sconti</h5>
                  <p className="text-muted mb-0">
                    Crea e gestisci offerte speciali per i tuoi prodotti
                  </p>
                </div>
                <Button 
                  variant="success" 
                  onClick={() => setShowDiscountModal(true)}
                >
                  <i className="bi bi-plus-circle"></i> Nuovo Sconto
                </Button>
              </div>

              {discounts.length === 0 ? (
                <Alert variant="info">
                  <i className="bi bi-info-circle"></i> Nessuno sconto configurato. Crea il tuo primo sconto!
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Tipo</th>
                        <th>Valore</th>
                        <th>Applicazione</th>
                        <th>Periodo</th>
                        <th>Stato</th>
                        <th style={{ width: '120px' }}>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discounts.map((discount) => (
                        <tr key={discount._id}>
                          <td>
                            <strong>{discount.name}</strong>
                            {discount.description && (
                              <div className="text-muted small">{discount.description}</div>
                            )}
                            {discount.couponCode && (
                              <Badge bg="secondary" className="mt-1">
                                Codice: {discount.couponCode}
                              </Badge>
                            )}
                          </td>
                          <td>
                            <Badge bg="primary">
                              {discount.discountType === 'percentage' ? 'Percentuale' : 'Fisso'}
                            </Badge>
                          </td>
                          <td>
                            <strong>
                              {discount.discountType === 'percentage' 
                                ? `${discount.discountValue}%` 
                                : `€${discount.discountValue.toFixed(2)}`}
                            </strong>
                          </td>
                          <td>
                            {discount.applicationType === 'all' && 'Tutti i prodotti'}
                            {discount.applicationType === 'product' && `${discount.products?.length || 0} prodotti`}
                            {discount.applicationType === 'category' && `${discount.categories?.length || 0} categorie`}
                            {discount.applicationType === 'coupon' && 'Codice coupon'}
                          </td>
                          <td>
                            <div className="small">
                              {new Date(discount.startDate).toLocaleDateString('it-IT')}
                              {' - '}
                              {new Date(discount.endDate).toLocaleDateString('it-IT')}
                            </div>
                            {discount.usageLimit && (
                              <div className="text-muted small">
                                Utilizzi: {discount.usageCount || 0}/{discount.usageLimit}
                              </div>
                            )}
                          </td>
                          <td>
                            <Form.Check 
                              type="switch"
                              checked={discount.isActive}
                              onChange={() => handleToggleDiscount(discount._id)}
                              label={discount.isActive ? 'Attivo' : 'Disattivo'}
                            />
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleDeleteDiscount(discount._id)}
                                title="Elimina"
                              >
                                <i className="bi bi-trash"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB METODI DI PAGAMENTO */}
        <Tab eventKey="payments" title="💳 Pagamenti">
          <Card>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Alert variant="warning">
                  <strong>Importante:</strong> Configura i metodi di pagamento che vuoi offrire ai tuoi clienti
                </Alert>


                <h5 className="mb-3">PayPal</h5>
                <Form.Check 
                  type="checkbox"
                  label="Abilita PayPal"
                  checked={formData.shopSettings.paymentMethods.paypal.enabled}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shopSettings: {
                      ...prev.shopSettings,
                      paymentMethods: {
                        ...prev.shopSettings.paymentMethods,
                        paypal: {
                          ...prev.shopSettings.paymentMethods.paypal,
                          enabled: e.target.checked
                        }
                      }
                    }
                  }))}
                  className="mb-3"
                />
                <Form.Group className="mb-3">
                  <Form.Label>Email PayPal</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.shopSettings.paymentMethods.paypal.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shopSettings: {
                        ...prev.shopSettings,
                        paymentMethods: {
                          ...prev.shopSettings.paymentMethods,
                          paypal: {
                            ...prev.shopSettings.paymentMethods.paypal,
                            email: e.target.value
                          }
                        }
                      }
                    }))}
                    placeholder="tuo@email.com"
                  />
                </Form.Group>

                <hr className="my-4" />

                <h5 className="mb-3">Stripe (Carta di Credito)</h5>
                <Alert variant="info">
                  Stripe Connect permette di accettare pagamenti con carta direttamente sul tuo conto.
                </Alert>
                <Form.Check 
                  type="checkbox"
                  label="Abilita Stripe"
                  checked={formData.shopSettings.paymentMethods.stripe.enabled}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shopSettings: {
                      ...prev.shopSettings,
                      paymentMethods: {
                        ...prev.shopSettings.paymentMethods,
                        stripe: {
                          ...prev.shopSettings.paymentMethods.stripe,
                          enabled: e.target.checked
                        }
                      }
                    }
                  }))}
                  className="mb-3"
                />
                {formData.shopSettings.paymentMethods.stripe.onboardingComplete ? (
                  <Badge bg="success">Configurazione Stripe completata ✓</Badge>
                ) : (
                  <Button variant="primary" size="sm">
                    Configura Stripe Connect
                  </Button>
                )}

                <hr className="my-4" />


                <div className="d-flex justify-content-end mt-4">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={saving}
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Salvataggio...
                      </>
                    ) : (
                      '💾 Salva Modifiche'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB SPEDIZIONI */}
        <Tab eventKey="shipping" title="📦 Spedizioni">
          <Card>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Alert variant="info">
                  Configura le opzioni di spedizione per i tuoi prodotti
                </Alert>

                <h5 className="mb-3">Spedizione Gratuita</h5>
                <Form.Check 
                  type="checkbox"
                  label="Abilita Spedizione Gratuita"
                  checked={formData.shopSettings.shipping.freeShipping}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shopSettings: {
                      ...prev.shopSettings,
                      shipping: {
                        ...prev.shopSettings.shipping,
                        freeShipping: e.target.checked
                      }
                    }
                  }))}
                  className="mb-3"
                />
                
                {formData.shopSettings.shipping.freeShipping && (
                  <Form.Group className="mb-3">
                    <Form.Label>Soglia Minima per Spedizione Gratuita (€)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.shopSettings.shipping.freeShippingThreshold}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        shopSettings: {
                          ...prev.shopSettings,
                          shipping: {
                            ...prev.shopSettings.shipping,
                            freeShippingThreshold: parseFloat(e.target.value) || 0
                          }
                        }
                      }))}
                      placeholder="0.00"
                    />
                    <Form.Text className="text-muted">
                      Lascia 0 per spedizione sempre gratuita
                    </Form.Text>
                  </Form.Group>
                )}

                <hr className="my-4" />

                <h5 className="mb-3">Tariffa Spedizione Predefinita</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Costo Spedizione (€)</Form.Label>
                  <DefaultShippingRateInput
                    value={formData.shopSettings.shipping.defaultShippingRate}
                    onChange={(val) => setFormData(prev => ({
                      ...prev,
                      shopSettings: {
                        ...prev.shopSettings,
                        shipping: {
                          ...prev.shopSettings.shipping,
                          defaultShippingRate: val
                        }
                      }
                    }))}
                  />
                </Form.Group>


                <hr className="my-4" />

                <h5 className="mb-3">Tariffe Avanzate</h5>
                <Alert variant="info">
                  Configura tariffe personalizzate basate su peso, regioni italiane o zone geografiche
                </Alert>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Tariffe Configurate</h6>
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={() => {
                      setEditingShippingRate(null);
                      setShippingRateForm({
                        name: '',
                        description: '',
                        calculationType: 'fixed',
                        baseRate: 0,
                        ratePerUnit: 0,
                        estimatedDays: '',
                        zones: []
                      });
                      setShowShippingModal(true);
                    }}
                  >
                    + Aggiungi Tariffa
                  </Button>
                </div>

                {formData.shopSettings.shipping.shippingRates && formData.shopSettings.shipping.shippingRates.length > 0 ? (
                  <div className="mb-3">
                    {formData.shopSettings.shipping.shippingRates.map((rate, index) => (
                      <Card key={index} className="mb-2">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">{rate.name}</h6>
                              <p className="text-muted mb-1 small">{rate.description}</p>
                              <Badge bg="secondary" className="me-2">
                                {rate.calculationType === 'fixed' && 'Tariffa Fissa'}
                                {rate.calculationType === 'weight' && 'Basato su Peso'}
                                {rate.calculationType === 'zone' && 'Zone Geografiche'}
                              </Badge>
                              {rate.calculationType === 'fixed' && (
                                <span className="text-success fw-bold">€{rate.baseRate?.toFixed(2)}</span>
                              )}
                              {rate.calculationType === 'weight' && (
                                <span className="text-success fw-bold">€{rate.baseRate?.toFixed(2)} + €{rate.ratePerUnit?.toFixed(2)}/kg</span>
                              )}
                              {rate.calculationType === 'zone' && rate.zones && (
                                <span className="text-muted small"> ({rate.zones.length} zone)</span>
                              )}
                              {rate.estimatedDays && (
                                <span className="text-muted ms-2 small">⏱ {rate.estimatedDays}</span>
                              )}
                            </div>
                            <div>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={() => {
                                  setEditingShippingRate(index);
                                  setShippingRateForm(rate);
                                  setShowShippingModal(true);
                                }}
                              >
                                Modifica
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={async () => {
                                  const newRates = formData.shopSettings.shipping.shippingRates.filter((_, i) => i !== index);
                                  const updatedFormData = {
                                    ...formData,
                                    shopSettings: {
                                      ...formData.shopSettings,
                                      shipping: {
                                        ...formData.shopSettings.shipping,
                                        shippingRates: newRates
                                      }
                                    }
                                  };
                                  setFormData(updatedFormData);
                                  // Salva automaticamente
                                  await saveProfile(updatedFormData, 'Tariffa eliminata con successo!');
                                }}
                              >
                                Elimina
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert variant="secondary">Nessuna tariffa avanzata configurata</Alert>
                )}

                <div className="d-flex justify-content-end mt-4">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={saving}
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Salvataggio...
                      </>
                    ) : (
                      '💾 Salva Modifiche'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB TERMINI E CONDIZIONI */}
        <Tab eventKey="terms" title="📄 Termini e Condizioni">
          <Card>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Alert variant="warning">
                  <strong>Importante:</strong> I clienti dovranno accettare questi termini prima di completare l'acquisto
                </Alert>

                <Form.Group className="mb-3">
                  <Form.Label>Termini e Condizioni del tuo Negozio</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={15}
                    value={formData.shopSettings.termsAndConditions.content}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shopSettings: {
                        ...prev.shopSettings,
                        termsAndConditions: {
                          ...prev.shopSettings.termsAndConditions,
                          content: e.target.value,
                          lastUpdated: new Date()
                        }
                      }
                    }))}
                    placeholder="Inserisci qui i tuoi termini e condizioni di vendita..."
                  />
                  <Form.Text className="text-muted">
                    Include informazioni su: diritto di recesso, garanzie, modalità di reso, privacy, ecc.
                  </Form.Text>
                </Form.Group>

                {formData.shopSettings.termsAndConditions.lastUpdated && (
                  <Alert variant="info">
                    Ultima modifica: {new Date(formData.shopSettings.termsAndConditions.lastUpdated).toLocaleDateString('it-IT')}
                  </Alert>
                )}

                <div className="d-flex justify-content-end mt-4">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={saving}
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Salvataggio...
                      </>
                    ) : (
                      '💾 Salva Modifiche'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB ABBONAMENTO */}
        <Tab eventKey="subscription" title="💳 Abbonamento">
          <Card>
            <Card.Body>
              <h5 className="mb-4">Gestione Abbonamento</h5>

              {/* Stato Abbonamento */}
              <Card className="mb-3">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">Stato Abbonamento</h6>
                      <p className="text-muted mb-0 small">Il tuo abbonamento è attualmente:</p>
                    </div>
                    <div className="text-center">
                      {profileData?.subscriptionPaid ? (
                        <>
                          <span title="Abbonamento attivo" style={{ color: 'green', fontSize: '2.5em' }}>●</span>
                          <div className="small text-success fw-bold">Attivo</div>
                        </>
                      ) : (
                        <>
                          <span title="Abbonamento non attivo" style={{ color: 'red', fontSize: '2.5em' }}>●</span>
                          <div className="small text-danger fw-bold">Non Attivo</div>
                        </>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Data Pagamento */}
              <Card className="mb-3">
                <Card.Body>
                  <h6 className="mb-3">Pagamento Effettuato</h6>
                  {profileData?.subscriptionPaidAt ? (
                    <Alert variant="success">
                      <strong>Data ultimo pagamento:</strong> {new Date(profileData.subscriptionPaidAt).toLocaleDateString('it-IT', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Alert>
                  ) : (
                    <Alert variant="warning">
                      Nessun pagamento registrato
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              {/* Documenti Allegati */}
              <Card className="mb-3">
                <Card.Body>
                  <h6 className="mb-3">Documenti Allegati</h6>
                  {vendorDocs && vendorDocs.length > 0 ? (
                    <ul className="list-group">
                      {vendorDocs.map((doc, idx) => (
                        <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                          <span>
                            <i className="bi bi-file-pdf-fill text-danger me-2"></i>
                            {doc.name || doc.url.split('/').pop()}
                          </span>
                          <div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => window.open(doc.url, '_blank')}
                            >
                              <i className="bi bi-eye"></i> Visualizza
                            </Button>
                            <Button
                              variant="outline-success"
                              size="sm"
                              as="a"
                              href={doc.url}
                              download
                            >
                              <i className="bi bi-download"></i> Scarica
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Alert variant="info">
                      Nessun documento disponibile
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              {/* Metodo di Pagamento */}
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Metodo di Pagamento</h6>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      <i className="bi bi-pencil"></i> Modifica
                    </Button>
                  </div>
                  
                  {profileData?.paymentMethod ? (
                    <div className="border rounded p-3 bg-light">
                      <div className="mb-2">
                        <strong>Intestatario:</strong> {profileData.paymentMethod.cardHolder || 'Non disponibile'}
                      </div>
                      <div className="mb-2">
                        <strong>Numero Carta:</strong> •••• •••• •••• {profileData.paymentMethod.last4 || '****'}
                      </div>
                      <div className="mb-2">
                        <strong>Scadenza:</strong> {profileData.paymentMethod.expiryDate || 'Non disponibile'}
                      </div>
                      <div>
                        <Badge bg="success">Metodo salvato</Badge>
                      </div>
                    </div>
                  ) : (
                    <Alert variant="warning">
                      Nessun metodo di pagamento salvato
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB STATISTICHE */}
        <Tab eventKey="stats" title="📊 Statistiche">
          <Row>
            <Col md={3} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-success">€{stats?.totalRevenue?.toFixed(2) || '0.00'}</h3>
                  <p className="text-muted mb-0">Fatturato Totale</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-primary">{stats?.totalOrders || 0}</h3>
                  <p className="text-muted mb-0">Ordini Totali</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-info">{products.length}</h3>
                  <p className="text-muted mb-0">Prodotti Attivi</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <h3 className="text-warning">{stats?.pendingOrders || 0}</h3>
                  <p className="text-muted mb-0">Ordini in Attesa</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="mt-3">
            <Card.Header>
              <h5 className="mb-0">Ultimi Ordini</h5>
            </Card.Header>
            <Card.Body>
              {orders.length === 0 ? (
                <Alert variant="info">Nessun ordine ancora ricevuto</Alert>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>ID Ordine</th>
                      <th>Data</th>
                      <th>Cliente</th>
                      <th>Totale</th>
                      <th>Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${order._id}`)}>
                        <td>#{order._id.slice(-8)}</td>
                        <td>{new Date(order.createdAt).toLocaleDateString('it-IT')}</td>
                        <td>{order.buyer?.name || 'N/A'}</td>
                        <td>€{order.totalPrice?.toFixed(2)}</td>
                        <td>
                          <Badge bg={
                            order.status === 'delivered' ? 'success' :
                            order.status === 'shipped' ? 'primary' :
                            order.status === 'processing' ? 'info' :
                            order.status === 'cancelled' ? 'danger' :
                            'warning'
                          }>
                            {order.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              <div className="text-center mt-3">
                <Button variant="outline-primary" onClick={() => navigate('/vendor/dashboard')}>
                  Vedi Tutti gli Ordini
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB AZIONI RAPIDE */}
        <Tab eventKey="actions" title="⚡ Azioni Rapide">
          <Card>
            <Card.Body>
              <Row>
                <Col md={6} className="mb-3">
                  <Card className="h-100">
                    <Card.Body>
                      <h5>📦 Gestione Prodotti</h5>
                      <p className="text-muted">Aggiungi o modifica i tuoi prodotti</p>
                      <Button variant="primary" onClick={() => navigate('/products/new')}>
                        + Nuovo Prodotto
                      </Button>
                      <Button variant="outline-primary" className="ms-2" onClick={() => navigate('/vendor/dashboard')}>
                        Visualizza Tutti
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-3">
                  <Card className="h-100">
                    <Card.Body>
                      <h5>🎉 Gestione Sconti</h5>
                      <p className="text-muted">Crea offerte speciali per i tuoi clienti</p>
                      <Button variant="success" onClick={() => setActiveTab('discounts')}>
                        Gestisci Sconti
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-3">
                  <Card className="h-100">
                    <Card.Body>
                      <h5>📋 Ordini Ricevuti</h5>
                      <p className="text-muted">Visualizza e gestisci gli ordini</p>
                      <Button variant="info" onClick={() => navigate('/vendor/dashboard')}>
                        Vedi Ordini
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-3">
                  <Card className="h-100">
                    <Card.Body>
                      <h5>📊 Statistiche Dettagliate</h5>
                      <p className="text-muted">Analizza le performance del tuo negozio</p>
                      <Button variant="warning" onClick={() => navigate('/vendor/dashboard')}>
                        Dashboard Completa
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* MODAL GESTIONE TARIFFE SPEDIZIONE */}
      <Modal show={showShippingModal} onHide={() => setShowShippingModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingShippingRate !== null ? 'Modifica Tariffa' : 'Nuova Tariffa di Spedizione'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome Tariffa *</Form.Label>
                  <Form.Control
                    type="text"
                    value={shippingRateForm.name}
                    onChange={(e) => setShippingRateForm({ ...shippingRateForm, name: e.target.value })}
                    placeholder="Es: Standard, Express, Economica"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tempo Stimato</Form.Label>
                  <Form.Control
                    type="text"
                    value={shippingRateForm.estimatedDays}
                    onChange={(e) => setShippingRateForm({ ...shippingRateForm, estimatedDays: e.target.value })}
                    placeholder="Es: 3-5 giorni"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Descrizione</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={shippingRateForm.description}
                onChange={(e) => setShippingRateForm({ ...shippingRateForm, description: e.target.value })}
                placeholder="Breve descrizione del servizio di spedizione"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tipo di Calcolo *</Form.Label>
              <Form.Select
                value={shippingRateForm.calculationType}
                onChange={(e) => setShippingRateForm({ 
                  ...shippingRateForm, 
                  calculationType: e.target.value,
                  zones: e.target.value === 'zone' ? shippingRateForm.zones : []
                })}
              >
                <option value="fixed">Tariffa Fissa</option>
                <option value="weight">Basato su Peso (€/kg)</option>
                <option value="zone">Zone Geografiche</option>
              </Form.Select>
            </Form.Group>

            {shippingRateForm.calculationType === 'fixed' && (
              <Form.Group className="mb-3">
                <Form.Label>Costo Spedizione (€) *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  value={typeof shippingRateForm.baseRate === 'string' ? shippingRateForm.baseRate : shippingRateForm.baseRate === 0 ? '' : shippingRateForm.baseRate}
                  onChange={(e) => setShippingRateForm({ ...shippingRateForm, baseRate: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </Form.Group>
            )}

            {shippingRateForm.calculationType === 'weight' && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tariffa Base (€) *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={shippingRateForm.baseRate}
                      onChange={(e) => setShippingRateForm({ ...shippingRateForm, baseRate: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      required
                    />
                    <Form.Text className="text-muted">
                      Costo fisso iniziale
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Costo per kg (€) *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={typeof shippingRateForm.ratePerUnit === 'string' ? shippingRateForm.ratePerUnit : shippingRateForm.ratePerUnit === 0 ? '' : shippingRateForm.ratePerUnit}
                      onChange={(e) => setShippingRateForm({ ...shippingRateForm, ratePerUnit: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                    <Form.Text className="text-muted">
                      Costo aggiuntivo per kg
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            )}

            {shippingRateForm.calculationType === 'zone' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Form.Label className="mb-0">Zone Geografiche *</Form.Label>
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => {
                      setShippingRateForm({
                        ...shippingRateForm,
                        zones: [
                          ...shippingRateForm.zones,
                          { name: '', regions: [], rate: 0, estimatedDays: '' }
                        ]
                      });
                    }}
                  >
                    + Aggiungi Zona
                  </Button>
                </div>

                {shippingRateForm.zones && shippingRateForm.zones.length > 0 ? (
                  shippingRateForm.zones.map((zone, index) => (
                    <Card key={index} className="mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6>Zona {index + 1}</h6>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              const newZones = shippingRateForm.zones.filter((_, i) => i !== index);
                              setShippingRateForm({ ...shippingRateForm, zones: newZones });
                            }}
                          >
                            Elimina
                          </Button>
                        </div>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-2">
                              <Form.Label>Nome Zona *</Form.Label>
                              <Form.Control
                                type="text"
                                value={zone.name}
                                onChange={(e) => {
                                  const newZones = [...shippingRateForm.zones];
                                  newZones[index].name = e.target.value;
                                  setShippingRateForm({ ...shippingRateForm, zones: newZones });
                                }}
                                placeholder="Es: Nord Italia, UE, Isole"
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group className="mb-2">
                              <Form.Label>Tariffa (€) *</Form.Label>
                              <Form.Control
                                type="number"
                                step="0.01"
                                min="0"
                                value={typeof zone.rate === 'string' ? zone.rate : zone.rate === 0 ? '' : zone.rate}
                                onChange={(e) => {
                                  const newZones = [...shippingRateForm.zones];
                                  newZones[index].rate = e.target.value;
                                  setShippingRateForm({ ...shippingRateForm, zones: newZones });
                                }}
                                placeholder="0.00"
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group className="mb-2">
                              <Form.Label>Giorni</Form.Label>
                              <Form.Control
                                type="text"
                                value={zone.estimatedDays}
                                onChange={(e) => {
                                  const newZones = [...shippingRateForm.zones];
                                  newZones[index].estimatedDays = e.target.value;
                                  setShippingRateForm({ ...shippingRateForm, zones: newZones });
                                }}
                                placeholder="3-5"
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Form.Group>
                          <Form.Label>Regioni/Paesi (separati da virgola)</Form.Label>
                          <Form.Control
                            type="text"
                            value={Array.isArray(zone.regions) ? zone.regions.join(', ') : (zone.regions || '')}
                            onChange={(e) => {
                              const newZones = [...shippingRateForm.zones];
                              // Mantieni come stringa durante la digitazione
                              newZones[index].regions = e.target.value;
                              setShippingRateForm({ ...shippingRateForm, zones: newZones });
                            }}
                            placeholder="Es: Lombardia, Piemonte, Veneto o IT, FR, DE"
                          />
                          <Form.Text className="text-muted">
                            Per Italia: nomi regioni. Per estero: codici ISO (IT, FR, DE, ES)
                          </Form.Text>
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  ))
                ) : (
                  <Alert variant="info">Aggiungi almeno una zona geografica</Alert>
                )}
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowShippingModal(false)}>
            Annulla
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              // Validazione
              if (!shippingRateForm.name) {
                alert('Inserisci un nome per la tariffa');
                return;
              }
              if (shippingRateForm.calculationType === 'zone' && (!shippingRateForm.zones || shippingRateForm.zones.length === 0)) {
                alert('Aggiungi almeno una zona geografica');
                return;
              }

              // Conversione numeri
              const convertRate = (val) => {
                if (typeof val === 'string') {
                  const parsed = parseFloat(val.replace(',', '.'));
                  return isNaN(parsed) ? 0 : parsed;
                }
                return val;
              };
              let rateToSave = { ...shippingRateForm };
              rateToSave.baseRate = convertRate(rateToSave.baseRate);
              rateToSave.ratePerUnit = convertRate(rateToSave.ratePerUnit);
              if (rateToSave.zones && Array.isArray(rateToSave.zones)) {
                rateToSave.zones = rateToSave.zones.map(z => ({
                  ...z,
                  rate: convertRate(z.rate),
                  // Converti regions da stringa ad array
                  regions: typeof z.regions === 'string' 
                    ? z.regions.split(',').map(r => r.trim()).filter(r => r.length > 0)
                    : (z.regions || [])
                }));
              }
              // Salva o aggiorna
              let newRates;
              const isEdit = editingShippingRate !== null;
              if (isEdit) {
                // Modifica esistente
                newRates = [...formData.shopSettings.shipping.shippingRates];
                newRates[editingShippingRate] = rateToSave;
              } else {
                // Nuova tariffa
                newRates = [...(formData.shopSettings.shipping.shippingRates || []), rateToSave];
              }
              const updatedFormData = {
                ...formData,
                shopSettings: {
                  ...formData.shopSettings,
                  shipping: {
                    ...formData.shopSettings.shipping,
                    shippingRates: newRates
                  }
                }
              };
              setFormData(updatedFormData);
              setShowShippingModal(false);
              
              // Salva automaticamente sul server
              const successMessage = isEdit ? 'Tariffa aggiornata con successo!' : 'Tariffa aggiunta con successo!';
              await saveProfile(updatedFormData, successMessage);
            }}
            disabled={
              !shippingRateForm.name ||
              (shippingRateForm.calculationType === 'zone' && (!shippingRateForm.zones || shippingRateForm.zones.length === 0))
            }
          >
            {editingShippingRate !== null ? 'Aggiorna Tariffa' : 'Aggiungi Tariffa'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL MODIFICA METODO DI PAGAMENTO */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Modifica Metodo di Pagamento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={async (e) => {
            e.preventDefault();
            try {
              setSaving(true);
              const res = await fetch('http://localhost:5000/api/auth/vendor-profile', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({
                  paymentMethod: {
                    cardHolder: paymentForm.cardHolder,
                    last4: paymentForm.cardNumber.slice(-4),
                    expiryDate: paymentForm.expiryDate
                  }
                })
              });

              if (!res.ok) throw new Error('Errore aggiornamento metodo pagamento');

              await loadProfile();
              setShowPaymentModal(false);
              setSuccess('Metodo di pagamento aggiornato con successo!');
              setTimeout(() => setSuccess(''), 3000);
              
              // Reset form
              setPaymentForm({
                cardHolder: '',
                cardNumber: '',
                expiryDate: '',
                cvv: ''
              });
            } catch (err) {
              setError(err.message);
            } finally {
              setSaving(false);
            }
          }}>
            <Form.Group className="mb-3">
              <Form.Label>Intestatario Carta *</Form.Label>
              <Form.Control
                type="text"
                value={paymentForm.cardHolder}
                onChange={(e) => setPaymentForm({ ...paymentForm, cardHolder: e.target.value })}
                placeholder="Nome e Cognome"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Numero Carta *</Form.Label>
              <Form.Control
                type="text"
                value={paymentForm.cardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '');
                  if (/^\d{0,16}$/.test(value)) {
                    setPaymentForm({ ...paymentForm, cardNumber: value });
                  }
                }}
                placeholder="1234 5678 9012 3456"
                maxLength="16"
                required
              />
              <Form.Text className="text-muted">
                Inserisci 16 cifre senza spazi
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data Scadenza *</Form.Label>
                  <Form.Control
                    type="text"
                    value={paymentForm.expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      if (value.length <= 5) {
                        setPaymentForm({ ...paymentForm, expiryDate: value });
                      }
                    }}
                    placeholder="MM/AA"
                    maxLength="5"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CVV *</Form.Label>
                  <Form.Control
                    type="text"
                    value={paymentForm.cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 3) {
                        setPaymentForm({ ...paymentForm, cvv: value });
                      }
                    }}
                    placeholder="123"
                    maxLength="3"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Alert variant="info" className="small">
              <strong>Nota:</strong> I dati della carta vengono salvati in modo sicuro e criptato.
            </Alert>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                Annulla
              </Button>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Salvataggio...
                  </>
                ) : (
                  'Salva Metodo'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* MODALE CREA SCONTO */}
      <Modal show={showDiscountModal} onHide={() => setShowDiscountModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Crea Nuovo Sconto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateDiscount}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome Sconto *</Form.Label>
                  <Form.Control
                    type="text"
                    value={discountForm.name}
                    onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                    placeholder="Es: Saldi Estivi, Black Friday"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo Sconto *</Form.Label>
                  <Form.Select
                    value={discountForm.discountType}
                    onChange={(e) => setDiscountForm({ ...discountForm, discountType: e.target.value })}
                  >
                    <option value="percentage">Percentuale (%)</option>
                    <option value="fixed">Fisso (€)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Descrizione</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={discountForm.description}
                onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
                placeholder="Descrizione dello sconto..."
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Valore Sconto *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    max={discountForm.discountType === 'percentage' ? 100 : undefined}
                    value={discountForm.discountValue}
                    onChange={(e) => setDiscountForm({ ...discountForm, discountValue: parseFloat(e.target.value) || 0 })}
                    placeholder={discountForm.discountType === 'percentage' ? '0-100' : '0.00'}
                    required
                  />
                  <Form.Text className="text-muted">
                    {discountForm.discountType === 'percentage' ? 'Percentuale (0-100%)' : 'Importo in euro'}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Applicazione *</Form.Label>
                  <Form.Select
                    value={discountForm.applicationType}
                    onChange={(e) => setDiscountForm({ ...discountForm, applicationType: e.target.value })}
                  >
                    <option value="all">Tutti i prodotti</option>
                    <option value="product">Prodotti specifici</option>
                    <option value="category">Per categoria</option>
                    <option value="coupon">Codice coupon</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Codice Coupon</Form.Label>
                  <Form.Control
                    type="text"
                    value={discountForm.couponCode}
                    onChange={(e) => setDiscountForm({ ...discountForm, couponCode: e.target.value.toUpperCase() })}
                    placeholder="ESTATE2026"
                    disabled={discountForm.applicationType !== 'coupon'}
                  />
                  <Form.Text className="text-muted">
                    {discountForm.applicationType === 'coupon' ? 'Richiesto per coupon' : 'Opzionale'}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data Inizio *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={discountForm.startDate}
                    onChange={(e) => setDiscountForm({ ...discountForm, startDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data Fine *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={discountForm.endDate}
                    onChange={(e) => setDiscountForm({ ...discountForm, endDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Limite Utilizzi</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={discountForm.usageLimit || ''}
                    onChange={(e) => setDiscountForm({ ...discountForm, usageLimit: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Illimitato"
                  />
                  <Form.Text className="text-muted">
                    Lascia vuoto per illimitato
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Acquisto Minimo (€)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountForm.minPurchaseAmount}
                    onChange={(e) => setDiscountForm({ ...discountForm, minPurchaseAmount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Sconto Massimo (€)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountForm.maxDiscountAmount || ''}
                    onChange={(e) => setDiscountForm({ ...discountForm, maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="Illimitato"
                  />
                  <Form.Text className="text-muted">
                    Solo per % - lascia vuoto per illimitato
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {discountForm.applicationType === 'product' && (
              <Alert variant="info">
                <strong>Nota:</strong> Dopo aver creato lo sconto, potrai selezionare i prodotti specifici dalla dashboard venditori.
              </Alert>
            )}

            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="secondary" onClick={() => setShowDiscountModal(false)}>
                Annulla
              </Button>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creazione...
                  </>
                ) : (
                  'Crea Sconto'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default VendorProfile;
