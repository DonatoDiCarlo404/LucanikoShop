import User from '../models/User.js';

/**
 * Rinnova automaticamente l'abbonamento dei venditori scaduti.
 * Se la subscriptionEndDate è passata, prolunga di 1 anno (piano unico).
 * Non rinnova se subscriptionSuspended = true.
 */
export const renewExpiredSubscriptions = async () => {
  const now = new Date();
  // Trova tutti i seller con abbonamento scaduto e NON sospeso
  const expiredSellers = await User.find({
    role: 'seller',
    subscriptionEndDate: { $lte: now },
    subscriptionType: '1anno',
    subscriptionSuspended: { $ne: true } // Escludi i sospesi
  });

  let renewed = 0;
  const renewedList = []; // Per notifica admin
  
  for (const seller of expiredSellers) {
    const years = 1; // Piano unico: sempre 1 anno
    
    const newEndDate = new Date(now);
    newEndDate.setFullYear(newEndDate.getFullYear() + years);
    seller.subscriptionEndDate = newEndDate;
    await seller.save();
    renewed++;
    
    renewedList.push({
      name: seller.name,
      businessName: seller.businessName,
      email: seller.email,
      newEndDate: newEndDate.toISOString()
    });
  }
  
  return { renewed, renewedList };
};
