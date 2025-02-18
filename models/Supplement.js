const mongoose = require("mongoose");

const supplementSchema = new mongoose.Schema({
  supplementid: { type: String, unique: true },
  name: { type: String, required: true },
  category: { type: String, enum: ["Vaccine", "Polio", "Vitamins"], required: true },
  description: { type: String },
  agegroup: { type: String, required: true },
  dosage: { type: String, required: true },
});

const Supplement = mongoose.model("Supplement", supplementSchema);
module.exports = Supplement;
