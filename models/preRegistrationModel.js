const mongoose = require("mongoose");
mongoose.set("strictQuery", false);



const preRegistartionSchema = mongoose.Schema({

    userId:String,
    personalInfo: {

        portage: {
            value: String,
            validated: Boolean,
            causeNonValidation: String
        },
        firstName: {
            value: String,
            validated: Boolean,
            causeNonValidation:String,
        },
        lastName: {
            value: String,
            validated: Boolean,
            causeNonValidation:String
        },
        email: {
            value: String,
            validated: Boolean,
            causeNonValidation:String
        },
        phoneNumber: {
            value: String,
            validated: Boolean,
            causeNonValidation:String
        },
        dateOfBirth: {
            value: Date,
            validated: Boolean,
            causeNonValidation:String
        },
        location: {
            value: String,
            validated: Boolean,
            causeNonValidation:String
        },
        nationality: {
            value: String,
            validated: Boolean,
            causeNonValidation:String
        },
        socialSecurityNumber: {
            value: String,
            validated: Boolean,
            causeNonValidation:String
        },
        identificationDocument: {
            value: String,
            validated: Boolean,
            causeNonValidation:String
        },
        rib: {
            value: String,
            validated: Boolean,
            causeNonValidation:String
        },
        ribDocument: {
            value: String,
            validated: Boolean,
            causeNonValidation:String
        },
        carInfo: {
            hasCar: {
                value: Boolean,
                validated: Boolean,
                causeNonValidation:String
            },
            drivingLicense: {
                value: String,
                validated: Boolean,
                causeNonValidation:String
            },
            carRegistration: {
                value: String,
                validated: Boolean,
                causeNonValidation:String
            },
        },
    },
    clientInfo: {
        company: {
            value: String,
            validated: Boolean,
            causeNonValidation:String
        },
        clientContact: {
            firstName: {
                value: String,
                validated: Boolean,
                causeNonValidation:String
            },
            lastName: {
                value: String,
                validated: Boolean,
                causeNonValidation:String
            },
            position: {
                value: String,
                validated: Boolean,
                causeNonValidation:String
            },
            email: {
                value: String,
                validated: Boolean,
                causeNonValidation:String
            },
            phoneNumber: {
                value: String,
                validated: Boolean,
                causeNonValidation:String
            },
        },
    },
    missionInfo: {


        profession: {
            value: String,
            validated: Boolean,
            causeNonValidation:String
        },
        industrySector: {
            value: String,
            validated: Boolean,
            causeNonValidation:String
        },
        finalClient: {
            value: String,
            validated: Boolean,
            causeNonValidation:String
        },
        dailyRate: {
            value: Number,
            validated: Boolean,
            causeNonValidation:String
        },
        startDate: {
            value: Date,
            validated: Boolean,
            causeNonValidation:String
        },
        endDate: {
            value: Date,
            validated: Boolean,
            causeNonValidation:String
        },
        isSimulationValidated: {
            value: String,
            validated: Boolean,
            causeNonValidation:String
        },
        missionKilled: {
            type: Boolean,
            default: false
        }
    },
    addedDate: {
        type: Date,
        default: Date.now,
    },

    pendingToKillDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['VALIDATED', 'PENDING', 'NOTVALIDATED','NOTEXIST', 'PENDINGTOKILL'],
        default: 'NOTEXIST',
    },
    contractProcess: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'contractProcess'
    },

});

module.exports = PreRegistration = mongoose.model("preRegistartion", preRegistartionSchema);