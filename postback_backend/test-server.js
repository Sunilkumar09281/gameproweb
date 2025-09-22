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

// Test parameter routes
app.get('/test/:id', (req, res) => {
  res.json({ message: 'Parameter route working', id: req.params.id });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
