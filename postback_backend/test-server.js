// Minimal test server to isolate the path-to-regexp error
const express = require('express');
const app = express();
const PORT = 5001;

// Test basic routes first
app.get('/', (req, res) => {
  res.json({ message: 'Test server working' });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Basic route working' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API endpoint working', timestamp: new Date().toISOString() });
});

app.get('/api/server-info', (req, res) => {
  res.json({
    message: 'Test server is running',
    timestamp: new Date().toISOString(),
    version: 'test-1.0'
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
