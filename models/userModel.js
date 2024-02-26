const mongoose = require('mongoose');
mongoose.set("strictQuery", false);


const roles = ['CONSULTANT', 'RH', 'ADMIN'];
const newMissionStatus = ['PENDING', 'VALIDATED', 'NOTVALIDATED'];
const newTJMStatus = ['PENDING', 'VALIDATED', 'NOTVALIDATED'];

const userSchema = new mongoose.Schema({
  image: {
    type: String,
    default: "default.jpg"
  },
  isAvtivated: {
    type: Boolean,
    default: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: roles,
    default: 'CONSULTANT', 
  },
  preRegister: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'preRegistration',
    default: null,
  },

  missions: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: new mongoose.Types.ObjectId()
    },

    craInformation: {
      selectedDates : [{
        date: {
          type: Date,
          default: null
        }
      }],
      craPDF: [{
        type: String
      }],
      signature: String,
      noteGlobale: String
    },
    missionInfo: {
      profession: String,
      industrySector: String,
      finalClient: String,
      dailyRate: Number,
      startDate: Date,
      endDate: Date,
      isSimulationValidated: String
    },
    clientInfo: {
      company: String,
      clientContact: {
        firstName: String,
        lastName: String,
        position: String,
        email: String,
        phoneNumber: String,
      },
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
  }],
  personalInfo: {
    immatriculation: String,
    firstName: String,
    lastName: String,
    email: String,
    phoneNumber: String,
    dateOfBirth: Date,
    location: String,
    portage: String,
    nationality: String,
    socialSecurityNumber: String,
    identificationDocument: String,
    rib: String,
    ribDocument: String,
    carInfo: {
      hasCar: Boolean,
      drivingLicense: String,
    },
  },

  userDocuments:[{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: new mongoose.Types.ObjectId()
    },
    documentName: String,
    document: String,
    createdAt:{
      type: Date,
      default: Date.now()
    }
  }]

}
);
userSchema.methods.addMission = async function (missionData) {
  try {
    this.missions.push(missionData);
    await this.save();
    return this;
  } catch (error) {
    throw error;
  }
};

userSchema.methods.addPersonalInfo = async function (personalInfoData) {
  try {
    this.personalInfo = personalInfoData;
    await this.save();
    return this;
  } catch (error) {
    throw error;
  }
};

userSchema.methods.addDocument = async function (documentData) {
  try {
    this.userDocuments.push(documentData);
    await this.save();
    return this;
  } catch (error) {
    throw error;
  }
};


module.exports = mongoose.model("user", userSchema);