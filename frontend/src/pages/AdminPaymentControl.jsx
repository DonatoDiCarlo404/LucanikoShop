import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';

const AdminPaymentControl = () => {
  const [statistics, setStatistics] = useState(null);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [error, setError] = useState(null);

  // Transfer Log
  const [transfers, setTransfers] = useState([]);
  const [transferSummary, setTransferSummary] = useState(null);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [transferPagination, setTransferPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTransfers: 0
  });
  const [transferFilters, setTransferFilters] = useState({
    vendorId: '',
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedError, setSelectedError] = useState(null);

  // Modal gestione manuale
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'pay-now', 'retry', 'mark-paid'
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [manualNote, setManualNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Filtri
  const [filters, setFilters] = useState({
    vendorId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalPayouts: 0
  });

  // Fetch statistiche
  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/payments/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle statistiche');
      }
      
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      console.error('Errore fetch statistiche:', err);
      setError(err.message || 'Errore nel caricamento delle statistiche');
    }
  };

  // Fetch lista venditori
  const fetchVendorsList = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/payments/vendors-list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento venditori');
      }
      
      const data = await response.json();
      setVendorsList(data.vendors);
    } catch (err) {
      console.error('Errore fetch venditori:', err);
    }
  };

  // Fetch pending payouts
  const fetchPendingPayouts = async () => {
    setLoadingPayouts(true);
    try {
      const token = localStorage.getItem('token');
      
      // Costruisci query params
      const params = new URLSearchParams();
      params.append('page', filters.page);
      params.append('limit', filters.limit);
      if (filters.vendorId) params.append('vendorId', filters.vendorId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/payments/pending-payouts?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento dei payouts');
      }
      
      const data = await response.json();
      setPendingPayouts(data.payouts);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Errore fetch pending payouts:', err);
      setError(err.message || 'Errore nel caricamento dei payouts');
    } finally {
      setLoadingPayouts(false);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStatistics(), 
        fetchVendorsList(), 
        fetchPendingPayouts(),
        fetchAnalytics()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Ricarica payouts quando cambiano i filtri
  useEffect(() => {
    if (!loading) {
      fetchPendingPayouts();
    }
  }, [filters.page, filters.vendorId, filters.startDate, filters.endDate]);

  // Ricarica transfer log quando cambiano i filtri
  useEffect(() => {
    if (!loading) {
      fetchTransferLog();
    }
  }, [transferFilters]);

  // Fetch Analytics
  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/payments/analytics?months=6`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Errore nel caricamento analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Errore fetch analytics:', err);
      toast.error(err.message || 'Errore nel caricamento analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch Transfer Log
  const fetchTransferLog = async () => {
    try {
      setLoadingTransfers(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (transferFilters.vendorId) params.append('vendorId', transferFilters.vendorId);
      if (transferFilters.status) params.append('status', transferFilters.status);
      if (transferFilters.startDate) params.append('startDate', transferFilters.startDate);
      if (transferFilters.endDate) params.append('endDate', transferFilters.endDate);
      params.append('page', transferFilters.page);
      params.append('limit', transferFilters.limit);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/payments/transfer-log?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Errore nel caricamento del log transfer');
      }

      const data = await response.json();
      setTransfers(data.transfers);
      setTransferPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalTransfers: data.totalTransfers
      });
      setTransferSummary(data.summary);
    } catch (err) {
      console.error('Errore fetch transfer log:', err);
      toast.error(err.message || 'Errore nel caricamento del log transfer');
    } finally {
      setLoadingTransfers(false);
    }
  };

  // Download CSV Transfer Log
  const handleDownloadCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (transferFilters.vendorId) params.append('vendorId', transferFilters.vendorId);
      if (transferFilters.status) params.append('status', transferFilters.status);
      if (transferFilters.startDate) params.append('startDate', transferFilters.startDate);
      if (transferFilters.endDate) params.append('endDate', transferFilters.endDate);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/payments/transfer-log/export?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Errore nel download del CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transfer-log-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Report CSV scaricato con successo');
    } catch (err) {
      console.error('Errore download CSV:', err);
      toast.error(err.message || 'Errore nel download del CSV');
    }
  };

  const handleTransferFilterChange = (field, value) => {
    setTransferFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1
    }));
  };

  const handleTransferPageChange = (newPage) => {
    setTransferFilters(prev => ({ ...prev, page: newPage }));
  };

  const resetTransferFilters = () => {
    setTransferFilters({
      vendorId: '',
      status: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10
    });
  };

  const showErrorDetails = (failureReason) => {
    setSelectedError(failureReason);
    setShowErrorModal(true);
  };

  // Funzioni gestione manuale
  const openConfirmModal = (action, payout) => {
    setConfirmAction(action);
    setSelectedPayout(payout);
    setManualNote('');
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setSelectedPayout(null);
    setManualNote('');
  };

  const executeManualAction = async () => {
    if (!selectedPayout || !confirmAction) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let body = {};

      switch (confirmAction) {
        case 'pay-now':
          endpoint = `${import.meta.env.VITE_API_URL}/admin/payments/pay-now/${selectedPayout._id}`;
          break;
        case 'retry':
          endpoint = `${import.meta.env.VITE_API_URL}/admin/payments/retry/${selectedPayout._id}`;
          break;
        case 'mark-paid':
          endpoint = `${import.meta.env.VITE_API_URL}/admin/payments/mark-paid/${selectedPayout._id}`;
          body = { note: manualNote };
          break;
        default:
          throw new Error('Azione non valida');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Errore nell\'esecuzione dell\'azione');
      }

      toast.success(data.message || 'Azione completata con successo');
      
      // Ricarica dati
      await Promise.all([
        fetchStatistics(),
        fetchPendingPayouts(),
        fetchTransferLog()
      ]);

      closeConfirmModal();

    } catch (error) {
      console.error('Errore azione manuale:', error);
      toast.error(error.message || 'Errore nell\'esecuzione dell\'azione');
    } finally {
      setActionLoading(false);
    }
  };

  const getConfirmModalContent = () => {
    if (!confirmAction || !selectedPayout) return {};

    switch (confirmAction) {
      case 'pay-now':
        return {
          title: 'Conferma Pagamento Immediato',
          message: `Sei sicuro di voler pagare immediatamente €${selectedPayout.amount?.toFixed(2)} a ${selectedPayout.vendorName}?`,
          warning: 'Il pagamento verrà eseguito tramite Stripe Connect.',
          confirmText: 'Paga Ora',
          confirmVariant: 'success'
        };
      case 'retry':
        return {
          title: 'Riprova Transfer Fallito',
          message: `Vuoi riprovare il transfer di €${selectedPayout.amount?.toFixed(2)} a ${selectedPayout.vendorName}?`,
          warning: 'Il transfer verrà eseguito nuovamente tramite Stripe.',
          confirmText: 'Riprova',
          confirmVariant: 'warning'
        };
      case 'mark-paid':
        return {
          title: 'Segna Come Pagato',
          message: `Confermi di aver pagato manualmente €${selectedPayout.amount?.toFixed(2)} a ${selectedPayout.vendorName}?`,
          warning: 'Questa azione non esegue alcun pagamento via Stripe. Usala solo se hai già pagato il venditore con altri mezzi.',
          confirmText: 'Segna Come Pagato',
          confirmVariant: 'primary',
          showNoteInput: true
        };
      default:
        return {};
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset a pagina 1 quando cambiano i filtri
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Caricamento pannello pagamenti...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="my-4">
      <h2 className="mb-4">
        <i className="bi bi-cash-stack me-2"></i>
        Pannello Controllo Pagamenti
      </h2>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

      {/* Cards Statistiche */}
      {statistics && (
        <Row className="mb-4">
          {/* Totale da Pagare Oggi */}
          <Col md={3} sm={6} className="mb-3">
            <Card className="text-center border-warning">
              <Card.Body>
                <div className="mb-2">
                  <i className="bi bi-clock-history fs-2 text-warning"></i>
                </div>
                <h3 className="text-warning mb-1">{formatCurrency(statistics.toPay.amount)}</h3>
                <p className="text-muted mb-0 small">Da Pagare Oggi</p>
                <Badge bg="warning" text="dark">{statistics.toPay.count} payouts</Badge>
              </Card.Body>
            </Card>
          </Col>

          {/* Totale Pagato Questo Mese */}
          <Col md={3} sm={6} className="mb-3">
            <Card className="text-center border-success">
              <Card.Body>
                <div className="mb-2">
                  <i className="bi bi-check-circle fs-2 text-success"></i>
                </div>
                <h3 className="text-success mb-1">{formatCurrency(statistics.paidThisMonth.amount)}</h3>
                <p className="text-muted mb-0 small">Pagato Questo Mese</p>
                <Badge bg="success">{statistics.paidThisMonth.count} transfer</Badge>
              </Card.Body>
            </Card>
          </Col>

          {/* Transfer Falliti */}
          <Col md={3} sm={6} className="mb-3">
            <Card className="text-center border-danger">
              <Card.Body>
                <div className="mb-2">
                  <i className="bi bi-exclamation-triangle fs-2 text-danger"></i>
                </div>
                <h3 className="text-danger mb-1">{formatCurrency(statistics.failed.amount)}</h3>
                <p className="text-muted mb-0 small">Transfer Falliti</p>
                <Badge bg="danger">{statistics.failed.count} fallimenti</Badge>
              </Card.Body>
            </Card>
          </Col>

          {/* Fee Totali */}
          <Col md={3} sm={6} className="mb-3">
            <Card className="text-center border-info">
              <Card.Body>
                <div className="mb-2">
                  <i className="bi bi-graph-up fs-2 text-info"></i>
                </div>
                <h3 className="text-info mb-1">{formatCurrency(statistics.fees.total)}</h3>
                <p className="text-muted mb-0 small">Fee Questo Mese</p>
                <small className="text-muted">
                  Stripe: {formatCurrency(statistics.fees.stripeFees)} | 
                  Transfer: {formatCurrency(statistics.fees.transferFees)}
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Info Venditori */}
      {statistics && (
        <Row className="mb-4">
          <Col md={6}>
            <Alert variant="info">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Venditori con Stripe Connect:</strong> {statistics.vendors.withStripeConnect} attivi
            </Alert>
          </Col>
          <Col md={6}>
            <Alert variant="warning">
              <i className="bi bi-exclamation-circle me-2"></i>
              <strong>In Attesa di Onboarding:</strong> {statistics.vendors.pendingOnboarding} venditori
            </Alert>
          </Col>
        </Row>
      )}

      {/* Filtri */}
      <Card className="mb-4">
        <Card.Header>
          <i className="bi bi-funnel me-2"></i>
          Filtri
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Venditore</Form.Label>
                <Form.Select
                  value={filters.vendorId}
                  onChange={(e) => handleFilterChange('vendorId', e.target.value)}
                >
                  <option value="">Tutti i venditori</option>
                  {vendorsList.map(vendor => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.name} {!vendor.isOnboardingComplete && '⚠️'}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Data Inizio</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Data Fine</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setFilters({
                    vendorId: '',
                    startDate: '',
                    endDate: '',
                    page: 1,
                    limit: 20
                  });
                }}
                className="w-100"
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reset Filtri
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabella Pending Payouts */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>
            <i className="bi bi-list-ul me-2"></i>
            Payouts in Attesa di Pagamento (&gt;14 giorni)
          </span>
          <Badge bg="primary">{pagination.totalPayouts} totali</Badge>
        </Card.Header>
        <Card.Body>
          {loadingPayouts ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : pendingPayouts.length === 0 ? (
            <Alert variant="success">
              <i className="bi bi-check-circle me-2"></i>
              Nessun payout in attesa di pagamento!
            </Alert>
          ) : (
            <>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Venditore</th>
                      <th>Ordine</th>
                      <th>Data Vendita</th>
                      <th>Giorni Trascorsi</th>
                      <th>Importo</th>
                      <th>Fee Stripe</th>
                      <th>Fee Transfer</th>
                      <th>Status Stripe</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayouts.map(payout => (
                      <tr key={payout._id}>
                        <td>
                          <strong>{payout.vendorName}</strong>
                          <br />
                          <small className="text-muted">{payout.vendorEmail}</small>
                          {!payout.canBePaid && (
                            <div>
                              <Badge bg="danger" className="mt-1">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                Non Pagabile
                              </Badge>
                            </div>
                          )}
                        </td>
                        <td>#{payout.orderNumber}</td>
                        <td>{formatDate(payout.saleDate)}</td>
                        <td>
                          <Badge bg={payout.daysSinceSale >= 30 ? 'danger' : 'warning'}>
                            {payout.daysSinceSale} giorni
                          </Badge>
                        </td>
                        <td>
                          <strong className="text-success">{formatCurrency(payout.amount)}</strong>
                        </td>
                        <td className="text-danger">{formatCurrency(payout.stripeFee)}</td>
                        <td className="text-danger">{formatCurrency(payout.transferFee)}</td>
                        <td>
                          {payout.hasStripeAccount && payout.isOnboardingComplete ? (
                            <Badge bg="success">
                              <i className="bi bi-check-circle me-1"></i>
                              Pronto
                            </Badge>
                          ) : !payout.hasStripeAccount ? (
                            <Badge bg="danger">
                              <i className="bi bi-x-circle me-1"></i>
                              No Account
                            </Badge>
                          ) : (
                            <Badge bg="warning" text="dark">
                              <i className="bi bi-clock me-1"></i>
                              Onboarding Incompleto
                            </Badge>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            {payout.canBePaid && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => openConfirmModal('pay-now', payout)}
                                title="Paga immediatamente via Stripe"
                              >
                                <i className="bi bi-cash-stack"></i>
                              </Button>
                            )}
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => openConfirmModal('mark-paid', payout)}
                              title="Segna come pagato manualmente"
                            >
                              <i className="bi bi-check-square"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Paginazione */}
              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Pagina {pagination.currentPage} di {pagination.totalPages}
                  </div>
                  <div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={pagination.currentPage === 1}
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      className="me-2"
                    >
                      <i className="bi bi-chevron-left"></i> Precedente
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={pagination.currentPage === pagination.totalPages}
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                    >
                      Successiva <i className="bi bi-chevron-right"></i>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* SEZIONE TRANSFER LOG */}
      <Card className="mt-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-clock-history me-2"></i>
            Storico Transfer Completati
          </h5>
        </Card.Header>
        <Card.Body>
          {/* Filtri Transfer Log */}
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Venditore</Form.Label>
                <Form.Select
                  value={transferFilters.vendorId}
                  onChange={(e) => handleTransferFilterChange('vendorId', e.target.value)}
                >
                  <option value="">Tutti i venditori</option>
                  {vendorsList.map(vendor => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={transferFilters.status}
                  onChange={(e) => handleTransferFilterChange('status', e.target.value)}
                >
                  <option value="">Tutti</option>
                  <option value="paid">Pagati</option>
                  <option value="failed">Falliti</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Data Inizio</Form.Label>
                <Form.Control
                  type="date"
                  value={transferFilters.startDate}
                  onChange={(e) => handleTransferFilterChange('startDate', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Data Fine</Form.Label>
                <Form.Control
                  type="date"
                  value={transferFilters.endDate}
                  onChange={(e) => handleTransferFilterChange('endDate', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end gap-2">
              <Button
                variant="outline-secondary"
                onClick={resetTransferFilters}
                className="flex-grow-1"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </Button>
              <Button
                variant="success"
                onClick={handleDownloadCSV}
                title="Scarica CSV"
              >
                <i className="bi bi-download"></i>
              </Button>
            </Col>
          </Row>

          {/* Riepilogo Transfer */}
          {transferSummary && (
            <Row className="mb-3">
              <Col md={4}>
                <Card bg="success" text="white">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <small>Pagati</small>
                        <h5 className="mb-0">€{(transferSummary.totalPaidAmount || 0).toFixed(2)}</h5>
                      </div>
                      <i className="bi bi-check-circle fs-3"></i>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card bg="danger" text="white">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <small>Falliti</small>
                        <h5 className="mb-0">{transferSummary.totalFailedCount || 0} transfer</h5>
                      </div>
                      <i className="bi bi-x-circle fs-3"></i>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card bg="info" text="white">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <small>Commissioni Totali</small>
                        <h5 className="mb-0">€{(transferSummary.totalFees || 0).toFixed(2)}</h5>
                      </div>
                      <i className="bi bi-receipt fs-3"></i>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Tabella Transfer */}
          {loadingTransfers ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Caricamento transfer...</p>
            </div>
          ) : transfers.length === 0 ? (
            <Alert variant="info">
              <i className="bi bi-info-circle me-2"></i>
              Nessun transfer trovato con i filtri selezionati.
            </Alert>
          ) : (
            <>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Venditore</th>
                      <th>Ordine</th>
                      <th>Importo Netto</th>
                      <th>Fee</th>
                      <th>Ricevuto</th>
                      <th>Status</th>
                      <th>Stripe ID</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((transfer) => (
                      <tr key={transfer._id}>
                        <td>
                          {transfer.paymentDate 
                            ? new Date(transfer.paymentDate).toLocaleDateString('it-IT')
                            : transfer.saleDate 
                            ? new Date(transfer.saleDate).toLocaleDateString('it-IT')
                            : 'N/A'
                          }
                        </td>
                        <td>
                          {transfer.vendorName}
                          <br />
                          <small className="text-muted">{transfer.vendorEmail}</small>
                        </td>
                        <td>
                          <small>#{transfer.orderNumber}</small>
                        </td>
                        <td>€{transfer.amount.toFixed(2)}</td>
                        <td>
                          <small className="text-muted">
                            Stripe: €{transfer.stripeFee?.toFixed(2) || '0.00'}
                            <br />
                            Transfer: €{transfer.transferFee?.toFixed(2) || '0.00'}
                          </small>
                        </td>
                        <td>
                          <strong>€{(transfer.netAmount || (transfer.amount - (transfer.stripeFee || 0) - (transfer.transferFee || 0))).toFixed(2)}</strong>
                        </td>
                        <td>
                          {transfer.status === 'paid' ? (
                            <Badge bg="success">
                              <i className="bi bi-check-circle me-1"></i>
                              Pagato
                            </Badge>
                          ) : (
                            <Badge bg="danger">
                              <i className="bi bi-x-circle me-1"></i>
                              Fallito
                            </Badge>
                          )}
                        </td>
                        <td>
                          <small className="font-monospace">{transfer.stripeTransferId || 'N/A'}</small>
                        </td>
                        <td>
                          {transfer.status === 'failed' && transfer.failureReason && (
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => showErrorDetails(transfer.failureReason)}
                                title="Visualizza dettagli errore"
                              >
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                Dettagli
                              </Button>
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={() => openConfirmModal('retry', transfer)}
                                title="Riprova transfer"
                              >
                                <i className="bi bi-arrow-clockwise"></i>
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Paginazione Transfer */}
              {transferPagination.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Pagina {transferPagination.currentPage} di {transferPagination.totalPages} 
                    <span className="text-muted ms-2">({transferPagination.totalTransfers} transfer totali)</span>
                  </div>
                  <div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={transferPagination.currentPage === 1}
                      onClick={() => handleTransferPageChange(transferPagination.currentPage - 1)}
                      className="me-2"
                    >
                      <i className="bi bi-chevron-left"></i> Precedente
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={transferPagination.currentPage === transferPagination.totalPages}
                      onClick={() => handleTransferPageChange(transferPagination.currentPage + 1)}
                    >
                      Successiva <i className="bi bi-chevron-right"></i>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* SEZIONE ANALYTICS */}
      <Card className="mt-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-graph-up me-2"></i>
            Analytics Pagamenti
          </h5>
        </Card.Header>
        <Card.Body>
          {loadingAnalytics ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Caricamento analytics...</p>
            </div>
          ) : analytics ? (
            <>
              {/* Riepilogo Generale */}
              <Row className="mb-4">
                <Col md={3}>
                  <Card bg="primary" text="white">
                    <Card.Body className="text-center">
                      <h6>Totale Pagato</h6>
                      <h4>€{analytics.summary.totalAmountPaid.toFixed(2)}</h4>
                      <small>{analytics.summary.totalTransfers} transfer</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card bg="danger" text="white">
                    <Card.Body className="text-center">
                      <h6>Fee Stripe Totali</h6>
                      <h4>€{analytics.summary.totalStripeFees.toFixed(2)}</h4>
                      <small>Transazioni</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card bg="warning" text="dark">
                    <Card.Body className="text-center">
                      <h6>Fee Transfer Totali</h6>
                      <h4>€{analytics.summary.totalTransferFees.toFixed(2)}</h4>
                      <small>{analytics.platformCommissions.totalTransfers} transfer</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card bg="success" text="white">
                    <Card.Body className="text-center">
                      <h6>Netto ai Venditori</h6>
                      <h4>€{analytics.summary.netAmountToVendors.toFixed(2)}</h4>
                      <small>Media: €{analytics.summary.averageTransferAmount.toFixed(2)}</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Grafico Volume Pagamenti Mensili */}
              <Card className="mb-4">
                <Card.Header>
                  <h6 className="mb-0">
                    <i className="bi bi-bar-chart-line me-2"></i>
                    Volume Pagamenti Ultimi 6 Mesi
                  </h6>
                </Card.Header>
                <Card.Body>
                  {analytics.monthlyVolume.length === 0 ? (
                    <Alert variant="info">Nessun dato disponibile per il periodo selezionato</Alert>
                  ) : (
                    <div>
                      {analytics.monthlyVolume.map((month, index) => {
                        const maxAmount = Math.max(...analytics.monthlyVolume.map(m => m.totalAmount));
                        const percentage = (month.totalAmount / maxAmount) * 100;
                        
                        return (
                          <div key={index} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <strong>{month.monthLabel}</strong>
                              <span className="text-muted">
                                €{month.totalAmount.toFixed(2)} ({month.transferCount} transfer)
                              </span>
                            </div>
                            <div className="progress" style={{ height: '30px' }}>
                              <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{ width: `${percentage}%` }}
                                aria-valuenow={percentage} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              >
                                {percentage > 15 && `${percentage.toFixed(0)}%`}
                              </div>
                            </div>
                            <small className="text-muted">
                              Fee Stripe: €{month.totalStripeFee.toFixed(2)} | Fee Transfer: €{month.totalTransferFee.toFixed(2)}
                            </small>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Top Venditori */}
              <Card className="mb-4">
                <Card.Header>
                  <h6 className="mb-0">
                    <i className="bi bi-trophy me-2"></i>
                    Top 10 Venditori per Earnings
                  </h6>
                </Card.Header>
                <Card.Body>
                  {analytics.topVendors.length === 0 ? (
                    <Alert variant="info">Nessun venditore trovato</Alert>
                  ) : (
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Venditore</th>
                          <th>Totale Lordo</th>
                          <th>Fee Stripe</th>
                          <th>Fee Transfer</th>
                          <th>Netto Ricevuto</th>
                          <th>N° Pagamenti</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.topVendors.map((vendor, index) => (
                          <tr key={vendor.vendorId}>
                            <td>
                              {index === 0 && <i className="bi bi-trophy-fill text-warning me-1"></i>}
                              {index === 1 && <i className="bi bi-trophy-fill text-secondary me-1"></i>}
                              {index === 2 && <i className="bi bi-trophy-fill text-danger me-1"></i>}
                              {index + 1}
                            </td>
                            <td>
                              <strong>{vendor.vendorName}</strong>
                              <br />
                              <small className="text-muted">{vendor.vendorEmail}</small>
                            </td>
                            <td>€{vendor.totalEarnings.toFixed(2)}</td>
                            <td className="text-danger">€{vendor.totalStripeFee.toFixed(2)}</td>
                            <td className="text-warning">€{vendor.totalTransferFee.toFixed(2)}</td>
                            <td>
                              <strong className="text-success">€{vendor.netEarnings.toFixed(2)}</strong>
                            </td>
                            <td>
                              <Badge bg="info">{vendor.payoutCount}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>

              {/* Dettaglio Commissioni Piattaforma */}
              <Card>
                <Card.Header>
                  <h6 className="mb-0">
                    <i className="bi bi-cash-coin me-2"></i>
                    Commissioni Piattaforma (Fee Transfer)
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <div className="text-center p-3 bg-light rounded">
                        <small className="text-muted d-block">Totale Commissioni Incassate</small>
                        <h4 className="text-success mb-0">€{analytics.platformCommissions.totalCommissionsCollected.toFixed(2)}</h4>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="text-center p-3 bg-light rounded">
                        <small className="text-muted d-block">Media per Transfer</small>
                        <h4 className="text-primary mb-0">€{analytics.platformCommissions.averageCommissionPerTransfer.toFixed(2)}</h4>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="text-center p-3 bg-light rounded">
                        <small className="text-muted d-block">Totale Transfer Effettuati</small>
                        <h4 className="text-info mb-0">{analytics.platformCommissions.totalTransfers}</h4>
                      </div>
                    </Col>
                  </Row>
                  <Alert variant="info" className="mt-3 mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Info:</strong> La piattaforma incassa €{analytics.platformCommissions.transferFeePerTransaction.toFixed(2)} per ogni transfer Stripe Connect effettuato.
                  </Alert>
                </Card.Body>
              </Card>
            </>
          ) : (
            <Alert variant="warning">Errore nel caricamento delle analytics</Alert>
          )}
        </Card.Body>
      </Card>

      {/* Modal per dettagli errore */}
      <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-exclamation-triangle text-danger me-2"></i>
            Dettaglio Errore Transfer
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <strong>Motivo del fallimento:</strong>
            <p className="mb-0 mt-2">{selectedError}</p>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowErrorModal(false)}>
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal di conferma azioni manuali */}
      <Modal show={showConfirmModal} onHide={closeConfirmModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {getConfirmModalContent().title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            {getConfirmModalContent().message}
          </Alert>
          
          {getConfirmModalContent().warning && (
            <Alert variant="warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {getConfirmModalContent().warning}
            </Alert>
          )}

          {getConfirmModalContent().showNoteInput && (
            <Form.Group className="mt-3">
              <Form.Label>Nota (opzionale)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Es: Pagato tramite bonifico bancario il 04/02/2026"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
              />
              <Form.Text className="text-muted">
                Aggiungi una nota per spiegare come è stato effettuato il pagamento manuale.
              </Form.Text>
            </Form.Group>
          )}

          {selectedPayout && (
            <div className="mt-3 p-3 bg-light rounded">
              <h6>Dettagli Payout:</h6>
              <div className="d-flex justify-content-between">
                <span>Venditore:</span>
                <strong>{selectedPayout.vendorName}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Importo:</span>
                <strong className="text-success">€{selectedPayout.amount?.toFixed(2)}</strong>
              </div>
              {selectedPayout.orderNumber && (
                <div className="d-flex justify-content-between">
                  <span>Ordine:</span>
                  <small>#{selectedPayout.orderNumber}</small>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeConfirmModal} disabled={actionLoading}>
            Annulla
          </Button>
          <Button 
            variant={getConfirmModalContent().confirmVariant || 'primary'} 
            onClick={executeManualAction}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Elaborazione...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-1"></i>
                {getConfirmModalContent().confirmText || 'Conferma'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPaymentControl;
