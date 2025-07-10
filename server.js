const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// For any other request that doesn't have a file extension, serve the index.html file
// This is crucial for single-page applications with client-side routing
app.get('*', (req, res) => {
  if (req.path.includes('.')) {
    res.status(404).send('Not found');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
