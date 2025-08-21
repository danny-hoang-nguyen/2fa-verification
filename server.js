// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Cho phép CORS
app.use(cors());
app.use(express.json());

app.get('/generate-qr', async (req, res) => {
    const email = req.query.email;
    if (!email) {
        return res.status(400).json({ error: 'Missing email parameter' });
    }

    try {
        // Tạo QR từ email qua API public
        const qrUrl = `http://localhost:3456/auth/generate?userId=${encodeURIComponent(email)}`;
        const response = await fetch(qrUrl);
        const data = await response.json();

        // Lấy ảnh base64 từ response
        res.json({ image: data.qrCode });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});
app.post('/verify', async (req, res) => {
    try {
        const response = await axios.post(`http://localhost:3456/auth/verify`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Forwarding failed:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to verify via upstream',
        });
    }
});
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
