const { pool } = require('../config/database');
const logger = require('../config/logger');

// Fungsi untuk memeriksa dan melaporkan status database
const checkDatabaseStatus = async () => {
  try {
    logger.info('Checking database status...');
    
    // Periksa koneksi
    const client = await pool.connect();
    logger.info('Database connection successful');
    
    // Periksa pengguna dan database
    const userResult = await client.query('SELECT current_user, current_database()');
    logger.info(`Current user: ${userResult.rows[0].current_user}`);
    logger.info(`Current database: ${userResult.rows[0].current_database}`);
    
    // Periksa schema yang tersedia
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT LIKE 'pg_%' 
      AND schema_name != 'information_schema'
    `);
    
    if (schemasResult.rows.length > 0) {
      logger.info(`Available schemas: ${schemasResult.rows.map(row => row.schema_name).join(', ')}`);
    } else {
      logger.warn('No accessible schemas found');
    }
    
    // Periksa tabel di setiap schema
    for (const schemaRow of schemasResult.rows) {
      const schema = schemaRow.schema_name;
      try {
        const tablesResult = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1
        `, [schema]);
        
        if (tablesResult.rows.length > 0) {
          logger.info(`Tables in schema ${schema}: ${tablesResult.rows.map(row => row.table_name).join(', ')}`);
        } else {
          logger.info(`No tables found in schema ${schema}`);
        }
      } catch (err) {
        logger.error(`Error checking tables in schema ${schema}: ${err.message}`);
      }
    }
    
    // Periksa izin pengguna
    try {
      const permissionsResult = await client.query(`
        SELECT 
          table_schema, 
          table_name, 
          privilege_type
        FROM 
          information_schema.table_privileges
        WHERE 
          grantee = current_user
        ORDER BY 
          table_schema, 
          table_name, 
          privilege_type
      `);
      
      if (permissionsResult.rows.length > 0) {
        logger.info(`User has ${permissionsResult.rows.length} privileges on tables`);
        
        // Kelompokkan izin berdasarkan schema dan tabel
        const permissionsBySchema = {};
        for (const row of permissionsResult.rows) {
          const { table_schema, table_name, privilege_type } = row;
          if (!permissionsBySchema[table_schema]) {
            permissionsBySchema[table_schema] = {};
          }
          if (!permissionsBySchema[table_schema][table_name]) {
            permissionsBySchema[table_schema][table_name] = [];
          }
          permissionsBySchema[table_schema][table_name].push(privilege_type);
        }
        
        // Log izin
        for (const schema in permissionsBySchema) {
          for (const table in permissionsBySchema[schema]) {
            const privileges = permissionsBySchema[schema][table].join(', ');
            logger.info(`Privileges on ${schema}.${table}: ${privileges}`);
          }
        }
      } else {
        logger.warn('User has no privileges on any tables');
      }
    } catch (err) {
      logger.error(`Error checking user privileges: ${err.message}`);
    }
    
    client.release();
    logger.info('Database status check completed');
  } catch (err) {
    logger.error(`Database status check failed: ${err.message}`);
  }
};

// Tambahkan fungsi untuk membuat tabel jika belum ada
const ensureTablesExist = async () => {
  let client;
  try {
    logger.info('Checking and creating necessary tables if they don\'t exist...');
    
    client = await pool.connect();
    
    // Periksa dan buat tabel posts jika belum ada
    try {
      // Cek apakah tabel posts sudah ada
      const checkResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'posts'
        );
      `);
      
      const tableExists = checkResult.rows[0].exists;
      
      if (!tableExists) {
        logger.info('Creating posts table...');
        await client.query(`
          CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            author_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        logger.info('Posts table created successfully');
      } else {
        logger.info('Posts table already exists');
      }
    } catch (err) {
      logger.error(`Error creating posts table: ${err.message}`);
      logger.error(`Stack trace: ${err.stack}`);
    }
    
    // Periksa dan buat tabel likes jika belum ada
    try {
      // Cek apakah tabel likes sudah ada
      const checkResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'likes'
        );
      `);
      
      const tableExists = checkResult.rows[0].exists;
      
      if (!tableExists) {
        logger.info('Creating likes table...');
        await client.query(`
          CREATE TABLE likes (
            id SERIAL PRIMARY KEY,
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(post_id, user_id)
          )
        `);
        logger.info('Likes table created successfully');
      } else {
        logger.info('Likes table already exists');
      }
    } catch (err) {
      logger.error(`Error creating likes table: ${err.message}`);
      logger.error(`Stack trace: ${err.stack}`);
    }
    
    // Periksa dan buat tabel comments jika belum ada
    try {
      // Cek apakah tabel comments sudah ada
      const checkResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'comments'
        );
      `);
      
      const tableExists = checkResult.rows[0].exists;
      
      if (!tableExists) {
        logger.info('Creating comments table...');
        await client.query(`
          CREATE TABLE comments (
            id SERIAL PRIMARY KEY,
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        logger.info('Comments table created successfully');
      } else {
        logger.info('Comments table already exists');
      }
    } catch (err) {
      logger.error(`Error creating comments table: ${err.message}`);
      logger.error(`Stack trace: ${err.stack}`);
    }
    
    logger.info('Database tables check completed');
  } catch (err) {
    logger.error(`Database tables check failed: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Fungsi untuk mengatur schema yang benar
const setCorrectSchema = async () => {
  let client;
  try {
    logger.info('Setting correct schema...');
    
    client = await pool.connect();
    
    // Set search_path ke schema pulihHati (dengan H kapital)
    await client.query(`SET search_path TO "pulihHati", public`);
    logger.info('Successfully set search_path to: pulihHati, public');
    
    // Cek search_path yang aktif
    const searchPathResult = await client.query(`SHOW search_path`);
    logger.info(`Current search_path: ${JSON.stringify(searchPathResult.rows[0])}`);
    
    // Cek tabel di schema pulihHati
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'pulihHati'
    `);
    
    logger.info(`Tables in schema pulihHati: ${tablesResult.rows.map(row => row.table_name).join(', ')}`);
    
    return true;
  } catch (err) {
    logger.error(`Error setting correct schema: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = { 
  checkDatabaseStatus,
  ensureTablesExist,
  setCorrectSchema
};




