const { Pool } = require('pg');
const logger = require('./logger');

// Konfigurasi pool dengan retry dan timeout yang lebih baik
const createPool = () => {
  logger.info(`Creating new database connection pool...`);

  // Log informasi koneksi (tanpa password)
  logger.info(`Database connection info: user=${process.env.PG_USER}, host=${process.env.PG_HOST}, database=${process.env.PG_DATABASE}, port=${process.env.PG_PORT}`);

  const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: parseInt(process.env.PG_PORT),
    ssl: false, // Explicitly disable SSL for filess.io
    max: 1, // Reduce to 1 connection for free tier limits
    min: 0, // No minimum connections
    idleTimeoutMillis: 10000, // 10 seconds - close idle connections faster
    connectionTimeoutMillis: 10000, // 10 seconds - faster timeout
    acquireTimeoutMillis: 10000, // 10 seconds - timeout for acquiring connection
    keepAlive: false, // Disable keep-alive to reduce connection overhead
    allowExitOnIdle: true // Allow pool to close when idle
  });

  // Pantau status pool
  pool.on('connect', () => {
    logger.info('New client connected to PostgreSQL');
  });

  pool.on('remove', () => {
    logger.debug('Client removed from pool');
  });

  pool.on('error', (err) => {
    logger.error(`PostgreSQL pool error: ${err.message}`);
  });

  return pool;
};

// Buat pool awal
let pool = createPool();
let isConnected = false;

// Fungsi untuk mencoba query dengan retry
const queryWithRetry = async (text, params = [], maxRetries = 3) => {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    let client = null;

    try {
      // Coba dapatkan client dari pool dengan timeout
      client = await Promise.race([
        pool.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 30000)
        )
      ]);

      const start = Date.now();
      const result = await Promise.race([
        client.query(text, params),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), 30000)
        )
      ]);
      const duration = Date.now() - start;

      // Jika berhasil, tandai koneksi sebagai terhubung
      isConnected = true;

      logger.debug(`Executed query in ${duration}ms: ${text.substring(0, 50)}...`);
      return result;
    } catch (error) {
      lastError = error;

      // Log error
      logger.error(`Database query error (attempt ${retries + 1}/${maxRetries}): ${error.message}`);

      // Jika koneksi timeout atau terputus, coba buat pool baru
      if (error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT' ||
          error.code === '57P01' || // admin shutdown
          error.code === '57P02' || // crash shutdown
          error.code === '57P03' || // cannot connect now
          error.message.includes('Connection terminated unexpectedly') ||
          error.message.includes('Connection timeout') ||
          error.message.includes('Query timeout')) {

        logger.error(`Database connection error: ${error.message}. Recreating pool...`);
        isConnected = false;

        try {
          // Tutup pool lama jika masih ada
          if (pool) {
            await pool.end().catch(err => {
              logger.error(`Error closing old pool: ${err.message}`);
            });
          }
        } catch (endError) {
          logger.error(`Error ending pool: ${endError.message}`);
        }

        // Buat pool baru
        pool = createPool();

        retries++;
        const backoffTime = 3000 * Math.pow(2, retries); // Exponential backoff dengan waktu lebih lama
        logger.info(`Retrying with new pool (${retries}/${maxRetries}) after ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }

      // Error lain, lempar ke atas setelah retry
      retries++;
      if (retries < maxRetries) {
        const backoffTime = 3000 * Math.pow(2, retries);
        logger.info(`Retrying query (${retries}/${maxRetries}) after ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }

      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Jika semua retry gagal
  throw lastError || new Error('Failed to connect to database after multiple retries');
};

// Fungsi query dengan retry
const query = async (text, params = []) => {
  return queryWithRetry(text, params);
};

// Fungsi untuk menjalankan beberapa query dalam satu transaksi dengan retry
const transaction = async (callback) => {
  let retries = 0;
  const maxRetries = 3;
  let lastError;

  while (retries < maxRetries) {
    let client = null;

    try {
      // Coba dapatkan client dari pool dengan timeout
      client = await Promise.race([
        pool.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 30000)
        )
      ]);

      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');

      // Jika berhasil, tandai koneksi sebagai terhubung
      isConnected = true;

      return result;
    } catch (error) {
      lastError = error;

      // Log error
      logger.error(`Transaction error (attempt ${retries + 1}/${maxRetries}): ${error.message}`);

      // Coba rollback jika client ada
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          logger.error(`Error during rollback: ${rollbackError.message}`);
        }
      }

      // Jika koneksi timeout atau terputus, coba buat pool baru
      if (error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT' ||
          error.code === '57P01' || // admin shutdown
          error.code === '57P02' || // crash shutdown
          error.code === '57P03' || // cannot connect now
          error.message.includes('Connection terminated unexpectedly') ||
          error.message.includes('Connection timeout') ||
          error.message.includes('Query timeout')) {

        logger.error(`Database connection error during transaction: ${error.message}. Recreating pool...`);
        isConnected = false;

        try {
          // Tutup pool lama jika masih ada
          if (pool) {
            await pool.end().catch(err => {
              logger.error(`Error closing old pool: ${err.message}`);
            });
          }
        } catch (endError) {
          logger.error(`Error ending pool: ${endError.message}`);
        }

        // Buat pool baru
        pool = createPool();

        retries++;
        const backoffTime = 3000 * Math.pow(2, retries); // Exponential backoff dengan waktu lebih lama
        logger.info(`Retrying transaction with new pool (${retries}/${maxRetries}) after ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }

      // Error lain, lempar ke atas setelah retry
      retries++;
      if (retries < maxRetries) {
        const backoffTime = 3000 * Math.pow(2, retries);
        logger.info(`Retrying transaction (${retries}/${maxRetries}) after ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }

      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Jika semua retry gagal
  throw lastError || new Error('Failed to complete transaction after multiple retries');
};

// Fungsi untuk menutup pool saat aplikasi berhenti
const closePool = async () => {
  logger.info('Closing database pool...');
  try {
    if (pool) {
      await pool.end();
      logger.info('Database pool closed');
    }
  } catch (error) {
    logger.error(`Error closing pool: ${error.message}`);
  }
};

// Fungsi untuk mengecek kesehatan koneksi database
const checkHealth = async () => {
  try {
    const result = await query('SELECT NOW()');
    isConnected = true;
    return {
      status: 'healthy',
      timestamp: result.rows[0].now,
      connected: isConnected
    };
  } catch (error) {
    isConnected = false;
    logger.error(`Database health check failed: ${error.message}`);
    return {
      status: 'unhealthy',
      error: error.message,
      connected: isConnected
    };
  }
};

// Fungsi untuk mencoba koneksi awal dengan retry
const initializeConnection = async () => {
  let retries = 0;
  const maxRetries = 5;

  while (retries < maxRetries) {
    try {
      logger.info(`Attempting initial database connection (${retries + 1}/${maxRetries})...`);
      await query('SELECT 1');
      logger.info('Initial database connection successful');
      return true;
    } catch (error) {
      logger.error(`Initial connection attempt failed: ${error.message}`);
      retries++;

      if (retries < maxRetries) {
        const backoffTime = 3000 * Math.pow(2, retries);
        logger.info(`Retrying initial connection in ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }

  logger.error('Failed to establish initial database connection after multiple retries');
  return false;
};

module.exports = { query, transaction, closePool, checkHealth, initializeConnection };




