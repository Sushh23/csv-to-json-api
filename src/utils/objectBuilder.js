
class ObjectBuilder {
  /**
   * Converts flat object with dot notation to nested object
   * @param {Object} flatObject - Object with dot notation keys
   * @returns {Object} Nested object
   */
  static buildNestedObject(flatObject) {
    const result = {};

    for (const [key, value] of Object.entries(flatObject)) {
      this.setNestedProperty(result, key, value);
    }

    return result;
  }

  /**
   * Sets a nested property using dot notation path
   * @param {Object} obj - Target object
   * @param {string} path - Dot notation path (e.g., "address.city")
   * @param {*} value - Value to set
   */
  static setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];

      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      
      current = current[key];
    }

    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
  }

  /**
   * Separates mandatory fields from additional fields
   * @param {Object} nestedObject - Nested object
   * @returns {Object} Object with separated fields
   */
  static separateMandatoryFields(nestedObject) {
    const mandatory = {
      firstName: nestedObject.name?.firstName || '',
      lastName: nestedObject.name?.lastName || '',
      age: parseInt(nestedObject.age) || 0,
      address: nestedObject.address || null
    };

    const fullName = `${mandatory.firstName} ${mandatory.lastName}`.trim();

    const additionalInfo = {};
    
    for (const [key, value] of Object.entries(nestedObject)) {
      if (key !== 'name' && key !== 'age' && key !== 'address') {
        additionalInfo[key] = value;
      }
    }

    return {
      name: fullName,
      age: mandatory.age,
      address: mandatory.address,
      additional_info: Object.keys(additionalInfo).length > 0 ? additionalInfo : null
    };
  }

  /**
   * Processes array of flat records into database-ready format
   * @param {Array} records - Array of flat CSV records
   * @returns {Array} Array of processed records
   */
  static processRecords(records) {
    return records.map(record => {
    
      const nested = this.buildNestedObject(record);

      return this.separateMandatoryFields(nested);
    });
  }
}

module.exports = ObjectBuilder;