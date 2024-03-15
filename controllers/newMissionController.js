const NewMission = require('../models/newMissionModel.js');
const ContractProcess = require('../models/contractModel.js');
const jwt = require('jsonwebtoken');
const serviceJWT = require('../configuration/JWTConfig');
const { checkEmptyFields, getPreRegistrationByContractId, getUserByPreregister, getMissionByContractId, findMissionById } = require("../utils/utils");
const User = require("../models/userModel");
const PreRegistration = require("../models/preRegistrationModel");
const { getNotValidated } = require("./preRegistrationController");
const Notification = require("../models/notificationModel");
const socketModule = require('../configuration/socketConfig');

exports.createNewMission = async (req, res) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ message: 'Token non fourni' });
        }
        const decoded = jwt.verify(token, serviceJWT.jwtSecret);
        const user = decoded.userId
        const clientInfo = req.body;
        const files = req.files;
        const isSimulationValidatedFilename = files.isSimulationValidated ? files.isSimulationValidated[0].filename : null;
        await NewMission.create(
            {
                [`clientInfo.company.value`]: clientInfo.company,
                [`userId`]: user,
                [`clientInfo.clientContact.firstName.value`]: clientInfo.firstName,
                [`clientInfo.clientContact.lastName.value`]: clientInfo.lastName,
                [`clientInfo.clientContact.position.value`]: clientInfo.position,
                [`clientInfo.clientContact.email.value`]: clientInfo.email,
                [`clientInfo.clientContact.phoneNumber.value`]: clientInfo.phoneNumber,
                [`missionInfo.profession.value`]: clientInfo.profession,
                [`missionInfo.industrySector.value`]: clientInfo.industrySector,
                [`missionInfo.finalClient.value`]: clientInfo.finalClient,
                [`missionInfo.dailyRate.value`]: clientInfo.dailyRate,
                [`missionInfo.startDate.value`]: clientInfo.startDate,
                [`missionInfo.endDate.value`]: clientInfo.endDate,
                [`missionInfo.portage.value`]: clientInfo.portage,
                [`missionInfo.isSimulationValidated.value`]: isSimulationValidatedFilename,
                [`newMissionStatus`]: "PENDING",

            },
        ).then(async (newMission) => {

            const notification = new Notification({
                userId: user,
                typeOfNotification: "NEWMISSION",
                toWho: "RH",
                missionId: newMission._id,


            })
            await notification.save().then(notification => {
                socketModule.getIO().emit("rhNotification", { notification: notification })
            })
                .catch(error => {
                    console.log(error)
                })

            return res.status(201).send(newMission);

        }).catch((error) => {
            return res.status(500).json({ error: error });
        })
    } catch (error) {
        return res.status(500).json({ error: error });
    }
};

exports.getMyNewMission = async (req, res) => {

    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ message: 'Token non fourni' });
        }
        const decoded = jwt.verify(token, serviceJWT.jwtSecret);
        const user = decoded.userId

        await NewMission
            .find({ userId: user })
            .then((newMissions) => {
                return res.status(200).send(newMissions)
            })
            .catch((error) => {
                return res.status(500).send({ error: error })
            })

    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while fetching missions.' });
    }
};


exports.getNewMissionById = async (req, res) => {

    try {
        const missionId = req.params.newMissionId

        await NewMission
            .findById(missionId)
            .then((newMission) => {
                if (!newMission) {
                    findMissionById(missionId)
                        .then(result => {
                            if (result) {
                                return res.status(200).send(result)
                            } else {
                                return res.status(404).send("Mission non trouvé")
                            }
                        })
                        .catch(error => {
                            console.error('Erreur lors de la recherche de la mission :', error);
                        });

                } else {
                    console.log(newMission)
                    const transformedMission = {
                        missionInfo: {
                            profession: newMission.missionInfo.profession.value,
                            industrySector: newMission.missionInfo.industrySector.value,
                            finalClient: newMission.missionInfo.finalClient.value,
                            dailyRate: newMission.missionInfo.dailyRate.value,
                            startDate: newMission.missionInfo.startDate.value,
                            endDate: newMission.missionInfo.endDate.value,
                            isSimulationValidated: newMission.missionInfo.isSimulationValidated.value,
                        },
                        clientInfo: {
                            company: newMission.clientInfo.company.value,
                            clientContact: {
                                firstName: newMission.clientInfo.clientContact.firstName.value,
                                lastName: newMission.clientInfo.clientContact.lastName.value,
                                position: newMission.clientInfo.clientContact.position.value,
                                email: newMission.clientInfo.clientContact.email.value,
                                phoneNumber: newMission.clientInfo.clientContact.phoneNumber.value,
                            },
                            company: newMission.clientInfo.company.value,
                        },
                        _id: newMission._id,
                        contractProcess: newMission.contractProcess,
                        newMissionStatus: newMission.newMissionStatus,
                    };

                    return res.status(200).send(transformedMission)
                }

            })
            .catch((error) => {
                return res.status(500).send({ error: error })
            })

    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while fetching missions.' });
    }
};

exports.RHvalidation = async (req, res) => {


    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Token non fourni' });
    }
    const decoded = jwt.verify(token, serviceJWT.jwtSecret);
    const role = decoded.role
    validated_by = decoded.userId
    console.log(validated_by)
    if (role === "CONSULTANT") {
        return res.status(403).send({ error: "Unauthorized" })
    }

    let validated;
    const rhValidation = req.body
    const missionId = req.params.missionId
    const rhValidationValues = Object.values(rhValidation);
    const isFalseValuePresent = rhValidationValues.includes(false);
    if (isFalseValuePresent) {
        validated = "NOTVALIDATED"

    } else {
        validated = "WAITINGCONTRACT"
        const newContractProcess = new ContractProcess();

        const savedContractProcess = await newContractProcess.save();
        const newMissionCo = await NewMission.findOneAndUpdate(
            { _id: missionId },
            {

                contractProcess: savedContractProcess._id,
            },
            { new: true }
        );

    }
    await NewMission.updateOne(
        { _id: missionId },
        {
            [`clientInfo.company.validated`]: rhValidation.companyValidation,
            [`clientInfo.company.causeNonValidation`]: rhValidation.companyCause,
            [`clientInfo.clientContact.firstName.validated`]: rhValidation.clientfirstNameValidation,
            [`clientInfo.clientContact.firstName.causeNonValidation`]: rhValidation.clientfirstNameCause,
            [`clientInfo.clientContact.lastName.validated`]: rhValidation.clientlastNameValidation,
            [`clientInfo.clientContact.lastName.causeNonValidation`]: rhValidation.clientlastNameCause,
            [`clientInfo.clientContact.position.validated`]: rhValidation.clientPostionValidation,
            [`clientInfo.clientContact.position.causeNonValidation`]: rhValidation.clientPositionCause,
            [`clientInfo.clientContact.email.validated`]: rhValidation.clientEmailValidation,
            [`clientInfo.clientContact.email.causeNonValidation`]: rhValidation.clientEmailCause,
            [`clientInfo.clientContact.phoneNumber.validated`]: rhValidation.clientphoneNumberValidation,
            [`clientInfo.clientContact.phoneNumber.causeNonValidation`]: rhValidation.clientphoneNumberCause,
            [`missionInfo.profession.validated`]: rhValidation.professionvalidation,
            [`missionInfo.profession.causeNonValidation`]: rhValidation.professionCause,
            [`missionInfo.industrySector.validated`]: rhValidation.industrySectorValidated,
            [`missionInfo.industrySector.causeNonValidation`]: rhValidation.industrySectorCause,
            [`missionInfo.portage.validated`]: rhValidation.industrySectorValidated,
            [`missionInfo.portage.causeNonValidation`]: rhValidation.industrySectorCause,
            [`missionInfo.finalClient.validated`]: rhValidation.finalClientValidation,
            [`missionInfo.finalClient.causeNonValidation`]: rhValidation.finalClientCause,
            [`missionInfo.dailyRate.validated`]: rhValidation.dailyRateValidation,
            [`missionInfo.dailyRate.causeNonValidation`]: rhValidation.dailyRateCause,
            [`missionInfo.startDate.validated`]: rhValidation.startDateValidation,
            [`missionInfo.startDate.causeNonValidation`]: rhValidation.startDateCause,
            [`missionInfo.endDate.validated`]: rhValidation.endDateValidation,
            [`missionInfo.endDate.causeNonValidation`]: rhValidation.endDateCause,
            [`missionInfo.isSimulationValidated.validated`]: rhValidation.simulationValidation,
            [`missionInfo.isSimulationValidated.causeNonValidation`]: rhValidation.simulationCause,
            [`newMissionStatus`]: validated,
            [`validated_by`]: validated_by,



        },
        { new: true }
    ).then(async (newMission) => {
        if (!newMission) {
            return res.status(404).send("mission not found")
        } else {
            if (isFalseValuePresent) {
                const notification = new Notification({
                    userId: newMission.userId,
                    typeOfNotification: "MISSIONNOTVALID",
                    toWho: "CONSULTANT",
                    missionId: newMission._id,

                })
                await notification.save().then(notification => {
                    socketModule.getIO().emit("rhNotification", { notification: notification })
                })


            } else {
                const notification = new Notification({
                    userId: newMission.userId,
                    typeOfNotification: "MISSIONVALID",
                    toWho: "CONSULTANT",
                    missionId: newMission._id,

                })
                await notification.save().then(notification => {
                    socketModule.getIO().emit("rhNotification", { notification: notification })
                })

            }
            return res.status(200).send(newMission)
        }

    }).catch((error) => {
        return res.status(500).send(error)
    });




}

exports.consultantEdit = async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Token non fourni' });
    }
    const decoded = jwt.verify(token, serviceJWT.jwtSecret);
    const role = decoded.role

    if (role !== "CONSULTANT") {
        return res.status(403).send({ error: "Unauthorized" })
    }
    try {
        const rhValidation = req.body
        const excludedFields = ['simulationValidation'];
        const hasEmptyField = checkEmptyFields(rhValidation, excludedFields);

        if (hasEmptyField) {
            return res.status(400).json({ error: 'Tous les champs doivent être renseignés.' });
        }
        const missionId = req.params.missionId;
        const files = req.files;
        const resetFields = {
            'clientInfo.company.validated': true,
            'clientInfo.company.causeNonValidation': null,
            'clientInfo.clientContact.firstName.validated': true,
            'clientInfo.clientContact.firstName.causeNonValidation': null,
            'clientInfo.clientContact.lastName.validated': true,
            'clientInfo.clientContact.lastName.causeNonValidation': null,
            'clientInfo.clientContact.position.validated': true,
            'clientInfo.clientContact.position.causeNonValidation': null,
            'clientInfo.clientContact.email.validated': true,
            'clientInfo.clientContact.email.causeNonValidation': null,
            'clientInfo.clientContact.phoneNumber.validated': true,
            'clientInfo.clientContact.phoneNumber.causeNonValidation': null,
            'missionInfo.profession.validated': true,
            'missionInfo.profession.causeNonValidation': null,
            'missionInfo.industrySector.validated': true,
            'missionInfo.industrySector.causeNonValidation': null,
            'missionInfo.finalClient.validated': true,
            'missionInfo.finalClient.causeNonValidation': null,
            'missionInfo.dailyRate.validated': true,
            'missionInfo.dailyRate.causeNonValidation': null,
            'missionInfo.portage.validated': true,
            'missionInfo.portage.causeNonValidation': null,
            'missionInfo.startDate.validated': true,
            'missionInfo.startDate.causeNonValidation': null,
            'missionInfo.endDate.validated': true,
            'missionInfo.endDate.causeNonValidation': null,
            'missionInfo.isSimulationValidated.validated': true,
            'missionInfo.isSimulationValidated.causeNonValidation': null,
        };

        if (req.files['isSimulationValidated']) {
            resetFields['missionInfo.isSimulationValidated.value'] = files.isSimulationValidated[0].filename;
        }

        await NewMission.findOneAndUpdate({ _id: missionId }, { $set: resetFields });


        const updatedNewMission = await NewMission.findOneAndUpdate(
            { _id: missionId },
            {
                [`clientInfo.company.value`]: rhValidation.company,
                [`clientInfo.clientContact.firstName.value`]: rhValidation.clientfirstName,
                [`clientInfo.clientContact.lastName.value`]: rhValidation.clientlastName,
                [`clientInfo.clientContact.position.value`]: rhValidation.clientPostion,
                [`clientInfo.clientContact.email.value`]: rhValidation.clientEmail,
                [`clientInfo.clientContact.phoneNumber.value`]: rhValidation.clientphoneNumber,
                [`missionInfo.profession.value`]: rhValidation.profession,
                [`missionInfo.industrySector.value`]: rhValidation.industrySector,
                [`missionInfo.finalClient.value`]: rhValidation.finalClient,
                [`missionInfo.dailyRate.value`]: rhValidation.dailyRate,
                [`missionInfo.portage.value`]: rhValidation.dailyRate,
                [`missionInfo.startDate.value`]: rhValidation.startDate,
                [`missionInfo.endDate.value`]: rhValidation.endDate,
                [`missionInfo.isSimulationValidated.value`]: rhValidation.simulationValidation,
                [`newMissionStatus`]: "PENDING",
            },
            { new: true }
        );
        return res.json(updatedNewMission);
    } catch (error) {
        return res.status(500).json({ error: error });
    }

}

exports.validatePriseDeContactMission = async (req, res) => {
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

exports.validateClientValidationMission = async (req, res) => {
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

exports.validateJobCotractEditionMission = async (req, res) => {
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

exports.validateContractValidationMission = async (req, res) => {

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

        if (updatedContractProcess.statut) {
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
                                        company: mission.clientInfo.company,
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
                                    })

                            })
                            .catch((error) => {
                                console.error('Error:', error.message);
                            });
                    }


                })
                .catch((error) => {
                    console.error('Error:', error.message);
                });
        }


    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while updating ContractProcess.' });
    }
};

exports.getNewMissionnotValidatedById = async (req, res) => {

    try {
        const missionId = req.params.newMissionId

        await NewMission
            .findById(missionId)
            .then((newMission) => {
                return res.status(200).send(newMission)
            })
            .catch((error) => {
                return res.status(500).send({ error: error })
            })

    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while fetching missions.' });
    }
};

exports.getAllNewMissions = async (req, res) => {
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

exports.getPendingMissions = async (req, res) => {
    try {

        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ message: 'Token non fourni' });
        }
        const decoded = jwt.verify(token, serviceJWT.jwtSecret);
        const userId = decoded.userId

        await NewMission.find({ newMissionStatus: { $in: ['PENDING', 'WAITINGCONTRACT'] }, userId: userId })
            .then(pendingMissions => {
                console.log(pendingMissions)
                return res.json(pendingMissions);
            })
            .catch(error => {
                return res.status(500).json({ error: error });
            })

    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while fetching pending PreRegistrations.' });
    }
};

exports.getValidatedMissions = async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Token non fourni' });
    }
    const decoded = jwt.verify(token, serviceJWT.jwtSecret);
    const userId = decoded.userId


    try {


        const user = await User.findById(userId);
        const allMissions = [];


        user.missions.forEach(mission => {
            allMissions.push(mission.toObject());
        });

        return res.status(200).send(allMissions)
    } catch (e) {
        return res.status(500).send({ error: "Server error" })
    }
};

exports.getNotValidatedMissions = async (req, res) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ message: 'Token non fourni' });
        }
        const decoded = jwt.verify(token, serviceJWT.jwtSecret);
        const userId = decoded.userId

        const notValidatedNewMission = await NewMission.find({ newMissionStatus: { $in: ['NOTVALIDATED'] }, userId: userId });
        if (notValidatedNewMission.length === 0) {
            return res.status(404).json("There are not not validated new mission");
        } else {
            return res.json(notValidatedNewMission);
        }
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while fetching pending PreRegistrations.' });
    }
};

exports.killMission = async (req, res) => {
    const missionId = req.params.missionId;

    try {
        let updatedDocument;

        updatedDocument = await NewMission.findByIdAndUpdate(missionId, {
            missionKilled: true,
        });

        if (!updatedDocument) {
            updatedDocument = await PreRegistration.findByIdAndUpdate(missionId, {
                "missionInfo.missionKilled": true,
            });

            if (!updatedDocument) {
                return res.status(404).send("Mission Not Found");
            }

            const notification = new Notification({
                userId: updatedDocument.userId,
                typeOfNotification: "PREREGISTERKILLED",
                toWho: "CONSULTANT",
                note: req.body.note,
                missionId: updatedDocument._id,
            });

            await notification.save().then(() => {
                socketModule.getIO().emit("rhNotification", { notification: notification });
            }).catch(error => {
                console.log(error);
            });
        } else {
            const notification = new Notification({
                userId: updatedDocument.userId,
                typeOfNotification: "MISSIONKILLED",
                toWho: "CONSULTANT",
                note: req.body.note,
                missionId: updatedDocument._id,
            });

            await notification.save().then(() => {
                socketModule.getIO().emit("rhNotification", { notification: notification });
            }).catch(error => {
                console.log(error);
            });
        }

        res.status(200).send("Mission Killed Successfully");
    } catch (error) {
        console.error("Error killing mission:", error);
        res.status(500).send("Internal Server Error");
    }
};

