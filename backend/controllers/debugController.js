import Order from '../models/Order.js';
import Product from '../models/Product.js';

// SOLO PER DEBUG - Crea un ordine manualmente per testare il flusso
export const createTestOrder = async (req, res) => {
  try {
    console.log('\n🧪 [DEBUG] ================ CREAZIONE ORDINE TEST ================ ');
    console.log('🧪 [DEBUG] Body ricevuto:', JSON.stringify(req.body, null, 2));

    const { 
      buyerId, 
      isGuest = false, 
      guestEmail, 
      guestName,
      items, 
      shippingAddress,
      totalPrice,
      shippingCost = 0
    } = req.body;

    // Validazione
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Items richiesti' });
    }

    if (!isGuest && !buyerId) {
      return res.status(400).json({ message: 'buyerId richiesto per ordini non guest' });
    }

    if (isGuest && !guestEmail) {
      return res.status(400).json({ message: 'guestEmail richiesto per ordini guest' });
    }

    // Prepara orderItems
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId).populate('seller');
      if (!product) {
        return res.status(404).json({ message: `Prodotto ${item.productId} non trovato` });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        seller: product.seller._id,
        ivaPercent: product.ivaPercent || 22
      });
    }

    // Calcola prezzi
    const itemsPrice = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let totalIva = 0;
    for (const item of orderItems) {
      const ivaItem = (item.price * item.quantity) * (item.ivaPercent / (100 + item.ivaPercent));
      totalIva += ivaItem;
    }

    // Crea orderData
    const orderData = {
      items: orderItems,
      shippingAddress: shippingAddress || {
        street: 'Via Test 123',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Italia',
        phone: '+39 123456789'
      },
      paymentMethod: 'stripe',
      paymentResult: {
        id: 'test_payment_' + Date.now(),
        status: 'paid',
        email_address: isGuest ? guestEmail : null
      },
      itemsPrice: itemsPrice,
      shippingPrice: shippingCost,
      taxPrice: Math.round(totalIva * 100) / 100,
      discountAmount: 0,
      totalPrice: totalPrice || (itemsPrice + shippingCost),
      status: 'processing',
      isPaid: true,
      paidAt: new Date()
    };

    // Aggiungi campi specifici
    if (isGuest) {
      orderData.isGuestOrder = true;
      orderData.guestEmail = guestEmail;
      orderData.guestName = guestName || 'Test Guest';
    } else {
      orderData.buyer = buyerId;
      orderData.isGuestOrder = false;
    }

    console.log('🧪 [DEBUG] Order data preparato:', JSON.stringify(orderData, null, 2));

    // Crea ordine
    const order = await Order.create(orderData);
    console.log('✅ [DEBUG] Ordine creato:', order._id);

    // Aggiorna stock
    console.log('📦 [DEBUG] Aggiornamento stock...');
    for (const item of orderItems) {
      try {
        const product = await Product.findById(item.product);
        if (!product) {
          console.error(`⚠️ [DEBUG] Prodotto ${item.product} non trovato`);
          continue;
        }

        const oldStock = product.stock;
        product.stock = Math.max(0, oldStock - item.quantity);
        await product.save();
        console.log(`✅ [DEBUG] Stock aggiornato: ${product.name} da ${oldStock} a ${product.stock}`);
      } catch (stockError) {
        console.error(`❌ [DEBUG] Errore aggiornamento stock:`, stockError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Ordine test creato con successo',
      order: {
        _id: order._id,
        orderNumber: order._id,
        totalPrice: order.totalPrice,
        isGuestOrder: order.isGuestOrder,
        buyer: order.buyer,
        guestEmail: order.guestEmail
      }
    });

  } catch (error) {
    console.error('❌ [DEBUG] Errore creazione ordine test:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
