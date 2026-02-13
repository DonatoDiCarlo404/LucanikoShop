/**
 * Calcola il costo di spedizione in base alle impostazioni del venditore
 * @param {Object} vendorShippingSettings - Impostazioni spedizione del venditore (User.shopSettings.shipping)
 * @param {Object} cartData - Dati del carrello (items, peso totale, destinazione, cartTotal)
 * @returns {Object} - { shippingCost, appliedRate, freeShipping, shippingOptions }
 */
export const calculateShipping = (vendorShippingSettings, cartData) => {
    const { items, shippingAddress, cartTotal } = cartData;

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
    const totalWeight = items.reduce((sum, item) => {
        const weight = item.product?.weight || 0;
        return sum + (weight * item.quantity);
    }, 0);

    // Calcola totale carrello se non passato
    const calculatedCartTotal = (typeof cartTotal === 'number' && !isNaN(cartTotal))
        ? cartTotal
        : items.reduce((sum, item) => {
                const price = (typeof item.price === 'number' && !isNaN(item.price)) ? item.price : 0;
                return sum + (price * item.quantity);
            }, 0);

    // PRIORITÀ: Controlla prima se ci sono tariffe avanzate configurate
    const hasAdvancedRates = vendorShippingSettings.shippingRates && vendorShippingSettings.shippingRates.length > 0;
    
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
        // 1. Verifica se la tariffa si applica al paese di destinazione
        if (rate.country && rate.country !== country) {
            continue;
        }

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
            const cartTotalFrom = parseFloat((rate.cartTotalFrom || '0').toString().replace(',', '.')) || 0;
            const cartTotalTo = parseFloat((rate.cartTotalTo || '').toString().replace(',', '.')) || Infinity;
            
            if (calculatedCartTotal < cartTotalFrom || calculatedCartTotal > cartTotalTo) {
                continue;
            }
        }

        // 3. Verifica il range del peso carrello
        const hasWeightRange = rate.cartWeightFrom || rate.cartWeightTo;
        if (!rate.anyCartWeight && hasWeightRange) {
            const cartWeightFrom = parseFloat((rate.cartWeightFrom || '0').toString().replace(',', '.')) || 0;
            const cartWeightTo = parseFloat((rate.cartWeightTo || '').toString().replace(',', '.')) || Infinity;
            
            if (totalWeight < cartWeightFrom || totalWeight > cartWeightTo) {
                continue;
            }
        }

        // Restituisci le opzioni di spedizione disponibili
        if (rate.shippingOptions && Array.isArray(rate.shippingOptions) && rate.shippingOptions.length > 0) {
            const validOptions = rate.shippingOptions
                .filter(opt => opt.shippingPrice !== undefined && opt.shippingPrice !== null)
                .map(opt => {
                    const price = parseFloat((opt.shippingPrice || '0').toString().replace(',', '.')) || 0;
                    const name = opt.shippingName || rate.name || 'Spedizione';
                    return {
                        name: name,
                        price: price,
                        description: `${name} - €${price.toFixed(2)}`
                    };
                });
            
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
    const allShippingOptions = [];
    applicableRates.forEach(ar => {
        allShippingOptions.push(...ar.shippingOptions);
    });

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
 * @param {Number} totalCartValue - Totale del carrello scontato (per range spedizione)
 * @returns {Object} - { totalShipping, vendorShippingCosts }
 */
export const calculateMultiVendorShipping = (itemsByVendor, shippingAddress, totalCartValue = 0) => {
    const vendorShippingCosts = {};
    let totalShipping = 0;

    itemsByVendor.forEach(({ vendorId, vendorName, items, vendorShippingSettings }) => {
        // Calcola il subtotale per questo venditore usando il prezzo dal carrello
        const vendorCartTotal = items.reduce((sum, item) => {
            const price = item.price || 0; // Usa il prezzo dal carrello (può essere scontato)
            return sum + (price * item.quantity);
        }, 0);

        const shippingResult = calculateShipping(vendorShippingSettings, {
            items,
            shippingAddress,
            cartTotal: vendorCartTotal
        });

        vendorShippingCosts[vendorId] = {
            ...shippingResult,
            vendorName: vendorName || 'Venditore'
        };
        totalShipping += shippingResult.shippingCost;
    });

    return {
        totalShipping,
        vendorShippingCosts,
        isFreeShipping: totalShipping === 0
    };
};
