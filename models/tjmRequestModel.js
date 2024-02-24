const mongoose = require('mongoose');
mongoose.set("strictQuery", false);

const status = ["PENDING","VALIDATED",'NOTVALIDATED'];



const tjmRequestSchema = new mongoose.Schema({
    userId: {
        type: String,
    },
    missionId:{
        type: String,
    },
    status:{
        type: String,
        enum: status
    },
    valueOfNewTjm: {
        type: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    simulationValidated:{
        type: String,
    },


});

module.exports = mongoose.model("tjmRequest", tjmRequestSchema);