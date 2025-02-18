const mongoose = require('mongoose');

const ChildSchema = new mongoose.Schema({
    childid: { type: String, unique: true },
    parentid: { type: String, required: true }, // Reference to Parent
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    bloodgroup: { type: String, required: true }
});

// Middleware to auto-generate childid before saving
ChildSchema.pre('save', async function (next) {
    if (!this.childid) {
        const lastChild = await mongoose.model('Child').findOne().sort({ childid: -1 });

        let newChildId = 'C001';
        if (lastChild && lastChild.childid) {
            const lastIdNumber = parseInt(lastChild.childid.substring(1));
            newChildId = `C${String(lastIdNumber + 1).padStart(3, '0')}`;
        }

        this.childid = newChildId;
    }
    next();
});

module.exports = mongoose.model('Child', ChildSchema);