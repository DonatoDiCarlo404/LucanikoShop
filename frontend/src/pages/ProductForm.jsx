import { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { productsAPI, uploadAPI } from '../services/api';

const ProductForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Frutta e Verdura',
    stock: '',
    unit: 'pz',
    expiryDate: '',
    tags: '',
  });

  const [images, setImages] = useState([]); // array di File
  const [imagePreviews, setImagePreviews] = useState([]); // array di url
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Carica prodotto se in modalità edit
  useEffect(() => {
    if (isEditMode) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const product = await productsAPI.getById(id);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
        unit: product.unit,
        expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
        tags: product.tags.join(', '),
      });
      // Mostra l'ultima immagine caricata (non la prima)
      if (product.images.length > 0) {
        setImagePreviews(product.images.map(img => img.url));
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let productId = id;
      let currentProduct = null;

      // 1. Crea o aggiorna il prodotto
      if (isEditMode) {
        // Se in edit mode, carica prima i dati del prodotto per avere le vecchie immagini
        currentProduct = await productsAPI.getById(id);
        await productsAPI.update(id, formData, user.token);
      } else {
        const newProduct = await productsAPI.create(formData, user.token);
        productId = newProduct._id;
      }

      // 2. Se ci sono nuove immagini
      if (images.length > 0) {
        setUploading(true);

        // 2a. Se in edit mode, elimina le vecchie immagini da Cloudinary
        if (isEditMode && currentProduct && currentProduct.images.length > 0) {
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

        // 2b. Upload tutte le nuove immagini
        for (const imgFile of images) {
          const uploadResponse = await uploadAPI.uploadProductImage(imgFile, user.token);
          await productsAPI.addImage(
            productId,
            {
              url: uploadResponse.url,
              public_id: uploadResponse.public_id,
            },
            user.token
          );
        }
      }

      navigate('/my-products');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleRemoveImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const categories = [
    'Frutta e Verdura',
    'Carne e Pesce',
    'Latticini',
    'Pane e Dolci',
    'Pasta e Cereali',
    'Bevande',
    'Condimenti',
    'Snack',
    'Surgelati',
    'Altro',
  ];

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
                      <Form.Label>Prezzo (€) *</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        placeholder="0.00"
                      />
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
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Quantità disponibile *</Form.Label>
                      <Form.Control
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        required
                        placeholder="0"
                      />
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
                        <option value="pz">Pezzo</option>
                        <option value="kg">Kg</option>
                        <option value="g">Grammi</option>
                        <option value="l">Litri</option>
                        <option value="ml">Millilitri</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Data di scadenza (opzionale)</Form.Label>
                  <Form.Control
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tag (separati da virgola)</Form.Label>
                  <Form.Control
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="Es. bio, locale, stagionale"
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
                  {imagePreviews.length > 0 && (
                    <div className="mt-3 d-flex flex-wrap gap-2">
                      {imagePreviews.map((src, idx) => (
                        <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={src}
                            alt={`Preview ${idx + 1}`}
                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            style={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              background: 'rgba(255,255,255,0.8)',
                              border: 'none',
                              borderRadius: '50%',
                              width: 22,
                              height: 22,
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              color: '#d00',
                              lineHeight: '18px',
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