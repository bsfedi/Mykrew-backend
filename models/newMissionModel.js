const mongoose = require('mongoose');
mongoose.set("strictQuery", false);


const newMissionStatus = ['PENDING', 'VALIDATED', 'WAITINGCONTRACT', 'NOTVALIDATED'];

const newMissionSchema = new mongoose.Schema({

        userId: String,

    clientInfo: {
        company:{
            value: String,
            validated: Boolean,
            causeNonValidation: String
        },

        clientContact: {
            firstName: {
                value: String,
                validated: Boolean,
                causeNonValidation: String
            },
            lastName: {
                value: String,
                validated: Boolean,
                causeNonValidation: String
            },
            position: {
                value: String,
                validated: Boolean,
                causeNonValidation: String
            },
            email: {
                value: String,
                validated: Boolean,
                causeNonValidation: String
            },
            phoneNumber: {
                value: String,
                validated: Boolean,
                causeNonValidation: String
            },
        }
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


        },

    missionKilled: {
        type: Boolean,
        default: false
    },
        contractProcess: {
            type: mongoose.Schema.Types.ObjectId,
                ref: 'contractProcess'
            },
            newMissionStatus:{
                type: String,
                enum: newMissionStatus,
                default: 'PENDING',
            },





    }
);



module.exports = mongoose.model("newMission", newMissionSchema);