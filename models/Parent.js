const mongoose = require('mongoose');

const ParentSchema = new mongoose.Schema({
    parentid: { type: String, unique: true }, // No 'required: true' since it'll be auto-generated
    name: { type: String, required: true },
    address: { type: String, required: true },
    phoneno: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Middleware to auto-generate parentid before saving
ParentSchema.pre('save', async function (next) {
    if (!this.parentid) {
        const lastParent = await mongoose.model('Parent').findOne().sort({ parentid: -1 });

        let newParentId = 'P001';
        if (lastParent && lastParent.parentid) {
            const lastIdNumber = parseInt(lastParent.parentid.substring(1)); // Remove 'P' and convert to number
            newParentId = `P${String(lastIdNumber + 1).padStart(3, '0')}`; // Ensure P001, P002 format
        }

        this.parentid = newParentId;
    }
    next();
});

module.exports = mongoose.model('Parent', ParentSchema);
