const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isDeleted: { type: Boolean, default: false }  // Flag for deleted doctors
});

module.exports = mongoose.model('Doctor', DoctorSchema);