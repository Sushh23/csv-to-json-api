const express = require('express');
const CSVParser = require('../services/csvParser');
const ObjectBuilder = require('../utils/objectBuilder');
const UserService = require('../services/userService');
const AgeDistribution = require('../utils/ageDistribution');
const pool = require('../config/database');

const router = express.Router();

/**
 * POST /api/upload/process
 * Main endpoint to process CSV file and upload to database
 */
router.post('/process', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log(' Starting CSV processing...');
    

    const csvPath = process.env.CSV_FILE_PATH;
    console.log(` Reading CSV from: ${csvPath}`);
    
    const records = await CSVParser.parseCSV(csvPath);
    console.log(` Parsed ${records.length} records from CSV`);

    console.log(' Converting to nested objects...');
    const processedUsers = ObjectBuilder.processRecords(records);
    console.log(` Processed ${processedUsers.length} user objects`);


    console.log(' Inserting into database...');
    let insertResult;
    

    if (processedUsers.length > 5000) {
      console.log('Using optimized batch insert for large dataset...');
      insertResult = await UserService.optimizedBatchInsert(processedUsers);
    } else {
      insertResult = await UserService.batchInsertUsers(processedUsers);
    }

    console.log(` Inserted ${insertResult.inserted} records into database`);
    
    if (insertResult.failed > 0) {
      console.warn(`  Failed to insert ${insertResult.failed} records`);
    }


    console.log('Calculating age distribution...');
    const distribution = await AgeDistribution.getDistributionFromDB(pool);
    AgeDistribution.printReport(distribution);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);


    res.status(200).json({
      success: true,
      message: 'CSV processed and uploaded successfully',
      statistics: {
        totalRecords: records.length,
        inserted: insertResult.inserted,
        failed: insertResult.failed,
        processingTime: `${duration}s`
      },
      ageDistribution: distribution,
      errors: insertResult.errors
    });

  } catch (error) {
    console.error(' Error processing CSV:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process CSV',
      error: error.message
    });
  }
});

/**
 * GET /api/upload/distribution
 * Get current age distribution without uploading
 */
router.get('/distribution', async (req, res) => {
  try {
    const distribution = await AgeDistribution.getDistributionFromDB(pool);
    
    res.status(200).json({
      success: true,
      distribution
    });
  } catch (error) {
    console.error(' Error getting distribution:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get age distribution',
      error: error.message
    });
  }
});

/**
 * GET /api/upload/users
 * Get all users from database
 */
router.get('/users', async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error(' Error getting users:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

/**
 * DELETE /api/upload/users
 * Clear all users from database
 */
router.delete('/users', async (req, res) => {
  try {
    const deletedCount = await UserService.clearAllUsers();
    console.log(`🗑️  Deleted ${deletedCount} users`);
    
    res.status(200).json({
      success: true,
      message: 'All users deleted',
      deletedCount
    });
  } catch (error) {
    console.error(' Error deleting users:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete users',
      error: error.message
    });
  }
});

/**
 * GET /api/upload/stats
 * Get database statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const count = await UserService.getUserCount();
    
    res.status(200).json({
      success: true,
      statistics: {
        totalUsers: count
      }
    });
  } catch (error) {
    console.error(' Error getting stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

module.exports = router;