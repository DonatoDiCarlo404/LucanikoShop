import { useState } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StripePaymentForm = ({ amount, onPaymentSuccess, onPaymentError, disabled, email, subscriptionType, registrationData }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // 1. Crea PaymentIntent sul backend
      const response = await fetch(`${API_URL}/payment/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          email,
          subscriptionType,
          metadata: {
            type: 'vendor_subscription'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[StripePaymentForm] Errore PaymentIntent:', errorData);
        throw new Error(errorData.error || 'Errore nella creazione del pagamento');
      }

      const data = await response.json();
      const { clientSecret, paymentIntentId } = data;

      // 2. Conferma il pagamento con Stripe
      const cardNumberElement = elements.getElement(CardNumberElement);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: cardholderName,
            email: email
          }
        }
      });

      if (stripeError) {
        console.error('[StripePaymentForm] Errore Stripe:', stripeError);
        setError(stripeError.message);
        setProcessing(false);
        onPaymentError(stripeError.message);
        return;
      }

      // 3. Verifica che il pagamento sia andato a buon fine
      if (paymentIntent.status === 'succeeded') {
        // Estrai dati non sensibili della carta dal backend
        let cardDetails = undefined;
        try {
          const paymentMethodId = paymentIntent?.payment_method;
          
          if (typeof paymentMethodId === 'string') {
            // Recupera i dati della carta dal backend
            const pmResponse = await fetch(`${API_URL}/payment/get-payment-method`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentMethodId })
            });
            
            if (pmResponse.ok) {
              const pmData = await pmResponse.json();
              
              if (pmData.cardDetails) {
                cardDetails = {
                  cardHolder: cardholderName,
                  cardType: pmData.cardDetails.brand,
                  cardNumber: pmData.cardDetails.last4,
                  expiryDate: `${pmData.cardDetails.exp_month.toString().padStart(2, '0')}/${pmData.cardDetails.exp_year.toString().slice(-2)}`
                };
              }
            } else {
              console.warn('[StripePaymentForm] Errore recupero payment method dal backend');
            }
          } else {
            console.warn('[StripePaymentForm] paymentMethodId non disponibile');
          }
        } catch (e) {
          console.warn('Impossibile estrarre i dati carta:', e);
        }

        // 4. Se ci sono dati di registrazione, registra l'utente
        if (registrationData) {
          try {
            const regBody = {
              ...registrationData,
              paymentIntentId: paymentIntent.id,
              subscriptionType,
              subscriptionPaid: true
            };
            if (cardDetails) regBody.cardDetails = cardDetails;
            const registerResponse = await fetch(`${API_URL}/auth/register`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(regBody)
            });

            if (!registerResponse.ok) {
              const errorData = await registerResponse.json();
              console.error('[StripePaymentForm] Errore registrazione:', errorData);
              throw new Error(errorData.message || 'Errore nella registrazione');
            }

            const userData = await registerResponse.json();
            onPaymentSuccess(paymentIntent.id, userData);
          } catch (regError) {
            console.error('[StripePaymentForm] Pagamento riuscito ma errore nella registrazione:', regError);
            throw new Error(`Pagamento riuscito ma errore nella registrazione: ${regError.message}`);
          }
        } else {
          onPaymentSuccess(paymentIntent.id);
        }
      } else {
        console.error('[StripePaymentForm] Pagamento non completato:', paymentIntent.status);
        throw new Error('Pagamento non completato');
      }
      
    } catch (err) {
      const errorMessage = err.message || 'Errore durante il pagamento';
      console.error('[StripePaymentForm] CATCH:', errorMessage, err);
      setError(errorMessage);
      setProcessing(false);
      onPaymentError(errorMessage);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <Form onSubmit={handlePayment}>
      <Form.Group className="mb-3">
        <Form.Label>Intestazione (come sulla carta) <span style={{color: 'red'}}>*</span></Form.Label>
        <Form.Control
          type="text"
          placeholder="Es: Mario Rossi"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          disabled={disabled}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Numero della Carta <span style={{color: 'red'}}>*</span></Form.Label>
        <div style={{
          padding: '12px',
          border: '1px solid #ced4da',
          borderRadius: '0.375rem',
          backgroundColor: disabled ? '#e9ecef' : 'white'
        }}>
          <CardNumberElement options={cardElementOptions} />
        </div>
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Scadenza <span style={{color: 'red'}}>*</span></Form.Label>
            <div style={{
              padding: '12px',
              border: '1px solid #ced4da',
              borderRadius: '0.375rem',
              backgroundColor: disabled ? '#e9ecef' : 'white'
            }}>
              <CardExpiryElement options={cardElementOptions} />
            </div>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>CVV <span style={{color: 'red'}}>*</span></Form.Label>
            <div style={{
              padding: '12px',
              border: '1px solid #ced4da',
              borderRadius: '0.375rem',
              backgroundColor: disabled ? '#e9ecef' : 'white'
            }}>
              <CardCvcElement options={cardElementOptions} />
            </div>
          </Form.Group>
        </Col>
      </Row>

      <Form.Text className="text-muted d-block mb-3">
        Totale da pagare: €{amount.toFixed(2)} (IVA inclusa)
      </Form.Text>

      {error && <Alert variant="danger">{error}</Alert>}

      <Button 
        variant="success" 
        type="submit" 
        className="w-100 mb-3" 
        disabled={!stripe || processing || disabled}
      >
        {processing ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Elaborazione...
          </>
        ) : (
          `Paga €${amount.toFixed(2)}`
        )}
      </Button>
    </Form>
  );
};

export default StripePaymentForm;
