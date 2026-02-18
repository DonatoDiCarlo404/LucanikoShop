import Stripe from 'stripe';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import VendorPayout from '../models/VendorPayout.js';
import Notification from '../models/Notification.js';
import { sendOrderConfirmationEmail, sendNewOrderToVendorEmail } from '../utils/emailTemplates.js';
import { calculateVendorEarnings } from '../utils/vendorEarningsCalculator.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Gestisce il webhook di Stripe
export const handleStripeWebhook = async (req, res) => {
  console.log('\n🔔 [WEBHOOK] ================ WEBHOOK RICEVUTO ================ ');
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  console.log('🔑 [WEBHOOK] Webhook secret presente:', webhookSecret ? '✅ SI' : '❌ NO');
  if (!webhookSecret) {
    console.error('❌ [WEBHOOK] STRIPE_WEBHOOK_SECRET non configurato nel file .env!');
    console.error('❌ [WEBHOOK] Leggi il file WEBHOOK_DEBUG_INSTRUCTIONS.md per la configurazione');
    return res.status(500).send('Webhook secret non configurato');
  }

  let event;

  try {
    // Verifica che il webhook provenga davvero da Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('✅ [WEBHOOK] Evento verificato:', event.type);
  } catch (err) {
    console.error('⚠️ Errore verifica webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gestisci l'evento checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    console.log('💳 [WEBHOOK] Processando checkout.session.completed');
    const session = event.data.object;
    console.log('📋 [WEBHOOK] Session ID:', session.id);

    try {
      // Recupera i dettagli completi della sessione con line_items e payment_intent
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'payment_intent'],
      });

      // Estrai charge ID per source_transaction nei transfer
      const paymentIntentId = session.payment_intent;
      let chargeId = null;
      if (paymentIntentId) {
        // Se payment_intent è già expanded (è un oggetto), usa direttamente
        if (typeof fullSession.payment_intent === 'object' && fullSession.payment_intent.latest_charge) {
          chargeId = fullSession.payment_intent.latest_charge;
        } else {
          // Altrimenti recupera il payment_intent
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          chargeId = paymentIntent.latest_charge;
        }
        console.log('💳 [WEBHOOK] Charge ID per transfer:', chargeId);
      }

      // Estrai userId dai metadata
      console.log('📦 [WEBHOOK] Metadata completi:', JSON.stringify(session.metadata, null, 2));
      const userId = session.metadata.userId;
      const guestEmail = session.metadata.guestEmail || session.customer_details?.email;
      const isGuestOrder = !userId || userId === 'guest';
      console.log('👤 [WEBHOOK] userId estratto:', userId, 'typeof:', typeof userId);
      console.log('👤 [WEBHOOK] isGuestOrder:', isGuestOrder);
      console.log('📧 [WEBHOOK] guestEmail:', guestEmail);

      // Recupera utente solo se non è guest
      let buyerUser = null;
      if (!isGuestOrder) {
        buyerUser = await User.findById(userId);
        console.log('👤 [WEBHOOK] Utente registrato trovato:', buyerUser ? '✅' : '❌');
      }

      console.log('✅ [WEBHOOK] Procedo con creazione ordine');
      
      // Recupera i dati del carrello dai metadata
      const cartItemsData = JSON.parse(session.metadata.cartItems)
      console.log('🛒 [WEBHOOK] Cart items:', cartItemsData.length, 'prodotti');

      // SECURITY FIX: Recupera prodotti completi dal database con seller
      const orderItems = [];
      for (const item of cartItemsData) {
        const product = await Product.findById(item.productId).populate('seller');
        if (!product) {
          console.error(`⚠️ [WEBHOOK] Prodotto ${item.productId} non trovato`);
          continue;
        }

        // SECURITY FIX: Usa seller dal database, non dai metadata
        orderItems.push({
          product: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          seller: product.seller._id, // <-- Dal database!
          ivaPercent: product.ivaPercent || 22,
        });
      }

      // Ottieni indirizzo di spedizione da Stripe (ora raccolto automaticamente)
      const deliveryType = session.metadata.deliveryType || 'shipping';
      const shippingAddress = session.shipping_details?.address || session.customer_details?.address;
      const shippingName = session.shipping_details?.name || session.customer_details?.name;
      const shippingPhone = session.shipping_details?.phone || session.customer_details?.phone;

      console.log('📍 [WEBHOOK] deliveryType:', deliveryType);
      console.log('📍 [WEBHOOK] Stripe shipping_details:', session.shipping_details);
      console.log('📍 [WEBHOOK] Stripe customer_details:', session.customer_details);
      console.log('📍 [WEBHOOK] User address nel DB:', buyerUser?.address);
      
      // Prepara indirizzo spedizione (obbligatorio solo per shipping)
      let finalShippingAddress = null;
      let pickupAddress = null;

      if (deliveryType === 'pickup') {
        // Per il ritiro, recupera info negozio dai metadata
        const pickupInfo = JSON.parse(session.metadata.pickupInfo || '{}');
        pickupAddress = {
          businessName: pickupInfo.businessName || 'Negozio',
          street: pickupInfo.street || 'N/A',
          city: pickupInfo.city || 'N/A',
          state: pickupInfo.state || 'N/A',
          zipCode: pickupInfo.zipCode || 'N/A',
          country: pickupInfo.country || 'IT',
          phone: pickupInfo.phone || 'N/A',
          email: pickupInfo.email || 'N/A',
          notes: 'Ritiro in negozio - contattare il venditore prima del ritiro'
        };
        console.log('🏪 [WEBHOOK] Ritiro in negozio:', pickupAddress.businessName);
        
        // Per pickup, creiamo uno shippingAddress minimale per compatibilità (usare nome cliente)
        const fullName = buyerUser?.name || guestEmail || 'Cliente';
        const nameParts = fullName.split(' ');
        finalShippingAddress = {
          firstName: nameParts[0] || 'N/A',
          lastName: nameParts.slice(1).join(' ') || 'N/A',
          street: 'Ritiro in negozio',
          city: pickupAddress.city,
          state: pickupAddress.state,
          zipCode: pickupAddress.zipCode,
          country: pickupAddress.country,
          phone: session.customer_details?.phone || buyerUser?.phone || 'N/A'
        };
      } else {
        // Dividi il nome completo in firstName e lastName
        const fullName = shippingName || buyerUser?.name || 'N/A';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || 'N/A';
        const lastName = nameParts.slice(1).join(' ') || 'N/A';
        
        // Utilizza indirizzo salvato nel profilo se Stripe non fornisce dati completi
        finalShippingAddress = {
          firstName: firstName,
          lastName: lastName,
          street: shippingAddress?.line1 || buyerUser?.address?.street || 'N/A',
          city: shippingAddress?.city || buyerUser?.address?.city || 'N/A',
          state: shippingAddress?.state || buyerUser?.address?.state || 'N/A',
          zipCode: shippingAddress?.postal_code || buyerUser?.address?.zipCode || 'N/A',
          country: shippingAddress?.country || buyerUser?.address?.country || 'IT',
          phone: shippingPhone || buyerUser?.phone || 'N/A',
        };
      }
      
      console.log('📍 [WEBHOOK] Indirizzo spedizione finale:', finalShippingAddress);

      // Ottieni costo spedizione dai metadata
      const shippingCost = parseFloat(session.metadata.shippingCost || '0');
      
      // Ottieni info sconto dai metadata
      const discountAmount = parseFloat(session.metadata.discountAmount || '0');
      const appliedCouponId = session.metadata.appliedCouponId || null;

      // Calcola importo IVA totale
      let totalIva = 0;
      for (const item of orderItems) {
        // Calcolo IVA su prezzo lordo (inclusa):
        // iva = prezzo * (ivaPercent / (100 + ivaPercent))
        const ivaItem = (item.price * item.quantity) * (item.ivaPercent / (100 + item.ivaPercent));
        totalIva += ivaItem;
      }

      // Crea l'ordine nel database
      console.log('💾 [WEBHOOK] Creazione ordine');
      console.log('💾 [WEBHOOK] isGuestOrder:', isGuestOrder);
      console.log('💾 [WEBHOOK] buyer:', isGuestOrder ? 'null (guest)' : userId);
      console.log('💾 [WEBHOOK] Items:', orderItems.length);
      console.log('💾 [WEBHOOK] Total:', session.amount_total / 100);
      
      const orderData = {
        items: orderItems,
        deliveryType: deliveryType,
        shippingAddress: finalShippingAddress,
        pickupAddress: pickupAddress || undefined,
        paymentMethod: 'stripe',
        paymentResult: {
          id: session.payment_intent,
          status: session.payment_status,
          email_address: session.customer_details?.email,
        },
        itemsPrice: session.amount_subtotal / 100,
        shippingPrice: shippingCost,
        taxPrice: Math.round(totalIva * 100) / 100,
        discountAmount: discountAmount,
        appliedDiscount: appliedCouponId || undefined,
        totalPrice: session.amount_total / 100,
        status: 'processing',
        isPaid: true,
        paidAt: new Date(),
        stripeSessionId: session.id,
      };

      // Aggiungi campi specifici per ordini registrati o guest
      if (isGuestOrder) {
        orderData.isGuestOrder = true;
        orderData.guestEmail = guestEmail;
        orderData.guestName = session.customer_details?.name || 'Guest';
      } else {
        orderData.buyer = userId;
        orderData.isGuestOrder = false;
      }
      
      console.log('💾 [WEBHOOK] Order data completo:', JSON.stringify(orderData, null, 2));
      
      // Controlla se l'ordine esiste già (può essere stato creato dal SUCCESS handler)
      let order = await Order.findOne({ stripeSessionId: session.id });
      
      if (order) {
        console.log('🔄 [WEBHOOK] Ordine già esistente, lo uso per processare earnings:', order._id);
      } else {
        order = await Order.create(orderData);
        console.log('✅ [WEBHOOK] Ordine creato con successo!');
      }

      //console.log('✅ [WEBHOOK] Ordine creato con successo!');
      console.log('✅ [WEBHOOK] Order ID:', order._id);
      console.log('✅ [WEBHOOK] Buyer salvato come:', order.buyer || 'Guest');
      console.log('✅ [WEBHOOK] Guest email:', order.guestEmail);
      console.log('✅ [WEBHOOK] isPaid:', order.isPaid);
      console.log('✅ [WEBHOOK] Total Price:', order.totalPrice);

      // AGGIORNA STOCK PRODOTTI
      console.log('📦 [WEBHOOK] Aggiornamento stock prodotti...');
      for (const item of orderItems) {
        try {
          const product = await Product.findById(item.product);
          if (!product) {
            console.error(`⚠️ [WEBHOOK] Prodotto ${item.product} non trovato per aggiornare stock`);
            continue;
          }

          // Se il prodotto ha varianti, aggiorna lo stock della variante specifica
          if (item.selectedVariant && product.variants && product.variants.length > 0) {
            const variantIndex = product.variants.findIndex(v => v._id.toString() === item.selectedVariant);
            if (variantIndex !== -1) {
              const oldStock = product.variants[variantIndex].stock;
              product.variants[variantIndex].stock = Math.max(0, oldStock - item.quantity);
              await product.save();
              console.log(`✅ [WEBHOOK] Stock variante aggiornato: ${product.name} - Variante ${variantIndex} da ${oldStock} a ${product.variants[variantIndex].stock}`);
            } else {
              console.error(`⚠️ [WEBHOOK] Variante ${item.selectedVariant} non trovata nel prodotto ${product.name}`);
            }
          } else {
            // Prodotto senza varianti, aggiorna lo stock principale
            const oldStock = product.stock;
            product.stock = Math.max(0, oldStock - item.quantity);
            await product.save();
            console.log(`✅ [WEBHOOK] Stock aggiornato: ${product.name} da ${oldStock} a ${product.stock}`);
          }
        } catch (stockError) {
          console.error(`❌ [WEBHOOK] Errore aggiornamento stock per prodotto ${item.product}:`, stockError);
        }
      }

      // CALCOLA EARNINGS VENDITORI E CREA VENDOR PAYOUTS
      console.log('💰 [WEBHOOK] Calcolo earnings venditori...');
      
      // Controlla se earnings già calcolati
      if (order.vendorEarnings && order.vendorEarnings.length > 0) {
        console.log('⏭️  [WEBHOOK] Earnings già calcolati, skippo per evitare duplicati');
      } else {
        try {
          // Calcola earnings per ogni venditore
          const vendorEarnings = calculateVendorEarnings(order);
        
        // Salva earnings nell'ordine
        order.vendorEarnings = vendorEarnings;
        await order.save();
        console.log('✅ [WEBHOOK] Earnings salvati nell\'ordine');

        // Crea record VendorPayout per ogni venditore
        for (const earning of vendorEarnings) {
          try {
            const vendorPayout = await VendorPayout.create({
              vendorId: earning.vendorId,
              orderId: order._id,
              amount: earning.netAmount,
              stripeFee: earning.stripeFee,
              transferFee: earning.transferFee,
              status: 'pending',
              saleDate: new Date()
            });
            
            console.log(`✅ [WEBHOOK] VendorPayout creato per venditore ${earning.vendorId}:`, vendorPayout._id);
            console.log(`   - Importo netto: €${earning.netAmount}`);
            console.log(`   - Fee Stripe: €${earning.stripeFee}`);
            console.log(`   - Fee Transfer: €${earning.transferFee}`);

            // Aggiorna statistiche del venditore
            try {
              const vendor = await User.findById(earning.vendorId);
              if (vendor) {
                // Incrementa pendingEarnings (in attesa di pagamento)
                vendor.pendingEarnings = (vendor.pendingEarnings || 0) + earning.netAmount;
                // Incrementa totalEarnings (statistica totale)
                vendor.totalEarnings = (vendor.totalEarnings || 0) + earning.netAmount;
                await vendor.save();
                
                console.log(`✅ [WEBHOOK] Statistiche venditore aggiornate:`);
                console.log(`   - Pending Earnings: €${vendor.pendingEarnings.toFixed(2)}`);
                console.log(`   - Total Earnings: €${vendor.totalEarnings.toFixed(2)}`);

                // STRIPE CONNECT EXPRESS: Transfer automatico se account attivo
                if (vendor.stripeConnectAccountId && vendor.stripeChargesEnabled && vendor.stripePayoutsEnabled) {
                  console.log(`\n💸 [STRIPE TRANSFER] Inizio transfer automatico a venditore ${earning.vendorId}`);
                  
                  try {
                    // Converti importo in centesimi (Stripe richiede importi interi)
                    const amountInCents = Math.round(earning.netAmount * 100);
                    
                    // Crea transfer verso account Connect venditore
                    const transferParams = {
                      amount: amountInCents,
                      currency: 'eur',
                      destination: vendor.stripeConnectAccountId,
                      transfer_group: order._id.toString(),
                      description: `Vendita ordine #${order._id} - ${vendor.businessName || vendor.name}`,
                      metadata: {
                        orderId: order._id.toString(),
                        vendorId: earning.vendorId,
                        payoutId: vendorPayout._id.toString()
                      }
                    };

                    // Aggiungi source_transaction se disponibile (preleva dalla transazione specifica)
                    if (chargeId) {
                      transferParams.source_transaction = chargeId;
                      console.log(`💳 [STRIPE TRANSFER] Usando source_transaction: ${chargeId}`);
                    }

                    const transfer = await stripe.transfers.create(transferParams);

                    console.log(`✅ [STRIPE TRANSFER] Transfer completato: ${transfer.id}`);
                    console.log(`   - Importo: €${earning.netAmount.toFixed(2)}`);
                    console.log(`   - Destinazione: ${vendor.stripeConnectAccountId}`);

                    // Aggiorna VendorPayout con info transfer
                    vendorPayout.status = 'processing';
                    vendorPayout.stripeTransferId = transfer.id;
                    vendorPayout.paymentDate = new Date();
                    await vendorPayout.save();

                    // Aggiorna statistiche venditore
                    vendor.pendingEarnings = Math.max(0, (vendor.pendingEarnings || 0) - earning.netAmount);
                    vendor.paidEarnings = (vendor.paidEarnings || 0) + earning.netAmount;
                    await vendor.save();

                    console.log(`✅ [STRIPE TRANSFER] VendorPayout aggiornato a 'processing'`);

                  } catch (transferError) {
                    console.error(`❌ [STRIPE TRANSFER] Errore transfer per venditore ${earning.vendorId}:`, transferError);
                    console.error(`   - Messaggio: ${transferError.message}`);
                    console.error(`   - Tipo: ${transferError.type}`);
                    
                    // Salva errore nel payout ma non bloccare il flusso
                    vendorPayout.status = 'failed';
                    vendorPayout.failureReason = transferError.message;
                    await vendorPayout.save();
                  }
                } else {
                  console.log(`⚠️ [STRIPE TRANSFER] Venditore ${earning.vendorId} non ha Stripe Connect attivo - transfer manuale richiesto`);
                  if (!vendor.stripeConnectAccountId) {
                    console.log(`   - Nessun account Connect creato`);
                  } else if (!vendor.stripeChargesEnabled || !vendor.stripePayoutsEnabled) {
                    console.log(`   - Account Connect non completamente attivato`);
                    console.log(`   - Charges enabled: ${vendor.stripeChargesEnabled}`);
                    console.log(`   - Payouts enabled: ${vendor.stripePayoutsEnabled}`);
                  }
                }

              } else {
                console.error(`⚠️ [WEBHOOK] Venditore ${earning.vendorId} non trovato per aggiornare statistiche`);
              }
            } catch (vendorUpdateError) {
              console.error(`❌ [WEBHOOK] Errore aggiornamento statistiche venditore ${earning.vendorId}:`, vendorUpdateError);
            }
          } catch (payoutError) {
            console.error(`❌ [WEBHOOK] Errore creazione VendorPayout per ${earning.vendorId}:`, payoutError);
          }
        }
        } catch (earningsError) {
          console.error('❌ [WEBHOOK] Errore calcolo earnings:', earningsError);
          // Non bloccare il flusso se il calcolo earnings fallisce
        }
      }

      // Invia email di conferma acquisto
      try {
        let recipientEmail, recipientName;
        
        if (isGuestOrder) {
          // Ordine guest: usa email e nome dal guest order
          recipientEmail = order.guestEmail;
          recipientName = order.guestName;
        } else {
          // Ordine registrato: recupera email e nome dal profilo
          const user = await User.findById(userId);
          if (user) {
            recipientEmail = user.email;
            recipientName = user.name;
          }
        }

        if (recipientEmail) {
          // Prepara lista prodotti
          const productsList = order.items.map(item => `${item.name} (${item.quantity}x)`).join(', ');
          const totalAmount = `€${order.totalPrice.toFixed(2)}`;
          const shippingAddress = `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.zipCode}`;
          
          await sendOrderConfirmationEmail(
            recipientEmail, 
            recipientName, 
            order._id.toString(), 
            productsList, 
            totalAmount, 
            shippingAddress
          );
        }
      } catch (emailError) {
        console.error('Errore invio email conferma acquisto:', emailError);
      }

      // Invia email ai venditori
      console.log('📧 [WEBHOOK] Invio email ai venditori...');
      try {
        // Raggruppa items per venditore
        const itemsByVendor = {};
        for (const item of order.items) {
          const vendorId = item.seller.toString();
          if (!itemsByVendor[vendorId]) {
            itemsByVendor[vendorId] = [];
          }
          itemsByVendor[vendorId].push(item);
        }

        // Invia email a ciascun venditore
        const vendorEmailPromises = [];
        for (const [vendorId, vendorItems] of Object.entries(itemsByVendor)) {
          const vendor = await User.findById(vendorId).select('email name businessName companyName');
          if (!vendor || !vendor.email) {
            console.log(`⚠️ [WEBHOOK] Venditore ${vendorId} non trovato o senza email`);
            continue;
          }

          const vendorProductsList = vendorItems.map(item => `${item.name} (x${item.quantity})`).join(', ');
          const vendorTotalAmount = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const companyName = vendor.businessName || vendor.companyName || vendor.name;
          const customerName = isGuestOrder ? (order.guestName || 'Cliente Guest') : (buyerUser?.name || 'Cliente');
          const billingShippingData = order.deliveryType === 'pickup' 
            ? `Ritiro in negozio: ${order.pickupAddress?.city || 'N/A'}`
            : `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}`;

          const emailPromise = sendNewOrderToVendorEmail(
            vendor.email,
            companyName,
            order._id.toString(),
            vendorProductsList,
            `€${vendorTotalAmount.toFixed(2)}`,
            customerName,
            billingShippingData
          ).catch(err => {
            console.error(`❌ [WEBHOOK] Errore invio email a venditore ${vendor.email}:`, err.message);
          });

          vendorEmailPromises.push(emailPromise);
          console.log(`✅ [WEBHOOK] Email preparata per venditore: ${vendor.email}`);
        }

        // Attendi tutte le email ai venditori
        await Promise.all(vendorEmailPromises);
        console.log('✅ [WEBHOOK] Tutte le email ai venditori sono state inviate');
      } catch (vendorEmailError) {
        console.error('❌ [WEBHOOK] Errore invio email ai venditori:', vendorEmailError);
        // Non bloccare il webhook se le email ai venditori falliscono
      }

      // Crea notifiche per i venditori
      console.log('🔔 [WEBHOOK] Creazione notifiche per i venditori...');
      try {
        const notificationPromises = [];
        const itemsByVendor = {};
        for (const item of order.items) {
          const vendorId = item.seller.toString();
          if (!itemsByVendor[vendorId]) {
            itemsByVendor[vendorId] = [];
          }
          itemsByVendor[vendorId].push(item);
        }

        for (const [vendorId, vendorItems] of Object.entries(itemsByVendor)) {
          const vendorProductsList = vendorItems.map(item => `${item.name} (x${item.quantity})`).join(', ');
          const vendorTotalAmount = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          const notificationPromise = Notification.create({
            userId: vendorId,
            type: 'new_order',
            message: `🎉 Nuovo ordine ricevuto! ${vendorProductsList} - Totale: €${vendorTotalAmount.toFixed(2)}`,
            data: {
              orderId: order._id,
              orderNumber: order._id.toString(),
              totalAmount: vendorTotalAmount,
              items: vendorItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
              }))
            }
          }).catch(err => {
            console.error(`❌ [WEBHOOK] Errore creazione notifica per venditore ${vendorId}:`, err.message);
          });

          notificationPromises.push(notificationPromise);
        }

        await Promise.all(notificationPromises);
        console.log('✅ [WEBHOOK] Tutte le notifiche ai venditori sono state create');
      } catch (notificationError) {
        console.error('❌ [WEBHOOK] Errore creazione notifiche ai venditori:', notificationError);
        // Non bloccare il webhook se le notifiche falliscono
      }

    } catch (error) {
      console.error('❌ Errore creazione ordine:', error);
      return res.status(500).send('Errore creazione ordine');
    }
  }

  // Rispondi a Stripe che il webhook è stato ricevuto
  res.json({ received: true });
};