const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    usuario: String,
    pass: String,
    // Puedes agregar más campos según sea necesario
},{collection: 'usuarios'});

const User = mongoose.model('User', userSchema);

module.exports = User;
