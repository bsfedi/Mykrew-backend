const mongoose = require('mongoose');
mongoose.set("strictQuery", false);


const types = ["NEWPREREGISTER","NEWMISSION",'PREREGISTERKILLED','MISSIONKILLED','MISSIONNOTVALID','MISSIONVALID','TJMREQUEST', 'TJMREQUESTRESPONSENOTVALIDATED', "TJMREQUESTRESPONSEVALIDATED", 'VIREMENT'];
const toWho = ['CONSULTANT','RH'];

const notificationSchema = new mongoose.Schema({
    userId: {
        type: String,
    },
    typeOfNotification: {
        type: String,
        enum: types,
    },
    toWho:{
        type: String,
        enum: toWho
    },
    preregisterId:{
        type: String,
    },
    tjmRequestId:{
        type: String,
    },
    missionId:{
        type: String,
    },
    virementId:{
        type: String,
    },
    note:{
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }



});

module.exports = mongoose.model("notification", notificationSchema);