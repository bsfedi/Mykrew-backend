const PreRegistration = require('../models/preRegistrationModel.js');
const ContractProcess = require('../models/contractModel.js');
const Notification = require('../models/notificationModel.js');
const jwt = require('jsonwebtoken');
const serviceJWT = require('../configuration/JWTConfig');
const emailService = require('../services/emailService');
const emailTemplates = require('../services/emailTemplates/emailTemplates');
const { checkEmptyFields } = require("../utils/utils");
const socketModule = require('../configuration/socketConfig');
const User = require('../models/userModel');

exports.createPreRegistration1 = async (req, res) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ message: 'Token non fourni' });
        }
        const decoded = jwt.verify(token, serviceJWT.jwtSecret);
        const user = await User.findById(decoded.userId);

        const register = decoded.preRegistration
        const personalInfo = req.body;
        const updatedPreRegistration = await PreRegistration.findOneAndUpdate(
            { _id: register },
            {
                [`personalInfo.firstName.value`]: personalInfo.firstName,
                [`personalInfo.lastName.value`]: personalInfo.lastName,
                [`personalInfo.email.value`]: user.email,
                [`personalInfo.phoneNumber.value`]: personalInfo.phoneNumber,
                [`personalInfo.portage.value`]: personalInfo.portage,
                [`personalInfo.dateOfBirth.value`]: personalInfo.dateOfBirth,
                [`personalInfo.location.value`]: personalInfo.location,
                [`personalInfo.nationality.value`]: personalInfo.nationality,
            },
            { new: true }
        );
        const emailSubject = 'PreRegister Created';
        const emailHTML = emailTemplates.preregisterTemplate;

        emailService.sendEmail(user.email, emailSubject, emailHTML)
            .then((success) => {
                if (success) {
                    console.log('Email sent successfully.');
                } else {
                    console.log('Failed to send email.');
                }
            })
            .catch((error) => {
                console.error('Error while sending email:', error);
            });
        return res.json(updatedPreRegistration);
    } catch (error) {
        return res.status(500).json({ error: error });
    }
};

exports.createPreRegistration2 = async (req, res) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ message: 'Token non fourni' });
        }
        const decoded = jwt.verify(token, serviceJWT.jwtSecret);
        const register = decoded.preRegistration
        const clientInfo = req.body;
        const updatedPreRegistration = await PreRegistration.findOneAndUpdate(
            { _id: register },
            {
                [`clientInfo.company.value`]: clientInfo.company,
                [`clientInfo.clientContact.firstName.value`]: clientInfo.firstName,
                [`clientInfo.clientContact.lastName.value`]: clientInfo.lastName,
                [`clientInfo.clientContact.position.value`]: clientInfo.position,
                [`clientInfo.clientContact.email.value`]: clientInfo.email,
                [`clientInfo.clientContact.phoneNumber.value`]: clientInfo.phoneNumber,
            },
            { new: true }
        );

        return res.json(updatedPreRegistration);
    } catch (error) {
        return res.status(500).json({ error: error });
    }
};

exports.createPreRegistration3 = async (req, res) => {

    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Token non fourni' });
    }
    const decoded = jwt.verify(token, serviceJWT.jwtSecret);
    const register = decoded.preRegistration
    const missionInfo = req.body;
    const files = req.files;
    const isSimulationValidatedFilename = files.isSimulationValidated ? files.isSimulationValidated[0].filename : null;
    const updatedPreRegistration = await PreRegistration.findOneAndUpdate(
        { _id: register },
        {
            [`missionInfo.profession.value`]: missionInfo.profession,
            [`missionInfo.industrySector.value`]: missionInfo.industrySector,
            [`missionInfo.finalClient.value`]: missionInfo.finalClient,
            [`missionInfo.dailyRate.value`]: missionInfo.dailyRate,
            [`missionInfo.startDate.value`]: missionInfo.startDate,
            [`missionInfo.endDate.value`]: missionInfo.endDate,
            [`missionInfo.isSimulationValidated.value`]: isSimulationValidatedFilename,
            [`status`]: 'PENDING',
        },
        { new: true }
    );
    const notification = new Notification({
        userId: updatedPreRegistration.userId,
        typeOfNotification: "NEWPREREGISTER",
        toWho: "RH",
        preregisterId: updatedPreRegistration._id,

    })
    await notification.save().
        then(notification => {
            socketModule.getIO().emit("rhNotification", { notification: notification })
        })
        .catch(error => {
            console.log(error)
        })

    return res.json(updatedPreRegistration);

};

exports.createPreRegistration5 = async (req, res) => {

    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Token non fourni' });
    }
    const decoded = jwt.verify(token, serviceJWT.jwtSecret);
    const register = decoded.preRegistration
    const missionInfo = req.body;
    const files = req.files;
    const isSimulationValidatedFilename = files.isSimulationValidated ? files.isSimulationValidated[0].filename : null;
    const updatedPreRegistration = await PreRegistration.findOneAndUpdate(
        { _id: register },
        {
            [`missionInfo.profession.value`]: missionInfo.profession,
            [`missionInfo.industrySector.value`]: missionInfo.industrySector,
            [`missionInfo.finalClient.value`]: missionInfo.finalClient,
            [`missionInfo.dailyRate.value`]: missionInfo.dailyRate,
            [`missionInfo.startDate.value`]: missionInfo.startDate,
            [`missionInfo.endDate.value`]: missionInfo.endDate,
            [`missionInfo.isSimulationValidated.value`]: isSimulationValidatedFilename,
            [`missionInfo.missionKilled`]: false,
        },
        { new: true }
    );

    return res.json(updatedPreRegistration);

};


exports.createPreRegistration4 = async (req, res) => {

    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Token non fourni' });
    }
    const decoded = jwt.verify(token, serviceJWT.jwtSecret);
    const register = decoded.preRegistration
    const personalInfo = req.body;
    const files = req.files;
    const drivingLicenseFilename = files.drivingLicense ? files.drivingLicense[0].filename : null;
    const ribDocumentFilename = files.ribDocument ? files.ribDocument[0].filename : null;

    const updatedPreRegistration = await PreRegistration.findOneAndUpdate(
        { _id: register },
        {
            [`personalInfo.socialSecurityNumber.value`]: personalInfo.socialSecurityNumber,
            [`personalInfo.identificationDocument.value`]: files.identificationDocument[0].filename,
            [`personalInfo.rib.value`]: personalInfo.rib,
            [`personalInfo.ribDocument.value`]: ribDocumentFilename,
            [`personalInfo.carInfo.hasCar.value`]: personalInfo.hasCar,
            [`personalInfo.carInfo.drivingLicense.value`]: drivingLicenseFilename
        },
        { new: true }
    );
    return res.json(updatedPreRegistration);

};

exports.getPreRegistrationById = async (req, res) => {
    const preRegistrationId = req.params.preRegistrationId;

    try {
        const preRegistration = await PreRegistration
            .findById(preRegistrationId)

        if (!preRegistration) {
            return res.status(404).json({ error: 'PreRegistration not found.' });
        }

        return res.json(preRegistration);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while fetching PreRegistration.' });
    }
};

exports.getMyPreRegistration = async (req, res) => {

    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Token non fourni' });
    }
    const decoded = jwt.verify(token, serviceJWT.jwtSecret);
    const preRegistrationId = decoded.preRegistration
    try {
        const preRegistration = await PreRegistration
            .findById(preRegistrationId)


        if (!preRegistration) {
            return res.status(404).json({ error: 'PreRegistration not found.' });
        }

        return res.json(preRegistration);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while fetching PreRegistration.' });
    }
};

exports.RHvalidation = async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Token non fourni' });
    }
    const decoded = jwt.verify(token, serviceJWT.jwtSecret);
    const role = decoded.role

    if (role === "CONSULTANT") {
        return res.status(403).send({ error: "Unauthorized" })
    }
    try {
        let validated;
        const rhValidation = req.body
        const registerId = req.params.preRegistrationId

        const rhValidationValues = Object.values(rhValidation);
        const isFalseValuePresent = rhValidationValues.includes(false);
        if (isFalseValuePresent) {
            validated = "NOTVALIDATED"
        } else {
            validated = "WAITINGCONTRACT"

            const newContractProcess = new ContractProcess();
            const savedContractProcess = await newContractProcess.save();

            await PreRegistration.findOneAndUpdate(
                { _id: registerId },
                {
                    contractProcess: savedContractProcess._id,
                },
                { new: true }
            );



        }

        const updatedPreRegistration = await PreRegistration.findOneAndUpdate(
            { _id: registerId },
            {
                [`personalInfo.firstName.validated`]: rhValidation.firstNameValidation,
                [`personalInfo.firstName.causeNonValidation`]: rhValidation.firstNameCause,
                [`personalInfo.lastName.validated`]: rhValidation.lastNameValidation,
                [`personalInfo.lastName.causeNonValidation`]: rhValidation.lastNameCause,
                [`personalInfo.email.validated`]: rhValidation.emailValidation,
                [`personalInfo.email.causeNonValidation`]: rhValidation.emailCause,
                [`personalInfo.phoneNumber.validated`]: rhValidation.phoneNumberValidation,
                [`personalInfo.phoneNumber.causeNonValidation`]: rhValidation.phoneNumberCause,
                [`personalInfo.dateOfBirth.validated`]: rhValidation.dateOfBirthValidaton,
                [`personalInfo.dateOfBirth.causeNonValidation`]: rhValidation.dateOfBirthCause,
                [`personalInfo.location.validated`]: rhValidation.locationValidation,
                [`personalInfo.location.causeNonValidation`]: rhValidation.locationCause,
                [`personalInfo.nationality.validated`]: rhValidation.nationalityValidation,
                [`personalInfo.nationality.causeNonValidation`]: rhValidation.nationalityCause,
                [`personalInfo.socialSecurityNumber.validated`]: rhValidation.socialSecurityNumberValidation,
                [`personalInfo.socialSecurityNumber.causeNonValidation`]: rhValidation.socialSecurityNumberCause,
                [`personalInfo.identificationDocument.validated`]: rhValidation.identificationDocumentValidation,
                [`personalInfo.identificationDocument.causeNonValidation`]: rhValidation.identificationDocumentCause,
                [`personalInfo.rib.validated`]: rhValidation.ribValidation,
                [`personalInfo.rib.causeNonValidation`]: rhValidation.ribCause,
                [`personalInfo.ribDocument.validated`]: rhValidation.ribDocumentValidation,
                [`personalInfo.ribDocument.causeNonValidation`]: rhValidation.ribDocumentCause,
                [`personalInfo.carInfo.drivingLicense.validated`]: rhValidation.drivingLicenseValidation,
                [`personalInfo.carInfo.drivingLicense.causeNonValidation`]: rhValidation.drivingLicenseCause,
                [`personalInfo.carInfo.carRegistration.validated`]: rhValidation.carRegistrationValidation,
                [`personalInfo.carInfo.carRegistration.causeNonValidation`]: rhValidation.carRegistrationCause,
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
                [`personalInfo.portage.validated`]: rhValidation.portageValidated,
                [`personalInfo.portage.causeNonValidation`]: rhValidation.portageCause,
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
                [`status`]: validated,
            },
            { new: true }
        );




        if (!updatedPreRegistration) {
            return res.status(404).json({ error: "preregister not found" });
        }

        return res.json(updatedPreRegistration);
    } catch (error) {
        return res.status(500).json({ error: error });
    }

}

exports.getPendingPreRegistrations = async (req, res) => {
    try {
        const pendingPreRegistrations = await PreRegistration.find({ status: { $in: ['VALIDATED', 'PENDING', 'NOTVALIDATED'], $nin: ['NOTEXIST'] } });

        return res.json(pendingPreRegistrations);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while fetching pending PreRegistrations.' });
    }
};

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
        const excludedFields = ['identificationDocument', 'drivingLicense', 'simulationValidation'];
        const hasEmptyField = checkEmptyFields(rhValidation, excludedFields);

        if (hasEmptyField) {
            return res.status(400).json({ error: 'Tous les champs doivent être renseignés.' });
        }
        const registerId = req.params.preRegistrationId;
        const files = req.files;
        const resetFields = {
            'personalInfo.firstName.validated': true,
            'personalInfo.firstName.causeNonValidation': null,
            'personalInfo.lastName.validated': true,
            'personalInfo.lastName.causeNonValidation': null,
            'personalInfo.email.validated': true,
            'personalInfo.email.causeNonValidation': null,
            'personalInfo.phoneNumber.validated': true,
            'personalInfo.phoneNumber.causeNonValidation': null,
            'personalInfo.dateOfBirth.validated': true,
            'personalInfo.dateOfBirth.causeNonValidation': null,
            'personalInfo.location.validated': true,
            'personalInfo.location.causeNonValidation': null,
            'personalInfo.nationality.validated': true,
            'personalInfo.nationality.causeNonValidation': null,
            'personalInfo.socialSecurityNumber.validated': true,
            'personalInfo.socialSecurityNumber.causeNonValidation': null,
            'personalInfo.identificationDocument.validated': true,
            'personalInfo.identificationDocument.causeNonValidation': null,
            'personalInfo.ribDocument.validated': true,
            'personalInfo.ribDocument.causeNonValidation': null,
            'personalInfo.rib.validated': true,
            'personalInfo.rib.causeNonValidation': null,
            'personalInfo.carInfo.hasCar.validated': true,
            'personalInfo.carInfo.hasCar.causeNonValidation': null,
            'personalInfo.carInfo.drivingLicense.validated': true,
            'personalInfo.carInfo.drivingLicense.causeNonValidation': null,
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
            'personalInfo.portage.validated': true,
            'personalInfopersonalInfo.portage.causeNonValidation': null,
            'missionInfo.dailyRate.validated': true,
            'missionInfo.dailyRate.causeNonValidation': null,
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

        if (req.files['drivingLicense']) {
            resetFields['personalInfo.carInfo.drivingLicense.value'] = files.drivingLicense[0].filename;
        }

        if (req.files['identificationDocument']) {
            resetFields['personalInfo.identificationDocument.value'] = files.identificationDocument[0].filename;
        }

        if (req.files['ribDocument']) {
            resetFields['personalInfo.ribDocument.value'] = files.ribDocument[0].filename;
        }

        await PreRegistration.findOneAndUpdate({ _id: registerId }, { $set: resetFields });


        const updatedPreRegistration = await PreRegistration.findOneAndUpdate(
            { _id: registerId },
            {
                [`personalInfo.firstName.value`]: rhValidation.firstName,
                [`personalInfo.lastName.value`]: rhValidation.lastName,
                [`personalInfo.email.value`]: rhValidation.email,
                [`personalInfo.phoneNumber.value`]: rhValidation.phoneNumber,
                [`personalInfo.dateOfBirth.value`]: rhValidation.dateOfBirth,
                [`personalInfo.location.value`]: rhValidation.location,
                [`personalInfo.nationality.value`]: rhValidation.nationality,
                [`personalInfo.socialSecurityNumber.value`]: rhValidation.socialSecurityNumber,
                [`personalInfo.identificationDocument.value`]: rhValidation.identificationDocument,
                [`personalInfo.ribDocument.value`]: rhValidation.ribDocument,
                [`personalInfo.rib.value`]: rhValidation.rib,
                [`personalInfo.carInfo.hasCar.value`]: rhValidation.hasCar,
                [`personalInfo.carInfo.drivingLicense.value`]: rhValidation.drivingLicense,
                [`clientInfo.company.value`]: rhValidation.company,
                [`clientInfo.clientContact.firstName.value`]: rhValidation.clientfirstName,
                [`clientInfo.clientContact.lastName.value`]: rhValidation.clientlastName,
                [`clientInfo.clientContact.position.value`]: rhValidation.clientPostion,
                [`clientInfo.clientContact.email.value`]: rhValidation.clientEmail,
                [`clientInfo.clientContact.phoneNumber.value`]: rhValidation.clientphoneNumber,
                [`missionInfo.profession.value`]: rhValidation.profession,
                [`missionInfo.industrySector.value`]: rhValidation.industrySector,
                [`missionInfo.finalClient.value`]: rhValidation.finalClient,
                [`personalInfo.portage.value`]: rhValidation.industrySector,
                [`missionInfo.dailyRate.value`]: rhValidation.dailyRate,
                [`missionInfo.startDate.value`]: rhValidation.startDate,
                [`missionInfo.endDate.value`]: rhValidation.endDate,
                [`missionInfo.isSimulationValidated.value`]: rhValidation.simulationValidation,
                [`status`]: "PENDING",
            },
            { new: true }
        );






        return res.json(updatedPreRegistration);
    } catch (error) {
        return res.status(500).json({ error: error });
    }

}

exports.killPreregister = async (req, res) => {

    try {
        const preregisterId = req.params.preregisterId;
        await PreRegistration.findOneAndUpdate(
            { _id: preregisterId },
            { 'missionInfo.missionKilled': true },
            { new: true })
            .then(preregistration => {
                return res.status(200).send(preregistration)
            }).catch(error => {
                return res.status(500).send({ error: "Server Error" })
            })
    } catch (e) {
        return res.status(500).send({ error: "Server Error" })
    }


}

exports.getPending = async (req, res) => {
    try {
        const pendingPreRegistrations = await PreRegistration.find({ status: { $in: ['PENDING', 'NOTVALIDATED', 'WAITINGCONTRACT'] } });
        if (pendingPreRegistrations.length === 0) {
            return res.status(404).json("There are not pending preregisters");
        } else {
            return res.json(pendingPreRegistrations);
        }
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while fetching pending PreRegistrations.' });
    }
};


exports.getValidated = async (req, res) => {
    try {
        const pendingPreRegistrations = await PreRegistration.find({ status: { $in: ['VALIDATED'] }, isArchived: false }).sort({ addedDate: -1 });
        if (pendingPreRegistrations.length === 0) {
            return res.status(404).json("There are not validated preregisters");
        } else {
            return res.json(pendingPreRegistrations);
        }
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while fetching pending PreRegistrations.' });
    }
};

exports.updateconsultantstauts = async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Token non fourni' });
    }
    try {
        const decoded = jwt.verify(token, serviceJWT.jwtSecret);
        if (decoded.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(301).json({ message: 'Token expiré' });
        }
        return res.status(500).json({ message: 'Erreur lors de la vérification du token' });
    }

    const isArchived = req.body.isArchived;
    const preregister_id = req.params.preregister_id;

    await PreRegistration.findOneAndUpdate({ _id: preregister_id },
        { isArchived: isArchived },
        { new: true }).then(updatedUser => {
            if (!updatedUser) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }
            return res.status(200).json(updatedUser);
        }).catch(error => {
            res.status(500).json({ message: error.message });
        })
}

exports.getARchived = async (req, res) => {
    try {
        await PreRegistration.find({ status: { $in: ['VALIDATED'] }, isArchived: true }).sort({ addedDate: -1 }).then(preregisters => {
            if (preregisters.length === 0) {
                return res.status(404).send("users not found !")

            } else {
                return res.status(200).send(preregisters)
            }

        })
    } catch (e) {
        console.log(e)
        return res.status(500).send("server error")

    }
}

exports.getNotValidated = async (req, res) => {
    try {
        const pendingPreRegistrations = await PreRegistration.find({ status: { $in: ['NOTVALIDATED'] } });
        if (pendingPreRegistrations.length === 0) {
            return res.status(404).json("There are not not validated preregisters");
        } else {
            return res.json(pendingPreRegistrations);
        }
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred while fetching pending PreRegistrations.' });
    }
};