const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static(__dirname));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Frontend server running at http://localhost:${PORT}`);
});