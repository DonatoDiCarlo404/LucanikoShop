import { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Row, Col, Modal } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { productsAPI, uploadAPI, categoriesAPI } from '../services/api';
import VariantManager from '../components/VariantManager';

const ProductForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    unit: 'pz',
    expiryDate: '',
    tags: '',
    attributes: [],      // NUOVO
    hasVariants: false,  // NUOVO
    variants: []         // NUOVO
  });

  // Array unificato: ogni elemento è { file: File|null, url: string, isMain: boolean }
  const [imageItems, setImageItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryAttributes, setCategoryAttributes] = useState([]); // NUOVO
  const [customAttributes, setCustomAttributes] = useState([]); // Attributi personalizzati
  const [selectedVariantAttributes, setSelectedVariantAttributes] = useState([]); // Chiavi attributi per varianti
  const [showSuccess, setShowSuccess] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Carica prodotto se in modalità edit
  useEffect(() => {
    if (isEditMode) {
      loadProduct();
    }
  }, [id]);

  // Carica categorie
  useEffect(() => {
    loadCategories();
  }, []);

  // NUOVO: Carica attributi quando cambia categoria
  useEffect(() => {
    if (formData.category) {
      loadCategoryAttributes(formData.category);
    } else {
      setCategoryAttributes([]);
      setFormData(prev => ({ ...prev, attributes: [], hasVariants: false, variants: [] }));
    }
  }, [formData.category]);

  const loadCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data); // Mantieni l'oggetto completo con _id e name
    } catch (err) {
      console.error('Errore caricamento categorie:', err);
      setCategories([]);
    }
  };

  // NUOVO: Carica attributi dinamici per categoria
  const loadCategoryAttributes = async (categoryId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${categoryId}/attributes`);
      const attrs = await response.json();
      setCategoryAttributes(attrs);
      
      // Inizializza attributi vuoti nel formData
      if (!isEditMode || formData.attributes.length === 0) {
        setFormData(prev => ({
          ...prev,
          attributes: attrs.map(attr => ({
            key: attr.key,
            value: ''
          }))
        }));
      }
    } catch (err) {
      console.error('❌ Errore caricamento attributi categoria:', err);
      setCategoryAttributes([]);
    }
  };

  const loadProduct = async () => {
    try {
      const product = await productsAPI.getById(id);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category._id || product.category,
        stock: product.stock,
        unit: product.unit,
        expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
        tags: product.tags.join(', '),
        attributes: product.attributes || [],         // NUOVO
        hasVariants: product.hasVariants || false,    // NUOVO
        variants: product.variants || []              // NUOVO
      });
      
      // Carica attributi personalizzati se presenti
      if (product.customAttributes) {
        setCustomAttributes(product.customAttributes);
      }
      
      // Carica selezione attributi per varianti
      if (product.selectedVariantAttributes) {
        setSelectedVariantAttributes(product.selectedVariantAttributes);
      }
      
      // Carica le immagini del prodotto esistente
      if (product.images.length > 0) {
        setImageItems(product.images.map((img, idx) => ({
          file: null,
          url: img.url,
          isMain: idx === 0
        })));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // NUOVO: Gestione attributi dinamici
  const handleAttributeChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map(attr =>
        attr.key === key ? { ...attr, value } : attr
      )
    }));
  };

  // Aggiungere attributo personalizzato
  const addCustomAttribute = () => {
    const newAttr = {
      name: `Nuova Opzione`,
      key: `custom_${Date.now()}`,
      type: 'select',
      required: false,
      allowVariants: true,
      order: customAttributes.length + 1,
      options: [],
      placeholder: ''
    };
    setCustomAttributes([...customAttributes, newAttr]);
    
    // Inizializza valore nel formData
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { key: newAttr.key, value: '' }]
    }));
  };

  // Rimuovere attributo personalizzato
  const removeCustomAttribute = (key) => {
    setCustomAttributes(customAttributes.filter(attr => attr.key !== key));
    setSelectedVariantAttributes(selectedVariantAttributes.filter(k => k !== key));
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter(attr => attr.key !== key)
    }));
  };

  // Aggiornare attributo personalizzato
  const updateCustomAttribute = (key, field, value) => {
    setCustomAttributes(customAttributes.map(attr => 
      attr.key === key ? { ...attr, [field]: value } : attr
    ));
  };

  // Aggiungere opzione a un attributo personalizzato
  const addOptionToCustomAttribute = (attrKey) => {
    setCustomAttributes(customAttributes.map(attr => {
      if (attr.key === attrKey) {
        const newOption = { label: 'Nuova Opzione', value: `opt_${Date.now()}` };
        return { ...attr, options: [...attr.options, newOption] };
      }
      return attr;
    }));
  };

  // Rimuovere opzione da attributo personalizzato
  const removeOptionFromCustomAttribute = (attrKey, optValue) => {
    setCustomAttributes(customAttributes.map(attr => {
      if (attr.key === attrKey) {
        return { ...attr, options: attr.options.filter(opt => opt.value !== optValue) };
      }
      return attr;
    }));
  };

  // Toggle selezione attributo per varianti
  const toggleVariantAttribute = (key) => {
    setSelectedVariantAttributes(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setImageItems(prev => {
      const newItems = files.map(file => ({
        file: file,
        url: URL.createObjectURL(file),
        isMain: false
      }));
      
      const combined = [...prev, ...newItems];
      // Se non c'è nessuna immagine principale, imposta la prima come principale
      if (!combined.some(item => item.isMain) && combined.length > 0) {
        combined[0].isMain = true;
      }
      return combined;
    });
    
    // Reset input per permettere di caricare lo stesso file
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let productId = id;
      let currentProduct = null;
      let updatedImages = [];

      if (isEditMode) {
        // Carica il prodotto per avere le immagini attuali
        currentProduct = await productsAPI.getById(id);

        // Se ci sono nuove immagini selezionate (file presente), gestisci upload
        const newImages = imageItems.filter(item => item.file !== null);
        if (newImages.length > 0) {
          setUploading(true);
          // Elimina tutte le vecchie immagini da Cloudinary
          if (currentProduct && currentProduct.images.length > 0) {
            for (const img of currentProduct.images) {
              if (img.public_id) {
                try {
                  const encodedPublicId = encodeURIComponent(img.public_id);
                  await fetch(`http://localhost:5000/api/upload/${encodedPublicId}`, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${user.token}`,
                    },
                  });
                } catch (err) {
                  console.error('Errore eliminazione immagine:', err);
                }
              }
            }
          }
          // Carica tutte le nuove immagini
          for (const item of newImages) {
            try {
              const uploadResponse = await uploadAPI.uploadProductImage(item.file, user.token);
              if (!uploadResponse || !uploadResponse.url) {
                setError('Errore upload immagine: risposta non valida dal server.');
                console.error('Risposta upload non valida:', uploadResponse);
                continue;
              }
              updatedImages.push({ url: uploadResponse.url, public_id: uploadResponse.public_id });
            } catch (uploadErr) {
              setError('Errore upload immagine: ' + (uploadErr.message || uploadErr));
              console.error('Errore upload immagine:', uploadErr);
            }
          }
        } else {
          // Nessuna nuova immagine: mantieni quelle esistenti
          updatedImages = imageItems
            .filter(item => item.file === null)
            .map(item => {
              const found = currentProduct.images.find(img => img.url === item.url);
              return found ? { url: found.url, public_id: found.public_id } : null;
            })
            .filter(Boolean);
        }
        
        // Ordina: la principale per prima
        const mainItem = imageItems.find(item => item.isMain);
        if (mainItem) {
          updatedImages = updatedImages.sort((a, b) => {
            if (a.url === mainItem.url) return -1;
            if (b.url === mainItem.url) return 1;
            return 0;
          });
        }
        // Aggiorna il prodotto con le immagini ordinate
        const updatePayload = { 
          ...formData,
          customAttributes,
          selectedVariantAttributes
        };
        if (imageItems.length > 0 || updatedImages.length > 0) {
          updatePayload.images = updatedImages;
        }
        await productsAPI.update(id, updatePayload, user.token);
      } else {
        // CREAZIONE NUOVO PRODOTTO
        const productPayload = {
          ...formData,
          customAttributes,
          selectedVariantAttributes
        };
        const newProduct = await productsAPI.create(productPayload, user.token);
        productId = newProduct._id;
        // Se ci sono immagini, caricale e aggiungile
        const newImagesToUpload = imageItems.filter(item => item.file !== null);
        if (newImagesToUpload.length > 0) {
          setUploading(true);
          for (const item of newImagesToUpload) {
            try {
              const uploadResponse = await uploadAPI.uploadProductImage(item.file, user.token);
              if (uploadResponse && uploadResponse.url) {
                await productsAPI.addImage(
                  productId,
                  {
                    url: uploadResponse.url,
                    public_id: uploadResponse.public_id,
                  },
                  user.token
                );
              }
            } catch (uploadErr) {
              setError('Errore upload immagine: ' + (uploadErr.message || uploadErr));
              console.error('Errore upload immagine:', uploadErr);
            }
          }
        }
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/my-products');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleRemoveImage = (idx) => {
    setImageItems(prev => {
      const newItems = prev.filter((_, i) => i !== idx);
      // Se rimuovi la principale e ci sono altre immagini, imposta la prima come principale
      if (newItems.length > 0 && !newItems.some(item => item.isMain)) {
        newItems[0].isMain = true;
      }
      return newItems;
    });
  };

  const handleSetAsMain = (idx) => {
    setImageItems(prev => prev.map((item, i) => ({
      ...item,
      isMain: i === idx
    })));
  };

  // NUOVO: Rendering dinamico attributi
  const renderAttributeField = (attribute) => {
    const currentValue = formData.attributes.find(a => a.key === attribute.key)?.value || '';
    switch (attribute.type) {
      case 'select':
        return (
          <Form.Group key={attribute.key} className="mb-3">
            <Form.Label>
              {attribute.name}
              {attribute.required && <span className="text-danger"> *</span>}
            </Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {attribute.options.map(opt => (
                <Form.Check
                  key={opt.value}
                  type="checkbox"
                  label={opt.label}
                  value={opt.value}
                  checked={(currentValue || '').split(',').includes(opt.value)}
                  onChange={(e) => {
                    const values = (currentValue || '').split(',').filter(Boolean);
                    if (e.target.checked) {
                      values.push(opt.value);
                    } else {
                      const idx = values.indexOf(opt.value);
                      if (idx > -1) values.splice(idx, 1);
                    }
                    handleAttributeChange(attribute.key, values.join(','));
                  }}
                />
              ))}
            </div>
          </Form.Group>
        );
      case 'color':
        return (
          <Form.Group key={attribute.key} className="mb-3">
            <Form.Label>
              {attribute.name}
              {attribute.required && <span className="text-danger"> *</span>}
            </Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {attribute.options.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => handleAttributeChange(attribute.key, opt.value)}
                  style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: opt.color || opt.value,
                    border: currentValue === opt.value ? '3px solid #000' : '1px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={opt.label}
                >
                  {currentValue === opt.value && (
                    <span style={{ fontSize: '24px', color: '#fff', textShadow: '0 0 3px #000' }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </Form.Group>
        );
      case 'number':
        return (
          <Form.Group key={attribute.key} className="mb-3">
            <Form.Label>
              {attribute.name}
              {attribute.required && <span className="text-danger"> *</span>}
            </Form.Label>
            <Form.Control
              type="number"
              value={currentValue}
              onChange={(e) => handleAttributeChange(attribute.key, e.target.value)}
              min={attribute.validation?.min}
              max={attribute.validation?.max}
              required={attribute.required}
              placeholder={attribute.placeholder}
            />
          </Form.Group>
        );
      default: // text
        return (
          <Form.Group key={attribute.key} className="mb-3">
            <Form.Label>
              {attribute.name}
              {attribute.required && <span className="text-danger"> *</span>}
            </Form.Label>
            <Form.Control
              type="text"
              value={currentValue}
              onChange={(e) => handleAttributeChange(attribute.key, e.target.value)}
              required={attribute.required}
              placeholder={attribute.placeholder}
            />
          </Form.Group>
        );
    }
  };


  return (
    <Container className="py-5">
      <Card>
        <Card.Body>
          <h2 className="mb-4">{isEditMode ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</h2>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome Prodotto *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Es. Pomodori freschi"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Descrizione *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="Descrivi il tuo prodotto..."
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Prezzo (€)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                      />
                      <Form.Text className="text-muted">
                        Se il prodotto ha opzioni, inserisci il prezzo per ogni variante nella sezione sotto.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Categoria *</Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleziona una categoria</option>
                        <option value="abbigliamento-accessori">Abbigliamento e Accessori</option>
                        <option value="benessere-salute">Benessere e Salute</option>
                        <option value="calzature">Calzature</option>
                        <option value="casa-arredi-ufficio">Casa, Arredi e Ufficio</option>
                        <option value="cibi-bevande">Cibi e Bevande</option>
                        <option value="elettronica-informatica">Elettronica e Informatica</option>
                        <option value="industria-ferramenta-artigianato">Industria, Ferramenta e Artigianato</option>
                        <option value="libri-media-giocattoli">Libri, Media e Giocattoli</option>
                        <option value="orologi-gioielli">Orologi e Gioielli</option>
                        <option value="ricambi-accessori-auto-moto">Ricambi e accessori per auto e moto</option>
                        <option value="sport-hobby-viaggi">Sport, Hobby e Viaggi</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Quantità disponibile</Form.Label>
                      <Form.Control
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="0"
                      />
                      <Form.Text className="text-muted">
                        Se il prodotto ha opzioni, inserisci la quantità per ogni variante nella sezione sotto.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Unità di misura</Form.Label>
                      <Form.Select
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                      >
                        <option value="pz">Pezzi</option>
                        <option value="kg">Kg</option>
                        <option value="g">Grammi</option>
                        <option value="l">Litri</option>
                        <option value="ml">Millilitri</option>
                        <option value="m">Metri</option>
                        <option value="cm">Centimetri</option>
                        <option value="confezione">Confezione</option>
                        <option value="set">Set</option>
                        <option value="scatola">Scatola</option>
                        <option value="altro">Altro</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Data di scadenza (opzionale - per prodotti alimentari/deperibili)</Form.Label>
                  <Form.Control
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">
                    Lascia vuoto se il prodotto non ha data di scadenza
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tag (separati da virgola)</Form.Label>
                  <Form.Control
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="Es. bio, artigianale, made in italy, eco-friendly"
                  />
                  <Form.Text className="text-muted">
                    Aiuta i clienti a trovare il tuo prodotto
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Immagini Prodotto</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                  <Form.Text className="text-muted">
                    Clicca sulla stella per impostare la foto principale.
                  </Form.Text>
                  {imageItems.length > 0 && (
                    <div className="mt-3 d-flex flex-wrap gap-2">
                      {imageItems.map((item, idx) => (
                        <div 
                          key={idx}
                          style={{ 
                            position: 'relative', 
                            display: 'inline-block'
                          }}
                        >
                          <img
                            src={item.url}
                            alt={`Preview ${idx + 1}`}
                            style={{ 
                              width: '100px', 
                              height: '100px', 
                              objectFit: 'cover', 
                              borderRadius: '8px', 
                              border: item.isMain ? '3px solid #ffc107' : '1px solid #ddd'
                            }}
                          />
                          {item.isMain && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: 2,
                                left: 2,
                                background: '#ffc107',
                                color: '#000',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 'bold'
                              }}
                            >
                              PRINCIPALE
                            </span>
                          )}
                          {/* Pulsante stella per impostare come principale */}
                          <button
                            type="button"
                            onClick={() => handleSetAsMain(idx)}
                            style={{
                              position: 'absolute',
                              top: 2,
                              left: 2,
                              background: item.isMain ? '#ffc107' : 'rgba(255,255,255,0.9)',
                              border: 'none',
                              borderRadius: '50%',
                              width: 24,
                              height: 24,
                              cursor: 'pointer',
                              fontSize: '14px',
                              lineHeight: '24px',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Imposta come principale"
                          >★</button>
                          {/* Pulsante elimina */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            style={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              background: 'rgba(255,255,255,0.9)',
                              border: 'none',
                              borderRadius: '50%',
                              width: 24,
                              height: 24,
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              color: '#d00',
                              lineHeight: '24px',
                              padding: 0
                            }}
                            title="Elimina immagine"
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            {/* SEZIONE ATTRIBUTI DINAMICI */}
            {categoryAttributes.filter(attr => !attr.allowVariants).length > 0 && (
              <Card className="mb-4 border-primary">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">📋 Attributi Specifici Categoria</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {categoryAttributes
                      .filter(attr => !attr.allowVariants)
                      .map(attr => (
                        <Col md={6} key={attr.key}>
                          {renderAttributeField(attr)}
                        </Col>
                      ))}
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* SEZIONE OPZIONI PRODOTTO */}
            <Card className="mb-4 border-info">
              <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">🎨 Opzioni Prodotto (Varianti)</h5>
                <Button size="sm" variant="light" onClick={addCustomAttribute}>
                  + Aggiungi Opzione
                </Button>
              </Card.Header>
              <Card.Body>
                <Alert variant="info" className="small mb-3">
                  <strong>💡 Come funziona:</strong> Crea le tue macrocategorie (es. Taglia, Colore, Capacità) e le relative opzioni (es. S, M, L). Le varianti saranno generate automaticamente.
                </Alert>
                {customAttributes.length === 0 ? (
                  <p className="text-muted mb-0">
                    Nessuna opzione creata. Clicca "+ Aggiungi Opzione" per iniziare.
                  </p>
                ) : (
                  <>
                    {customAttributes.map(attr => (
                      <Card key={attr.key} className="mb-3 border">
                        <Card.Body>
                          <Row className="align-items-center mb-2">
                            <Col md={5}>
                              <Form.Group>
                                <Form.Label className="small fw-bold">Nome Macrocategoria</Form.Label>
                                <Form.Control
                                  size="sm"
                                  type="text"
                                  value={attr.name}
                                  onChange={(e) => updateCustomAttribute(attr.key, 'name', e.target.value)}
                                  placeholder="Es. Taglia, Colore, Capacità, Gusto..."
                                />
                              </Form.Group>
                            </Col>
                            <Col md={3}>
                              <Form.Group>
                                <Form.Label className="small fw-bold">Tipo Visualizzazione</Form.Label>
                                <Form.Select
                                  size="sm"
                                  value={attr.type}
                                  onChange={(e) => updateCustomAttribute(attr.key, 'type', e.target.value)}
                                >
                                  <option value="select">Lista (Dropdown)</option>
                                  <option value="color">Colori</option>
                                  <option value="text">Testo Libero</option>
                                  <option value="number">Numero</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={1} className="text-end">
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => removeCustomAttribute(attr.key)}
                                title="Rimuovi attributo"
                              >
                                🗑️
                              </Button>
                            </Col>
                          </Row>

                          {/* Opzioni per select/color */}
                          {(attr.type === 'select' || attr.type === 'color') && (
                            <div className="mt-2 p-2 bg-light rounded">
                              <Form.Label className="small fw-bold">Valori per "{attr.name}":</Form.Label>
                              {attr.options.map(opt => (
                                <div key={opt.value} className="d-flex gap-2 mb-1 align-items-center">
                                  <Form.Control
                                    size="sm"
                                    type="text"
                                    placeholder="Label"
                                    value={opt.label}
                                    onChange={(e) => {
                                      const updated = customAttributes.map(a => {
                                        if (a.key === attr.key) {
                                          return {
                                            ...a,
                                            options: a.options.map(o =>
                                              o.value === opt.value ? { ...o, label: e.target.value } : o
                                            )
                                          };
                                        }
                                        return a;
                                      });
                                      setCustomAttributes(updated);
                                    }}
                                    style={{ maxWidth: '60px' }}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => removeOptionFromCustomAttribute(attr.key, opt.value)}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => addOptionToCustomAttribute(attr.key)}
                                className="mt-2"
                              >
                                + Aggiungi Valore
                              </Button>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </>
                )}
              </Card.Body>
            </Card>

            {/* SEZIONE VARIANTI */}
            {customAttributes.filter(a => a.allowVariants && a.options.length > 0).length > 0 && (
              <VariantManager
                attributes={customAttributes.filter(a => a.allowVariants && a.options.length > 0)}
                variants={formData.variants}
                onChange={(variants) => setFormData(prev => ({ 
                  ...prev, 
                  variants, 
                  hasVariants: variants.length > 0 
                }))}
              />
            )}

            <div className="d-flex gap-2">
              <Button
                variant="primary"
                type="submit"
                disabled={loading || uploading}
              >
                {loading || uploading
                  ? uploading
                    ? 'Caricamento immagine...'
                    : 'Salvataggio...'
                  : isEditMode
                    ? <><i className="bi bi-pencil-square"> Aggiorna Prodotto</i></>
                    : <><i className="bi bi-node-plus"> Crea Prodotto</i></>}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/my-products')}
              >
                <span><i className="bi bi-slash-square"> Annulla</i></span>
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProductForm;