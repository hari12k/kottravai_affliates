const db = require('../db');

/**
 * HARDENED DETERMINISTIC SHIPPING SERVICE
 * Single Source of Truth for Shipping Rules with Locking Cache
 */

let zoneCache = null;
let lastUpdate = 0;
let refreshPromise = null;
const CACHE_TTL = 3600000; // 1 hour

/**
 * Refreshes the in-memory cache of shipping zones.
 */
const refreshShippingCache = async () => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const res = await db.query(
                "SELECT * FROM shipping_zones WHERE is_active = true ORDER BY is_fallback ASC"
            );
            
            const zones = res.rows;

            if (!zones || zones.length === 0) {
                console.error('❌ CRITICAL: No shipping zones found in database.');
                throw new Error('SHIPPING_CONFIG_CRITICAL_MISSING');
            }

            zoneCache = zones;
            lastUpdate = Date.now();
            console.log(`📦 Shipping zones cache reloaded successfully at ${new Date().toISOString()}`);
            return zoneCache;
        } catch (error) {
            console.error('❌ Failed to load shipping zones into cache:', error.message);
            throw new Error('Shipping configuration unavailable');
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

/**
 * Safely calculates shipping charges.
 */
const calculateShipping = async (state, cartTotal) => {
    if (!zoneCache || (Date.now() - lastUpdate > CACHE_TTL)) {
        await refreshShippingCache();
    }

    const amount = Number(cartTotal);
    const normalizedInput = state ? state.trim().toLowerCase() : '';

    let matchedZone = zoneCache.find(z => {
        if (!z.states || !Array.isArray(z.states)) return false;
        return z.states.some(s => s.trim().toLowerCase() === normalizedInput);
    });

    if (!matchedZone) {
        matchedZone = zoneCache.find(z => z.is_fallback === true);
    }

    if (!matchedZone) {
        throw new Error(`Shipping unavailable for state: ${state}. No fallback zone configured.`);
    }

    const threshold = parseFloat(matchedZone.free_shipping_threshold);
    const charge = parseFloat(matchedZone.shipping_charge);
    
    const isFree = amount >= threshold;
    const finalCharge = isFree ? 0 : charge;

    return {
        zoneName: matchedZone.zone_name,
        shippingFee: finalCharge,
        isFreeShipping: isFree,
        threshold: threshold,
        currency: "INR"
    };
};

module.exports = {
    calculateShipping,
    refreshShippingCache
};
