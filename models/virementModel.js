const mongoose = require('mongoose');
mongoose.set("strictQuery", false);

const type = ['Participation','Cooptation','Frais'];

const virementSchema = new mongoose.Schema({
    userId: {
        type: String,
    },
    typeVirement: {
        type: String,
        enum: type,
    },
    montant:{
        type: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }



});

module.exports = mongoose.model("virement", virementSchema);