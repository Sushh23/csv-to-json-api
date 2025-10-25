const fs = require('fs');

/**
 * Custom CSV Parser
 * Parses CSV file without using external libraries
 * Handles comma-separated values, quoted strings, and newlines
 */
class CSVParser {
  /**
   * Reads and parses CSV file
   * @param {string} filePath - Path to CSV file
   * @returns {Promise<Array>} Array of parsed objects
   */
  static async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(new Error(`Failed to read file: ${err.message}`));
          return;
        }

        try {
          const parsed = this.parseCSVContent(data);
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Parses CSV content string into array of objects
   * @param {string} csvContent - Raw CSV content
   * @returns {Array} Array of objects
   */
  static parseCSVContent(csvContent) {
    const lines = this.splitIntoLines(csvContent);
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // First line is headers
    const headers = this.parseLine(lines[0]);
    const records = [];

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;

      const values = this.parseLine(line);
      
      // Ensure values match headers count
      if (values.length !== headers.length) {
        console.warn(`Warning: Line ${i + 1} has ${values.length} values but expected ${headers.length}. Skipping.`);
        continue;
      }

      // Create object from headers and values
      const record = {};
      for (let j = 0; j < headers.length; j++) {
        record[headers[j].trim()] = values[j].trim();
      }

      records.push(record);
    }

    return records;
  }

  /**
   * Splits CSV content into lines, handling different line endings
   * @param {string} content - CSV content
   * @returns {Array<string>} Array of lines
   */
  static splitIntoLines(content) {
    // Handle different line endings: \r\n (Windows), \n (Unix), \r (old Mac)
    return content.split(/\r?\n|\r/);
  }

  /**
   * Parses a single CSV line, handling quoted values
   * @param {string} line - Single CSV line
   * @returns {Array<string>} Array of values
   */
  static parseLine(line) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {

        if (insideQuotes && nextChar === '"') {
          currentValue += '"';
          i++;
        } else {

          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {

        values.push(currentValue);
        currentValue = '';
      } else {

        currentValue += char;
      }
    }


    values.push(currentValue);

    return values;
  }
}

module.exports = CSVParser;