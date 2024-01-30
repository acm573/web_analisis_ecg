// models/Registro.js
const mongoose = require('mongoose');

const registroSchema = new mongoose.Schema({
    totalLatidos: Number,
    latidos: [{
        tipo: String,
        latido: [Number]
    }],
    imageBase64: String,
    fecha: Date,
    usuario: String,
    hora: String
});

const Registro = mongoose.model('Registro', registroSchema);

module.exports = Registro;
