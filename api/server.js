const express = require('express');
const path = require('path');
const cors = require('cors');
const connectToDatabase = require('../utils/db');
const User = require('../models/User');
const authRoutes = require('../routes/auth'); // Import authentication routes

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const port = process.env.PORT || 3000;

connectToDatabase().then(() => console.log('MongoDB connected'));

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// Use authentication routes


app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ message: 'Internal server error.' });
});

['friends', 'tasks', 'market', 'softie', 'more', 'upgrades', 'login', 'register', 'join-softcoin', 'reset-password', 'verification', 'explore' ].forEach(file => {
    app.get(`/${file}`, (req, res) => {
        res.sendFile(path.join(__dirname, '../public', `${file}.html`));
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
