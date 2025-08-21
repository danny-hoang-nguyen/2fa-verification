const mongoose = require('mongoose');

const UserSecretSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    encryptedSecret: { type: String, required: true }
});

module.exports = mongoose.model('UserSecret', UserSecretSchema);
