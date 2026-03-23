import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Order from './models/Order.js';
import VendorPayout from './models/VendorPayout.js';
import Product from './models/Product.js';

dotenv.config();

const debugVendorRevenue = async () => {
  try {
    // Connessione al database di produzione
    await mongoose.connect(process.env.MONGODB_URI_PROD);
    console.log('✅ Connesso al database di produzione');

    // Trova tutti i venditori
    const vendors = await User.find({ role: 'seller' }).select('businessName email totalEarnings');
    
    console.log('\n=== VENDITORI DISPONIBILI ===');
    vendors.forEach(v => {
      console.log(`- ${v.businessName} (${v.email}) - €${v.totalEarnings || 0}`);
    });

    // Trova il venditore "La Bontà del Grano" o simile
    const vendor = vendors.find(v => v.businessName?.includes('Bontà') || v.businessName?.includes('Grano'));
    
    if (!vendor) {
      console.log('\n❌ Venditore La Bontà del Grano non trovato');
      return;
    }

    console.log('\n=== VENDITORE ===');
    console.log(`Nome: ${vendor.businessName}`);
    console.log(`ID: ${vendor._id}`);
    console.log(`totalEarnings (campo User): €${vendor.totalEarnings || 0}`);

    // Trova tutti gli ordini pagati che contengono prodotti del venditore
    const orders = await Order.find({ 
      'items.seller': vendor._id,
      isPaid: true 
    }).populate('items.product', 'name price');

    console.log(`\n=== ORDINI PAGATI (${orders.length}) ===`);
    
    let totalRevenue = 0;
    let totalProducts = 0;

    orders.forEach(order => {
      const vendorItems = order.items.filter(item => item.seller.toString() === vendor._id.toString());
      
      if (vendorItems.length > 0) {
        console.log(`\nOrdine: ${order.orderNumber}`);
        console.log(`Data: ${order.createdAt}`);
        
        vendorItems.forEach(item => {
          const itemTotal = item.price * item.quantity;
          totalRevenue += itemTotal;
          totalProducts += item.quantity;
          
          console.log(`  - ${item.product?.name || 'Prodotto sconosciuto'}`);
          console.log(`    Prezzo: €${item.price} x ${item.quantity} = €${itemTotal.toFixed(2)}`);
        });
      }
    });

    console.log(`\n=== TOTALE DA ORDINI ===`);
    console.log(`Fatturato Totale (GROSS): €${totalRevenue.toFixed(2)}`);
    console.log(`Prodotti venduti: ${totalProducts}`);

    // Trova tutti i VendorPayouts
    const payouts = await VendorPayout.find({ vendorId: vendor._id })
      .sort({ saleDate: 1 });

    console.log(`\n=== VENDOR PAYOUTS (${payouts.length}) ===`);
    
    let totalPayouts = 0;
    
    payouts.forEach(payout => {
      totalPayouts += payout.amount;
      console.log(`\nPayout ID: ${payout._id}`);
      console.log(`Data: ${payout.saleDate}`);
      console.log(`Ordine: ${payout.orderNumber}`);
      console.log(`Amount (NET): €${payout.amount.toFixed(2)}`);
      console.log(`Gross: €${payout.grossAmount?.toFixed(2) || 'N/A'}`);
      console.log(`Status: ${payout.status}`);
      console.log(`Stripe Transfer: ${payout.stripeTransferId || 'Nessuno'}`);
    });

    console.log(`\n=== TOTALE DA VENDORPAYOUTS ===`);
    console.log(`Guadagni Totali (NET): €${totalPayouts.toFixed(2)}`);

    console.log(`\n=== CONFRONTO ===`);
    console.log(`Fatturato (da ordini): €${totalRevenue.toFixed(2)}`);
    console.log(`Guadagni (da payouts): €${totalPayouts.toFixed(2)}`);
    console.log(`User.totalEarnings: €${vendor.totalEarnings || 0}`);
    
    const expectedFee = totalRevenue * 0.029 + 0.25; // Stripe fee
    const expectedNet = totalRevenue - expectedFee;
    console.log(`\nGuadagni attesi (con Stripe fee): €${expectedNet.toFixed(2)}`);
    console.log(`Differenza: €${(totalPayouts - expectedNet).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connessione chiusa');
  }
};

debugVendorRevenue();
