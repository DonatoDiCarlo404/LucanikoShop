/**
 * Calcola il costo di spedizione in base alle impostazioni del venditore
 * @param {Object} vendorShippingSettings - Impostazioni spedizione del venditore (User.shopSettings.shipping)
 * @param {Object} cartData - Dati del carrello (items, peso totale, destinazione)
 * @returns {Object} - { shippingCost, appliedRate, freeShipping }
 */
export const calculateShipping = (vendorShippingSettings, cartData) => {
    const { items, shippingAddress } = cartData;

    // Default: nessuna spedizione configurata
    if (!vendorShippingSettings) {
        return {
            shippingCost: 0,
            appliedRate: null,
            freeShipping: false,
            message: 'Spedizione non configurata dal venditore'
        };
    }

    // Se il venditore offre spedizione gratuita
    if (vendorShippingSettings.freeShipping === true) {
        return {
            shippingCost: 0,
            appliedRate: null,
            freeShipping: true,
            message: 'Spedizione gratuita'
        };
    }

    // Calcola peso totale del carrello
    const totalWeight = items.reduce((sum, item) => {
        const weight = item.product?.weight || 0;
        return sum + (weight * item.quantity);
    }, 0);

    // Se non ci sono tariffe avanzate configurate, usa la tariffa predefinita
    if (!vendorShippingSettings.shippingRates || vendorShippingSettings.shippingRates.length === 0) {
        const defaultRate = vendorShippingSettings.defaultShippingRate || 0;
        return {
            shippingCost: defaultRate,
            appliedRate: {
                type: 'default',
                rate: defaultRate
            },
            freeShipping: false,
            message: defaultRate > 0 ? `Tariffa standard: €${defaultRate.toFixed(2)}` : 'Spedizione gratuita'
        };
    }

    // Trova la tariffa applicabile in base a peso e zona
    let applicableRate = null;
    const country = shippingAddress?.country || 'Italia';
    const state = shippingAddress?.state || '';

    for (const rate of vendorShippingSettings.shippingRates) {
        // Verifica se la tariffa si applica alla zona di destinazione
        const zones = rate.zones ? rate.zones.split(',').map(z => z.trim().toLowerCase()) : [];
        const countryMatch = zones.some(zone => 
            country.toLowerCase().includes(zone) || 
            zone.includes(country.toLowerCase())
        );
        const stateMatch = state && zones.some(zone => 
            state.toLowerCase().includes(zone) || 
            zone.includes(state.toLowerCase())
        );

        if (!countryMatch && !stateMatch && zones.length > 0) {
            continue; // La zona non corrisponde
        }

        // Verifica il tipo di tariffa
        if (rate.type === 'fixed') {
            applicableRate = {
                type: 'fixed',
                rate: rate.cost,
                description: `Tariffa fissa per ${rate.zones || 'tutte le zone'}`
            };
            break;
        } else if (rate.type === 'weight') {
            // Verifica se il peso del carrello rientra nell'intervallo
            const minWeight = rate.minWeight || 0;
            const maxWeight = rate.maxWeight || Infinity;

            if (totalWeight >= minWeight && totalWeight <= maxWeight) {
                applicableRate = {
                    type: 'weight',
                    rate: rate.cost,
                    minWeight,
                    maxWeight,
                    totalWeight,
                    description: `Tariffa per peso ${minWeight}kg - ${maxWeight === Infinity ? '∞' : maxWeight + 'kg'}`
                };
                break;
            }
        } else if (rate.type === 'zone') {
            applicableRate = {
                type: 'zone',
                rate: rate.cost,
                zones: rate.zones,
                description: `Tariffa per zona: ${rate.zones}`
            };
            break;
        }
    }

    // Se nessuna tariffa è applicabile, usa quella predefinita
    if (!applicableRate) {
        const defaultRate = vendorShippingSettings.defaultShippingRate || 0;
        return {
            shippingCost: defaultRate,
            appliedRate: {
                type: 'default',
                rate: defaultRate
            },
            freeShipping: defaultRate === 0,
            message: defaultRate > 0 ? `Tariffa standard: €${defaultRate.toFixed(2)}` : 'Spedizione gratuita'
        };
    }

    return {
        shippingCost: applicableRate.rate,
        appliedRate: applicableRate,
        freeShipping: applicableRate.rate === 0,
        message: applicableRate.description
    };
};

/**
 * Calcola la spedizione per carrello multi-venditore
 * @param {Array} itemsByVendor - Array di {vendorId, items, vendorShippingSettings}
 * @param {Object} shippingAddress - Indirizzo di spedizione
 * @returns {Object} - { totalShipping, vendorShippingCosts }
 */
export const calculateMultiVendorShipping = (itemsByVendor, shippingAddress) => {
    const vendorShippingCosts = {};
    let totalShipping = 0;

    itemsByVendor.forEach(({ vendorId, items, vendorShippingSettings }) => {
        const shippingResult = calculateShipping(vendorShippingSettings, {
            items,
            shippingAddress
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
