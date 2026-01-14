import User from '../models/User.js';

/**
 * Rinnova automaticamente l'abbonamento dei venditori scaduti.
 * Se la subscriptionEndDate è passata, prolunga di 1, 2 o 3 anni in base a subscriptionType.
 * Non rinnova se subscriptionSuspended = true.
 */
export const renewExpiredSubscriptions = async () => {
  const now = new Date();
  // Trova tutti i seller con abbonamento scaduto e NON sospeso
  const expiredSellers = await User.find({
    role: 'seller',
    subscriptionEndDate: { $lte: now },
    subscriptionType: { $in: ['1', '2', '3', 1, 2, 3] },
    subscriptionSuspended: { $ne: true } // Escludi i sospesi
  });

  let renewed = 0;
  const renewedList = []; // Per notifica admin
  
  for (const seller of expiredSellers) {
    let years = 1;
    if (String(seller.subscriptionType) === '2') years = 2;
    if (String(seller.subscriptionType) === '3') years = 3;
    
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
