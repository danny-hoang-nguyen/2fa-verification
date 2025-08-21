const { generateSecret, tryDecrypt, verifyToken, encrypt} = require('../services/totpService');
const UserSecret = require('../models/UserSecret');

exports.generate = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'Missing userId' });
        const { encryptedSecret, qrCode } = await generateSecret(userId);
        res.json({ encryptedSecret, qrCode });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error generating QR' });
    }
};


exports.verify = async (req, res) => {
    try {
        const { userId, token } = req.body;
        const record = await UserSecret.findOne({ userId });

        if (!record) return res.status(404).json({ error: 'User not found' });

        const secret = tryDecrypt(record.encryptedSecret);

        const isValid = verifyToken(secret, token);

        res.json({ valid: isValid });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error verifying token' });
    }
};
