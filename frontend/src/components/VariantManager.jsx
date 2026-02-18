import { useState } from 'react';
import { Card, Button, Table, Form, Badge } from 'react-bootstrap';

const VariantManager = ({ attributes, variants, onChange }) => {
  const [generatorMode, setGeneratorMode] = useState(variants.length === 0);
  
  // Prodotto cartesiano per generare tutte le combinazioni possibili
  const cartesianProduct = (arrays) => {
    return arrays.reduce((acc, curr) => 
      acc.flatMap(a => curr.map(c => [...a, c])), [[]]
    );
  };
  
  // Auto-genera tutte le combinazioni possibili
  const generateAllVariants = () => {
    const combinations = cartesianProduct(
      attributes.map(attr => 
        attr.options.map(opt => ({ 
          key: attr.key, 
          value: opt.value, 
          label: opt.label 
        }))
      )
    );
    
    const newVariants = combinations.map(combo => ({
      attributes: combo,
      sku: '',  // sarà generato dal backend
      stock: 0,
      price: null, // null = usa prezzo base
      image: null, // DEPRECATED - mantenuto per compatibilità
      images: [], // array di immagini (max 3)
      active: true
    }));
    
    onChange(newVariants);
    setGeneratorMode(false);
  };
  
  if (generatorMode) {
    return (
      <Card className="mb-4">
        <Card.Header>
          <h5>✨ Varianti Prodotto</h5>
        </Card.Header>
        <Card.Body>
          <p className="mb-3">
            Questo prodotto ha attributi che possono generare varianti automaticamente.
          </p>
          <div className="alert alert-info">
            <strong>Attributi con varianti:</strong> {attributes.map(a => a.name).join(', ')}
          </div>
          <p className="text-muted">
            Verranno generate automaticamente tutte le combinazioni possibili 
            ({attributes.reduce((acc, attr) => acc * attr.options.length, 1)} varianti totali).
          </p>
          <Button variant="primary" onClick={generateAllVariants}>
            🚀 Genera Tutte le Varianti Automaticamente
          </Button>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5>📦 Gestione Varianti ({variants.length})</h5>
        <div>
          <Badge bg="success" className="me-2">
            {variants.filter(v => v.active).length} Attive
          </Badge>
          <Button 
            size="sm" 
            variant="outline-secondary" 
            onClick={() => setGeneratorMode(true)}
          >
            🔄 Rigenera
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <Table striped bordered hover size="sm">
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
              <tr>
                <th style={{ minWidth: '200px' }}>Variante</th>
                <th style={{ width: '100px' }}>Stock</th>
                <th style={{ width: '120px' }}>Prezzo<div className="text-muted" style={{ fontSize: '10px', fontWeight: 'normal' }}>(vuoto = base)</div></th>
                <th style={{ width: '250px' }}>Immagini <span className="text-muted">(max 3)</span></th>
                <th style={{ width: '80px' }}>Stato</th>
                <th style={{ width: '80px' }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, idx) => (
                <tr key={idx} style={{ opacity: variant.active ? 1 : 0.5 }}>
                  <td>
                    <strong>{variant.attributes.map(a => a.label || a.value).join(' • ')}</strong>
                    {variant.sku && (
                      <div className="text-muted" style={{ fontSize: '11px' }}>SKU: {variant.sku}</div>
                    )}
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      size="sm"
                      min="0"
                      value={variant.stock}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[idx].stock = parseInt(e.target.value) || 0;
                        onChange(updated);
                      }}
                      disabled={!variant.active}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      size="sm"
                      step="0.01"
                      min="0"
                      placeholder="Auto"
                      value={variant.price ?? ''}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[idx].price = e.target.value ? parseFloat(e.target.value) : null;
                        onChange(updated);
                      }}
                      disabled={!variant.active}
                    />
                  </td>
                  <td>
                    <div className="d-flex flex-column gap-2">
                      {/* Preview immagini esistenti */}
                      {(() => {
                        // Migrazione automatica: se esiste image (singola), convertila in images[]
                        const variantImages = variant.images && variant.images.length > 0 
                          ? variant.images 
                          : (variant.image ? [variant.image] : []);
                        
                        return (
                          <div className="d-flex gap-1 flex-wrap">
                            {variantImages.map((img, imgIdx) => (
                              <div key={imgIdx} style={{ position: 'relative', display: 'inline-block' }}>
                                <img
                                  src={img}
                                  alt={`Variante ${imgIdx + 1}`}
                                  style={{ 
                                    width: '50px', 
                                    height: '50px', 
                                    objectFit: 'cover', 
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="danger"
                                  style={{
                                    position: 'absolute',
                                    top: '-5px',
                                    right: '-5px',
                                    padding: '0',
                                    width: '18px',
                                    height: '18px',
                                    fontSize: '10px',
                                    borderRadius: '50%'
                                  }}
                                  onClick={() => {
                                    const updated = [...variants];
                                    const currentImages = updated[idx].images || [];
                                    updated[idx].images = currentImages.filter((_, i) => i !== imgIdx);
                                    // Pulisci anche la vecchia proprietà image se esiste
                                    if (updated[idx].image) updated[idx].image = null;
                                    onChange(updated);
                                  }}
                                  disabled={!variant.active}
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      
                      {/* Input per caricare nuove immagini */}
                      {(() => {
                        const currentImages = variant.images || [];
                        const canAddMore = currentImages.length < 3;
                        
                        return canAddMore ? (
                          <Form.Control
                            type="file"
                            size="sm"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const updated = [...variants];
                                  const existingImages = updated[idx].images || [];
                                  
                                  if (existingImages.length < 3) {
                                    updated[idx].images = [...existingImages, reader.result];
                                    // Pulisci la vecchia proprietà image
                                    if (updated[idx].image) updated[idx].image = null;
                                    onChange(updated);
                                  }
                                  // Reset input
                                  e.target.value = '';
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            disabled={!variant.active}
                            style={{ fontSize: '11px' }}
                          />
                        ) : (
                          <small className="text-muted">Limite massimo raggiunto (3 immagini)</small>
                        );
                      })()}
                    </div>
                  </td>
                  <td>
                    <Form.Check
                      type="switch"
                      checked={variant.active}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[idx].active = e.target.checked;
                        onChange(updated);
                      }}
                    />
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        const updated = variants.filter((_, i) => i !== idx);
                        onChange(updated);
                      }}
                      title="Elimina variante"
                    >
                      🗑️
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <div className="mt-3 text-muted">
          <small>
            💡 <strong>Suggerimenti:</strong> Disattiva le varianti non disponibili invece di eliminarle. 
            Lascia il prezzo vuoto per usare il prezzo base del prodotto.
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default VariantManager;
