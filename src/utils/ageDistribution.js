
class AgeDistribution {
  /**
   * Calculates age distribution from user records
   * @param {Array} users - Array of user records with age property
   * @returns {Object} Age distribution statistics
   */
  static calculate(users) {
    const total = users.length;
    
    if (total === 0) {
      return {
        '<20': 0,
        '20-40': 0,
        '40-60': 0,
        '>60': 0
      };
    }

    const distribution = {
      '<20': 0,
      '20-40': 0,
      '40-60': 0,
      '>60': 0
    };

    users.forEach(user => {
      const age = parseInt(user.age);
      
      if (isNaN(age)) {
        console.warn(`Warning: Invalid age value: ${user.age}`);
        return;
      }

      if (age < 20) {
        distribution['<20']++;
      } else if (age >= 20 && age < 40) {
        distribution['20-40']++;
      } else if (age >= 40 && age <= 60) {
        distribution['40-60']++;
      } else {
        distribution['>60']++;
      }
    });

    const percentages = {};
    for (const [group, count] of Object.entries(distribution)) {
      percentages[group] = ((count / total) * 100).toFixed(2);
    }

    return {
      counts: distribution,
      percentages,
      total
    };
  }

  /**
   * Prints formatted age distribution report to console
   * @param {Object} distribution - Age distribution object
   */
  static printReport(distribution) {
    console.log('\n' + '='.repeat(50));
    console.log('📊 AGE DISTRIBUTION REPORT');
    console.log('='.repeat(50));
    console.log(`Total Users: ${distribution.total}\n`);
    console.log('Age Group     | Count    | % Distribution');
    console.log('-'.repeat(50));
    
    const groups = ['<20', '20-40', '40-60', '>60'];
    
    groups.forEach(group => {
      const count = distribution.counts[group];
      const percentage = distribution.percentages[group];
      const groupLabel = group.padEnd(13);
      const countLabel = count.toString().padEnd(8);
      
      console.log(`${groupLabel} | ${countLabel} | ${percentage}%`);
    });
    
    console.log('='.repeat(50) + '\n');
  }

  /**
   * Gets age distribution from database
   * @param {Pool} pool - PostgreSQL connection pool
   * @returns {Promise<Object>} Age distribution statistics
   */
  static async getDistributionFromDB(pool) {
    const query = 'SELECT age FROM users';
    
    try {
      const result = await pool.query(query);
      const users = result.rows;
      
      const distribution = this.calculate(users);
      return distribution;
    } catch (error) {
      throw new Error(`Failed to get age distribution: ${error.message}`);
    }
  }
}

module.exports = AgeDistribution;