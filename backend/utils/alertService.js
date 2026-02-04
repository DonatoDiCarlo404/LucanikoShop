import sgMail from '../config/sendgrid.js';
import logger from '../config/logger.js';

// Email admin per alert
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lucanikoshop.it';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@lucanikoshop.it';

/**
 * Invia alert email per transfer fallito
 */
export const sendTransferFailedAlert = async (payout, vendor, error) => {
  try {
    const msg = {
      to: ADMIN_EMAIL,
      from: FROM_EMAIL,
      subject: `ALERT: Transfer Fallito - ${vendor.name || vendor.email}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🚨 Transfer Stripe Fallito</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
            <h3 style="color: #dc3545; margin-top: 0;">Dettagli Transfer</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;"><strong>Payout ID:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${payout._id}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;"><strong>Venditore:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${vendor.name || vendor.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;"><strong>Importo:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">€${payout.amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;"><strong>Data Vendita:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${new Date(payout.saleDate).toLocaleDateString('it-IT')}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;"><strong>Ordine ID:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${payout.orderId}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;"><strong>Stripe Account:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${vendor.stripeConnectAccountId || 'NON CONFIGURATO'}</td>
              </tr>
            </table>

            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin-top: 20px;">
              <h4 style="color: #856404; margin-top: 0;">Motivo Fallimento:</h4>
              <p style="color: #856404; margin: 0; font-family: monospace;">${error?.message || payout.failureReason || 'Errore sconosciuto'}</p>
            </div>

            ${error?.stack ? `
              <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin-top: 15px;">
                <h4 style="color: #721c24; margin-top: 0;">Stack Trace:</h4>
                <pre style="color: #721c24; font-size: 12px; overflow-x: auto;">${error.stack}</pre>
              </div>
            ` : ''}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dee2e6;">
              <h4>Azioni Consigliate:</h4>
              <ol>
                <li>Verificare che il venditore abbia completato Stripe Connect onboarding</li>
                <li>Controllare saldo disponibile account Stripe principale</li>
                <li>Verificare che l'account Stripe Connect del venditore sia attivo</li>
                <li>Riprovare transfer manualmente da admin dashboard</li>
              </ol>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/admin/payments" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Vai al Pannello Admin
              </a>
            </div>
          </div>

          <div style="background: #6c757d; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="margin: 0; font-size: 12px;">
              Questo è un alert automatico dal sistema di pagamenti LucanikoShop
            </p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">
              Timestamp: ${new Date().toLocaleString('it-IT')}
            </p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);
    logger.info('Alert email inviato per transfer fallito', {
      payoutId: payout._id,
      vendorId: vendor._id,
      adminEmail: ADMIN_EMAIL
    });
  } catch (error) {
    logger.error('Errore invio alert email', {
      error: error.message,
      code: error.code,
      statusCode: error.response?.statusCode,
      body: error.response?.body,
      payoutId: payout._id,
      vendorId: vendor._id
    });
    // Non ri-lanciare l'errore per non bloccare il processo
  }
};

/**
 * Invia alert email per cron job fallito
 */
export const sendCronFailureAlert = async (error, jobName = 'Automatic Payouts') => {
  try {
    const msg = {
      to: ADMIN_EMAIL,
      from: FROM_EMAIL,
      subject: `🚨 ALERT: Cron Job Fallito - ${jobName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🚨 Cron Job Fallito</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
            <h3 style="color: #dc3545; margin-top: 0;">Il job ${jobName} è fallito</h3>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin-top: 20px;">
              <h4 style="color: #856404; margin-top: 0;">Errore:</h4>
              <p style="color: #856404; margin: 0; font-family: monospace;">${error?.message || 'Errore sconosciuto'}</p>
            </div>

            ${error?.stack ? `
              <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin-top: 15px;">
                <h4 style="color: #721c24; margin-top: 0;">Stack Trace:</h4>
                <pre style="color: #721c24; font-size: 12px; overflow-x: auto;">${error.stack}</pre>
              </div>
            ` : ''}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dee2e6;">
              <h4>Azioni Richieste:</h4>
              <ol>
                <li>Verificare log server per dettagli completi</li>
                <li>Controllare connessione database MongoDB</li>
                <li>Verificare che Railway non abbia riavviato il servizio</li>
                <li>Eseguire job manualmente se necessario</li>
              </ol>
            </div>
          </div>

          <div style="background: #6c757d; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="margin: 0; font-size: 12px;">
              Alert automatico - LucanikoShop Monitoring
            </p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">
              Timestamp: ${new Date().toLocaleString('it-IT')}
            </p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);
    logger.info('Alert email inviato per cron job fallito');
  } catch (error) {
    logger.error('Errore invio alert email cron', { error: error.message });
  }
};

/**
 * Invia alert per saldo Stripe basso
 */
export const sendLowBalanceAlert = async (balance) => {
  try {
    const msg = {
      to: ADMIN_EMAIL,
      from: FROM_EMAIL,
      subject: '⚠️ ALERT: Saldo Stripe Basso',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ffc107; color: #000; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">⚠️ Saldo Stripe Basso</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
            <p>Il saldo disponibile sul tuo account Stripe è basso e potrebbe non essere sufficiente per i prossimi transfer ai venditori.</p>
            
            <div style="background: white; border: 2px solid #ffc107; border-radius: 4px; padding: 20px; text-align: center; margin: 20px 0;">
              <h3 style="margin: 0; font-size: 36px; color: #856404;">€${(balance.available[0]?.amount / 100).toFixed(2)}</h3>
              <p style="margin: 5px 0 0 0; color: #856404;">Saldo Disponibile</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #dee2e6;">
              <h4>Azioni Consigliate:</h4>
              <ol>
                <li>Verifica pagamenti in arrivo nei prossimi giorni</li>
                <li>Considera di ricaricare il saldo se necessario</li>
                <li>Monitora dashboard Stripe per dettagli</li>
              </ol>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://dashboard.stripe.com/balance/overview" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Apri Dashboard Stripe
              </a>
            </div>
          </div>

          <div style="background: #6c757d; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="margin: 0; font-size: 12px;">
              Alert automatico - LucanikoShop Monitoring
            </p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">
              Timestamp: ${new Date().toLocaleString('it-IT')}
            </p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);
    logger.info('Alert email inviato per saldo basso', { balance: balance.available[0]?.amount });
  } catch (error) {
    logger.error('Errore invio alert email saldo', { error: error.message });
  }
};

export default {
  sendTransferFailedAlert,
  sendCronFailureAlert,
  sendLowBalanceAlert,
};
