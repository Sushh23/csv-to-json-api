const express = require('express');
const uploadRoutes = require('./routes/upload.routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

app.use('/api/upload', uploadRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'CSV to JSON API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'CSV to JSON Converter API',
    version: '1.0.0',
    endpoints: {
      processCSV: 'POST /api/upload/process',
      getDistribution: 'GET /api/upload/distribution',
      getUsers: 'GET /api/upload/users',
      deleteUsers: 'DELETE /api/upload/users',
      getStats: 'GET /api/upload/stats',
      health: 'GET /health'
    }
  });
});


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});


app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log(' CSV to JSON Converter API');
  console.log('='.repeat(50));
  console.log(` Server running on port ${PORT}`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` CSV Path: ${process.env.CSV_FILE_PATH}`);
  console.log('='.repeat(50) + '\n');
});

module.exports = app;