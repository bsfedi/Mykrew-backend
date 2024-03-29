const PreRegistration = require('../models/preRegistrationModel.js');
const ContractProcess = require('../models/contractModel.js');
const User = require('../models/userModel.js');
const { getPreRegistrationByContractId, getUserByPreregister, getMissionByContractId } = require("../utils/utils");
const NewMission = require("../models/newMissionModel");



exports.getContractByPreregisterId = async (req, res) => {
    const preRegistrationId = req.params.preRegistrationId;

    try {
        const preRegistration = await PreRegistration
            .findById(preRegistrationId)
            .populate('contractProcess');

        if (!preRegistration) {
            return res.status(404).json({ error: 'PreRegistration not found.' });
        }

        const contractProcess = preRegistration.contractProcess;

        return res.json(contractProcess);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while fetching PreRegistration.' });
    }
};


exports.getContractById = async (req, res) => {
    const contractProcessId = req.params.contractProcessId;

    try {
        await ContractProcess.findById(contractProcessId)
            .then(contractProcess => {
                return res.json(contractProcess);
            })
            .catch(error => {
                return res.status(404).send("contract process not found");
            })
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while fetching PreRegistration.' });
    }
};

exports.validatePriseDeContact = async (req, res) => {
    const contractProcessId = req.params.contractProcessId;
    const bodyValue = req.body;
    var validated = bodyValue.validated ? "VALIDATED" : "NOTVALIDATED";

    try {
        const updatedContractProcess = await ContractProcess.findOneAndUpdate(
            { _id: contractProcessId },
            {
                $set: {
                    contactClient: validated,
                    clientValidation: "PENDING"
                }
            },
            { new: true } // To return the updated document
        );

        if (!updatedContractProcess) {
            return res.status(404).json({ error: 'ContractProcess not found.' });
        }

        return res.status(200).json(updatedContractProcess);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while updating ContractProcess.' });
    }
};

exports.validateClientValidation = async (req, res) => {
    const contractProcessId = req.params.contractProcessId;
    const bodyValue = req.body;
    var validated = bodyValue.validated ? "VALIDATED" : "NOTVALIDATED";

    try {
        const updatedContractProcess = await ContractProcess.findOneAndUpdate(
            { _id: contractProcessId },
            {
                $set: {
                    clientValidation: validated,
                    jobCotractEdition: "PENDING"
                }
            },
            { new: true } // To return the updated document
        );

        if (!updatedContractProcess) {
            return res.status(404).json({ error: 'ContractProcess not found.' });
        }

        return res.status(200).json(updatedContractProcess);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while updating ContractProcess.' });
    }
};

exports.validateJobCotractEdition = async (req, res) => {
    const contractProcessId = req.params.contractProcessId;
    const bodyValue = req.body;
    var validated = bodyValue.validated ? "VALIDATED" : "NOTVALIDATED";

    try {
        const updatedContractProcess = await ContractProcess.findOneAndUpdate(
            { _id: contractProcessId },
            {
                $set: {
                    jobCotractEdition: validated,
                    contractValidation: "PENDING"
                }
            },
            { new: true } // To return the updated document
        );

        if (!updatedContractProcess) {
            return res.status(404).json({ error: 'ContractProcess not found.' });
        }

        return res.status(200).json(updatedContractProcess);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while updating ContractProcess.' });
    }
};

exports.validateContractValidation = async (req, res) => {
    const contractProcessId = req.params.contractProcessId;
    const bodyValue = req.body;
    const validated = bodyValue.validated ? "VALIDATED" : "NOTVALIDATED";

    try {
        const updatedContractProcess = await ContractProcess.findOneAndUpdate(
            { _id: contractProcessId },
            {
                $set: {
                    contractValidation: validated,
                }
            },
            { new: true }
        );

        if (!updatedContractProcess) {
            return res.status(404).json({ error: 'ContractProcess not found.' });
        }

        const { contactClient, clientValidation, jobCotractEdition, contractValidation } = updatedContractProcess;

        const isAnyNotValidated = [contactClient, clientValidation, jobCotractEdition, contractValidation].some(field => field !== 'VALIDATED');

        updatedContractProcess.statut = isAnyNotValidated ? 'NOTVALIDATED' : 'VALIDATED';


        await updatedContractProcess.save();
        if (updatedContractProcess.statut == "VALIDATED") {
            getMissionByContractId(contractProcessId)
                .then(async (mission) => {
                    if (mission) {

                        await NewMission.findOneAndUpdate({ _id: mission._id },
                            { newMissionStatus: "VALIDATED" }).then(() => {
                                console.log("suceess")
                            }).catch(error => {
                                console.log("error while changing mission stauts")
                            })
                        await User.findById(mission.userId)
                            .then(async (user) => {
                                const missionData = {
                                    missionInfo: {
                                        profession: mission.missionInfo.profession.value,
                                        industrySector: mission.missionInfo.industrySector.value,
                                        finalClient: mission.missionInfo.finalClient.value,
                                        dailyRate: mission.missionInfo.dailyRate.value,
                                        startDate: mission.missionInfo.startDate.value,
                                        endDate: mission.missionInfo.endDate.value,
                                        isSimulationValidated: mission.missionInfo.isSimulationValidated.value,
                                    },
                                    clientInfo: {
                                        company: mission.clientInfo.company.value,
                                        clientContact: {
                                            firstName: mission.clientInfo.clientContact.firstName.value,
                                            lastName: mission.clientInfo.clientContact.lastName.value,
                                            position: mission.clientInfo.clientContact.position.value,
                                            email: mission.clientInfo.clientContact.email.value,
                                            phoneNumber: mission.clientInfo.clientContact.phoneNumber.value,
                                        },
                                    },
                                    contractProcess: mission.contractProcess,
                                    newMissionStatus: "VALIDATED"

                                };

                                await NewMission.findOneAndDelete({ _id: mission._id }).then(deleted => {
                                    console.log(deleted)
                                })
                                try {
                                    const user = await User.findByIdAndUpdate(mission.userId);

                                    await user.addMission(missionData);
                                } catch (error) {
                                    return res.status(500).json({ error: 'An error occurred while updating the user.' });
                                }


                            }).catch((error) => {
                                console.error('Error:', error.message);
                            })
                        return res.status(200).json(updatedContractProcess);
                    }
                    else {
                        const updatedPreRegistration = await PreRegistration.findOneAndUpdate(
                            { contractProcess: contractProcessId }, {
                            [`status`]: "VALIDATED",
                        })

                        getPreRegistrationByContractId(contractProcessId)
                            .then((preRegistration) => {
                                getUserByPreregister(preRegistration.id)
                                    .then(async (user) => {
                                        const missionData = {
                                            missionInfo: {
                                                profession: preRegistration.missionInfo.profession.value,
                                                industrySector: preRegistration.missionInfo.industrySector.value,
                                                finalClient: preRegistration.missionInfo.finalClient.value,
                                                dailyRate: preRegistration.missionInfo.dailyRate.value,
                                                startDate: preRegistration.missionInfo.startDate.value,
                                                endDate: preRegistration.missionInfo.endDate.value,
                                                isSimulationValidated: preRegistration.missionInfo.isSimulationValidated.value,
                                            },
                                            clientInfo: {
                                                company: preRegistration.clientInfo.company.value,
                                                clientContact: {
                                                    firstName: preRegistration.clientInfo.clientContact.firstName.value,
                                                    lastName: preRegistration.clientInfo.clientContact.lastName.value,
                                                    position: preRegistration.clientInfo.clientContact.position.value,
                                                    email: preRegistration.clientInfo.clientContact.email.value,
                                                    phoneNumber: preRegistration.clientInfo.clientContact.phoneNumber.value,
                                                },
                                            },
                                            contractProcess: preRegistration.contractProcess,
                                            newMissionStatus: "VALIDATED"

                                        };
                                        const personalInfoData = {
                                            firstName: preRegistration.personalInfo.firstName.value,
                                            lastName: preRegistration.personalInfo.lastName.value,
                                            email: preRegistration.personalInfo.email.value,
                                            phoneNumber: preRegistration.personalInfo.phoneNumber.value,
                                            dateOfBirth: preRegistration.personalInfo.dateOfBirth.value,
                                            location: preRegistration.personalInfo.location.value,
                                            nationality: preRegistration.personalInfo.nationality.value,
                                            portage: preRegistration.personalInfo.portage.value,
                                            socialSecurityNumber: preRegistration.personalInfo.socialSecurityNumber.value,
                                            identificationDocument: preRegistration.personalInfo.identificationDocument.value,
                                            rib: preRegistration.personalInfo.rib.value,
                                            ribDocument: preRegistration.personalInfo.ribDocument.value,
                                            carInfo: {
                                                hasCar: preRegistration.personalInfo.carInfo.hasCar.value,
                                                drivingLicense: preRegistration.personalInfo.carInfo.drivingLicense.value,
                                            },
                                        };

                                        try {
                                            const user = await User.findOneAndUpdate(
                                                { preRegister: preRegistration.id },
                                                {}
                                            );

                                            await user.addMission(missionData);
                                            await user.addPersonalInfo(personalInfoData);
                                        } catch (error) {
                                            return res.status(500).json({ error: 'An error occurred while updating the user.' });
                                        }


                                    }).catch((error) => {
                                        console.error('Error:', error.message);
                                        return res.status(500).json({ error: 'An error occurred while updating the user.' });
                                    })
                                return res.status(200).json(preRegistration);
                            })
                            .catch((error) => {
                                console.error('Error:', error.message);
                                return res.status(500).json({ error: 'An error occurred while updating the user.' });
                            });

                    }


                })
                .catch((error) => {
                    console.error('Error:', error.message);
                    return res.status(500).json({ error: 'An error occurred while updating the user.' });
                });
        } else {
            return res.status(500).send("contract not validated");
        }


    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while updating ContractProcess.' });
    }
};


