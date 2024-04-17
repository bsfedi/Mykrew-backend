const mongoose = require('mongoose');
mongoose.set("strictQuery", false);


const types = ["NEWPREREGISTER", "NEWMISSION", 'PREREGISTERKILLED', 'MISSIONKILLED', 'MISSIONNOTVALID', 'MISSIONVALID', 'TJMREQUEST', 'TJMREQUESTRESPONSENOTVALIDATED', "TJMREQUESTRESPONSEVALIDATED", 'VIREMENT', 'UPDATEREREGISTER'];
const toWho = ['CONSULTANT', 'RH'];

const notificationSchema = new mongoose.Schema({
    userId: {
        type: String,
    },
    typeOfNotification: {
        type: String,
        enum: types,
    },
    toWho: {
        type: String,
        enum: toWho
    },
    preregisterId: {
        type: String,
    },
    tjmRequestId: {
        type: String,
    },
    missionId: {
        type: String,
    },
    virementId: {
        type: String,
    },
    note: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isSeen: {
        type: Boolean,
        default: false  // Assuming notifications start as unseen
    },


});

module.exports = mongoose.model("notification", notificationSchema);