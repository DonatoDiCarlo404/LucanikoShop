import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import * as Sentry from '@sentry/react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Aggiorna lo stato in modo che il prossimo rendering mostri l'UI di fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log dell'errore per debugging (visibile solo in console, non inviato)
    console.error('🔴 [ErrorBoundary] Errore catturato:', error);
    console.error('🔴 [ErrorBoundary] Stack:', errorInfo.componentStack);
    
    // Invia errore a Sentry se configurato
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setExtra('componentStack', errorInfo.componentStack);
        Sentry.captureException(error);
      });
    }
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className="mt-5 pt-5">
          <Alert variant="danger">
            <Alert.Heading>
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Ops! Si è verificato un errore
            </Alert.Heading>
            <p>
              Ci dispiace, qualcosa è andato storto. Il nostro team è già stato informato del problema.
            </p>
            <hr />
            <div className="d-flex gap-2">
              <Button variant="outline-danger" onClick={this.handleReload}>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Ricarica pagina
              </Button>
              <Button variant="primary" onClick={this.handleGoHome}>
                <i className="bi bi-house-fill me-2"></i>
                Torna alla Home
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-3">
                <summary style={{ cursor: 'pointer' }}>Dettagli errore (solo sviluppo)</summary>
                <pre className="mt-2 p-2 bg-light border rounded" style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
