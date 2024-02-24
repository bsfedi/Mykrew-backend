const PreRegistration = require("../models/preRegistrationModel")
const User = require("../models/userModel")
const NewMission = require("../models/newMissionModel")
function checkEmptyFields(obj, excludedFields) {
    const values = Object.values(obj);
    return values.some((value, index) => {
        const fieldName = Object.keys(obj)[index];
        return value === "" && !excludedFields.includes(fieldName);
    });
}
async function getPreRegistrationByContractId(contractId) {
    try {
        const preRegistration = await PreRegistration.findOne({ contractProcess: contractId })
            .populate('contractProcess')
            .exec();

        if (!preRegistration) {
            throw new Error('Pre-registration not found for the given contract ID.');
        }

        return preRegistration;
    } catch (error) {
        throw error;
    }
}
async function getUserByPreregister(preregisterId) {
    try {
        const user = await User.findOne({ preRegister: preregisterId })
            .exec();

        if (!user) {
            throw new Error('User not found for the given contract ID.');
        }

        return user;
    } catch (error) {
        throw error;
    }
}
async function getMissionByContractId(contractId) {
    try {
        const mission = await NewMission.findOne({ contractProcess: contractId });



        return mission;
    } catch (error) {
        throw error;
    }
}
async function findMissionById(missionId) {
    try {
        const users = await User.find({});
        let foundMission = null;

        users.forEach(user => {

            user.missions.forEach(mission => {
                if (mission._id.equals(missionId)) {
                    foundMission = mission;

                }
            });
        });

        return foundMission;
    } catch (error) {
        throw error;
    }
}



module.exports = {
    checkEmptyFields,
    getPreRegistrationByContractId,
    getUserByPreregister,
    getMissionByContractId,
    findMissionById
};