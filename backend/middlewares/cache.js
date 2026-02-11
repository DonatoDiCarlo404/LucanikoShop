import { getRedisClient, isRedisAvailable } from '../config/redis.js';

/**
 * Middleware di caching per Redis
 * @param {number} duration - Durata cache in secondi (default: 5 minuti)
 * @param {function} keyGenerator - Funzione per generare la chiave cache (default: usa URL)
 */
const cache = (duration = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Se Redis non è disponibile, salta la cache
    if (!isRedisAvailable()) {
      return next();
    }

    try {
      const redisClient = getRedisClient();
      
      // Genera la chiave cache
      const cacheKey = keyGenerator 
        ? keyGenerator(req) 
        : `cache:${req.originalUrl || req.url}`;

      // Cerca nella cache
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Override della funzione res.json per salvare in cache
      const originalJson = res.json.bind(res);
      
      res.json = (data) => {
        // Salva in cache solo se la risposta è 200
        if (res.statusCode === 200 && data) {
          redisClient.setEx(cacheKey, duration, JSON.stringify(data))
            .then(() => console.log(`💾 Salvato in cache: ${cacheKey} (${duration}s)`))
            .catch(err => console.error('Errore salvataggio cache:', err));
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Errore middleware cache:', error);
      next(); // In caso di errore, procedi senza cache
    }
  };
};

/**
 * Invalida una specifica chiave cache
 */
const invalidateCache = async (pattern) => {
  if (!isRedisAvailable()) return;

  try {
    const redisClient = getRedisClient();
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🗑️ Cache invalidata: ${keys.length} chiavi (${pattern})`);
    }
  } catch (error) {
    console.error('Errore invalidazione cache:', error);
  }
};

/**
 * Invalida tutta la cache
 */
const flushCache = async () => {
  if (!isRedisAvailable()) return;

  try {
    const redisClient = getRedisClient();
    await redisClient.flushAll();
    console.log('🗑️ Cache completamente svuotata');
  } catch (error) {
    console.error('Errore flush cache:', error);
  }
};

export { cache, invalidateCache, flushCache };
