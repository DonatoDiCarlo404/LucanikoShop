/**
 * Calcola il costo di spedizione in base alle impostazioni del venditore
 * @param {Object} vendorShippingSettings - Impostazioni spedizione del venditore (User.shopSettings.shipping)
 * @param {Object} cartData - Dati del carrello (items, peso totale, destinazione, cartTotal)
 * @returns {Object} - { shippingCost, appliedRate, freeShipping, shippingOptions }
 */
export const calculateShipping = (vendorShippingSettings, cartData) => {
    const { items, shippingAddress, cartTotal } = cartData;

    console.log('🔵 [BACKEND] Inizio calcolo spedizione');
    console.log('🔵 [BACKEND] Impostazioni venditore:', JSON.stringify(vendorShippingSettings, null, 2));
    console.log('🔵 [BACKEND] Indirizzo spedizione:', shippingAddress);
    console.log('🔵 [BACKEND] Totale carrello:', cartTotal);

    // Default: nessuna spedizione configurata
    if (!vendorShippingSettings) {
        return {
            shippingCost: 0,
            appliedRate: null,
            freeShipping: false,
            message: 'Spedizione non configurata dal venditore',
            shippingOptions: []
        };
    }

    // Calcola peso totale del carrello
    console.log('🔍 [BACKEND] Items nel carrello:', items.length);
    const totalWeight = items.reduce((sum, item) => {
        console.log(`🔍 [BACKEND] Item:`, {
            productId: item.product?._id,
            name: item.product?.name,
            weight: item.product?.weight,
            quantity: item.quantity
        });
        const weight = item.product?.weight || 0;
        return sum + (weight * item.quantity);
    }, 0);
    console.log('🔍 [BACKEND] Peso totale calcolato:', totalWeight, 'kg');

        // Calcola totale carrello se non passato
        const calculatedCartTotal = (typeof cartTotal === 'number' && !isNaN(cartTotal))
            ? cartTotal
            : items.reduce((sum, item) => {
                    const price = (typeof item.product?.price === 'number' && !isNaN(item.product?.price)) ? item.product.price : 0;
                    console.log('🟣 [BACKEND] Calcolo totale: item', {
                        productId: item.product?._id,
                        name: item.product?.name,
                        price,
                        quantity: item.quantity,
                        subtotale: price * item.quantity
                    });
                    return sum + (price * item.quantity);
                }, 0);
        console.log('🟣 [BACKEND] Totale carrello calcolato:', calculatedCartTotal);

    // PRIORITÀ: Controlla prima se ci sono tariffe avanzate configurate
    // Le tariffe avanzate hanno priorità sulla spedizione gratuita globale
    const hasAdvancedRates = vendorShippingSettings.shippingRates && vendorShippingSettings.shippingRates.length > 0;
    
    console.log('🟢 [BACKEND] Ha tariffe avanzate?', hasAdvancedRates);
    console.log('🟢 [BACKEND] Numero tariffe:', vendorShippingSettings.shippingRates?.length || 0);
    
    // Se non ci sono tariffe avanzate, applica le regole globali
    if (!hasAdvancedRates) {
        // Se il venditore offre spedizione gratuita globale
        if (vendorShippingSettings.freeShipping === true) {
            return {
                shippingCost: 0,
                appliedRate: null,
                freeShipping: true,
                message: 'Spedizione gratuita',
                shippingOptions: []
            };
        }
        
        // Usa la tariffa predefinita
        const defaultRate = vendorShippingSettings.defaultShippingRate || 0;
        return {
            shippingCost: defaultRate,
            appliedRate: {
                type: 'default',
                rate: defaultRate
            },
            freeShipping: defaultRate === 0,
            message: defaultRate > 0 ? `Tariffa standard: €${defaultRate.toFixed(2)}` : 'Spedizione gratuita',
            shippingOptions: []
        };
    }

    // Trova la tariffa applicabile in base a paese, peso, totale carrello
    let applicableRates = [];
    const country = shippingAddress?.country || 'Italia';
    const region = shippingAddress?.state || '';

    for (const rate of vendorShippingSettings.shippingRates) {
        console.log('🟡 [BACKEND] ===== Controllo tariffa:', rate.name || 'senza nome');
        console.log('🟡 [BACKEND] Paese tariffa:', rate.country);
        console.log('🟡 [BACKEND] Paese richiesto:', country);
        console.log('🟡 [BACKEND] Opzioni spedizione tariffa:', rate.shippingOptions);
        
        // 1. Verifica se la tariffa si applica al paese di destinazione
        if (rate.country && rate.country !== country) {
            console.log('❌ [BACKEND] Tariffa scartata: paese non corrisponde');
            continue; // Il paese non corrisponde
        }
        console.log('✅ [BACKEND] Paese corretto!');

        // 1.1 Se il paese è Italia, verifica i flag delle isole
        if (country === 'Italia' && region) {
            const isSardegnaSicilia = region === 'Sardegna' || region === 'Sicilia';
            
            // Se la tariffa è per Sardegna/Sicilia ma la regione non è una di queste, skip
            if (rate.italiaSardegnaSicilia && !isSardegnaSicilia) {
                continue;
            }
            
            // Se la tariffa è per Italia Isole escluse ma la regione è Sardegna/Sicilia, skip
            if (rate.italiaIsoleEscluse && isSardegnaSicilia) {
                continue;
            }
        }

        // 2. Verifica il range del totale carrello
        if (!rate.anyCartTotal) {
            const cartTotalFrom = parseFloat(rate.cartTotalFrom) || 0;
            const cartTotalTo = parseFloat(rate.cartTotalTo) || Infinity;
            
            console.log(`🔍 [BACKEND] Controllo totale: carrello=€${calculatedCartTotal}, range=€${cartTotalFrom}-€${cartTotalTo}`);
            
            if (calculatedCartTotal < cartTotalFrom || calculatedCartTotal > cartTotalTo) {
                console.log('❌ [BACKEND] Tariffa scartata: totale fuori range');
                continue; // Il totale carrello non rientra nel range
            }
        }

        // 3. Verifica il range del peso carrello
        // Se anyCartWeight è true OPPURE se i campi peso non sono impostati, salta il controllo
        const hasWeightRange = rate.cartWeightFrom || rate.cartWeightTo;
        if (!rate.anyCartWeight && hasWeightRange) {
            const cartWeightFrom = parseFloat(rate.cartWeightFrom) || 0;
            const cartWeightTo = parseFloat(rate.cartWeightTo) || Infinity;
            
            console.log(`🔍 [BACKEND] Controllo peso: carrello=${totalWeight}kg, range=${cartWeightFrom}-${cartWeightTo}kg`);
            
            if (totalWeight < cartWeightFrom || totalWeight > cartWeightTo) {
                console.log('❌ [BACKEND] Tariffa scartata: peso fuori range');
                continue; // Il peso carrello non rientra nel range
            }
        }

        // 4. Se arriviamo qui, la tariffa è applicabile
        // Restituisci le opzioni di spedizione disponibili
        console.log('✅ [BACKEND] Tariffa applicabile! Controllo opzioni...');
        if (rate.shippingOptions && Array.isArray(rate.shippingOptions) && rate.shippingOptions.length > 0) {
            console.log('🟢 [BACKEND] Trovate opzioni di spedizione:', rate.shippingOptions);
            const validOptions = rate.shippingOptions
                .filter(opt => opt.shippingName && opt.shippingPrice !== undefined && opt.shippingPrice !== null)
                .map(opt => ({
                    name: opt.shippingName,
                    price: parseFloat(opt.shippingPrice) || 0,
                    description: `${opt.shippingName} - €${parseFloat(opt.shippingPrice || 0).toFixed(2)}`
                }));

            if (validOptions.length > 0) {
                applicableRates.push({
                    rate: rate,
                    shippingOptions: validOptions
                });
            }
        }
    }

    // Se nessuna tariffa è applicabile, usa quella predefinita
    if (applicableRates.length === 0) {
        console.log('⚠️ [BACKEND] Nessuna tariffa applicabile, uso tariffa predefinita');
        const defaultRate = vendorShippingSettings.defaultShippingRate || 0;
        return {
            shippingCost: defaultRate,
            appliedRate: {
                type: 'default',
                rate: defaultRate
            },
            freeShipping: defaultRate === 0,
            message: defaultRate > 0 ? `Tariffa standard: €${defaultRate.toFixed(2)}` : 'Spedizione gratuita',
            shippingOptions: []
        };
    }

    // Restituisci tutte le opzioni disponibili
    // Il cliente potrà scegliere quale opzione di spedizione preferisce
    const allShippingOptions = [];
    applicableRates.forEach(ar => {
        allShippingOptions.push(...ar.shippingOptions);
    });

    console.log('🟢 [BACKEND] Opzioni finali disponibili:', allShippingOptions);

    // Per default, selezioniamo l'opzione più economica
    const cheapestOption = allShippingOptions.reduce((min, opt) => 
        opt.price < min.price ? opt : min
    , allShippingOptions[0]);

    return {
        shippingCost: cheapestOption.price,
        appliedRate: {
            type: 'custom',
            selectedOption: cheapestOption,
            country: country,
            totalWeight: totalWeight,
            cartTotal: calculatedCartTotal
        },
        freeShipping: cheapestOption.price === 0,
        message: cheapestOption.description,
        shippingOptions: allShippingOptions
    };
};

/**
 * Calcola la spedizione per carrello multi-venditore
 * @param {Array} itemsByVendor - Array di {vendorId, items, vendorShippingSettings}
 * @param {Object} shippingAddress - Indirizzo di spedizione
 * @param {Number} totalCartValue - Totale del carrello (opzionale)
 * @returns {Object} - { totalShipping, vendorShippingCosts }
 */
export const calculateMultiVendorShipping = (itemsByVendor, shippingAddress, totalCartValue = 0) => {
    const vendorShippingCosts = {};
    let totalShipping = 0;

    itemsByVendor.forEach(({ vendorId, items, vendorShippingSettings }) => {
        // Calcola il subtotale per questo venditore
        const vendorCartTotal = items.reduce((sum, item) => {
            const price = item.product?.price || 0;
            console.log('💰 [BACKEND] Calcolo prezzo item:', {
                productId: item.product?._id,
                name: item.product?.name,
                price: price,
                quantity: item.quantity,
                subtotale: price * item.quantity
            });
            return sum + (price * item.quantity);
        }, 0);
        
        console.log('💰 [BACKEND] Totale carrello venditore:', vendorCartTotal);

        const shippingResult = calculateShipping(vendorShippingSettings, {
            items,
            shippingAddress,
            cartTotal: vendorCartTotal
        });

        vendorShippingCosts[vendorId] = shippingResult;
        totalShipping += shippingResult.shippingCost;
    });

    return {
        totalShipping,
        vendorShippingCosts,
        isFreeShipping: totalShipping === 0
    };
};
