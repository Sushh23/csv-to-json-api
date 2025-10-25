const pool = require('../config/database');

class UserService {
  /**
   * Inserts a single user into the database
   * @param {Object} user 
   * @returns {Promise<Object>} 
   */
  static async insertUser(user) {
    const query = `
      INSERT INTO users (name, age, address, additional_info)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      user.name,
      user.age,
      user.address ? JSON.stringify(user.address) : null,
      user.additional_info ? JSON.stringify(user.additional_info) : null
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to insert user: ${error.message}`);
    }
  }

  /**
   * Batch inserts users into the database
   * Uses a single transaction for better performance
   * @param {Array} users - Array of user objects
   * @returns {Promise<Object>} Insert statistics
   */
  static async batchInsertUsers(users) {
    const client = await pool.connect();
    let insertedCount = 0;
    let failedCount = 0;
    const errors = [];

    try {

      await client.query('BEGIN');

      const query = `
        INSERT INTO users (name, age, address, additional_info)
        VALUES ($1, $2, $3, $4)
      `;

      for (const user of users) {
        try {
          const values = [
            user.name,
            user.age,
            user.address ? JSON.stringify(user.address) : null,
            user.additional_info ? JSON.stringify(user.additional_info) : null
          ];

          await client.query(query, values);
          insertedCount++;
        } catch (error) {
          failedCount++;
          errors.push({
            user: user.name,
            error: error.message
          });
          console.error(`Failed to insert user ${user.name}:`, error.message);
        }
      }

      // Commit transaction
      await client.query('COMMIT');

      return {
        success: true,
        inserted: insertedCount,
        failed: failedCount,
        errors: errors.length > 0 ? errors : null
      };
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw new Error(`Batch insert failed: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Optimized batch insert using unnest for large datasets
   * Handles 50000+ records efficiently
   * @param {Array} users - Array of user objects
   * @returns {Promise<Object>} Insert statistics
   */
  static async optimizedBatchInsert(users) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Split into chunks to avoid parameter limits
      const chunkSize = 1000;
      let totalInserted = 0;

      for (let i = 0; i < users.length; i += chunkSize) {
        const chunk = users.slice(i, i + chunkSize);
        
        // Build arrays for unnest
        const names = [];
        const ages = [];
        const addresses = [];
        const additionalInfos = [];

        chunk.forEach(user => {
          names.push(user.name);
          ages.push(user.age);
          addresses.push(user.address ? JSON.stringify(user.address) : null);
          additionalInfos.push(user.additional_info ? JSON.stringify(user.additional_info) : null);
        });

        // Use unnest for bulk insert
        const query = `
          INSERT INTO users (name, age, address, additional_info)
          SELECT * FROM UNNEST($1::varchar[], $2::int[], $3::jsonb[], $4::jsonb[])
        `;

        const result = await client.query(query, [names, ages, addresses, additionalInfos]);
        totalInserted += result.rowCount;

        console.log(`Inserted chunk ${Math.floor(i / chunkSize) + 1}: ${result.rowCount} records`);
      }

      await client.query('COMMIT');

      return {
        success: true,
        inserted: totalInserted,
        failed: 0,
        errors: null
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Optimized batch insert failed: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Clears all users from the database
   * @returns {Promise<number>} Number of deleted rows
   */
  static async clearAllUsers() {
    const query = 'DELETE FROM users';
    
    try {
      const result = await pool.query(query);
      return result.rowCount;
    } catch (error) {
      throw new Error(`Failed to clear users: ${error.message}`);
    }
  }

  /**
   * Gets all users from the database
   * @returns {Promise<Array>} Array of users
   */
  static async getAllUsers() {
    const query = 'SELECT * FROM users ORDER BY id';
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  /**
   * Gets user count
   * @returns {Promise<number>} Total number of users
   */
  static async getUserCount() {
    const query = 'SELECT COUNT(*) as count FROM users';
    
    try {
      const result = await pool.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Failed to get user count: ${error.message}`);
    }
  }
}

module.exports = UserService;