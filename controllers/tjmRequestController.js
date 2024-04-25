const TjmRequest = require("../models/tjmRequestModel")
const NewMission = require("../models/newMissionModel")
const Preregister = require("../models/preRegistrationModel")
const Notification = require("../models/notificationModel")
const User = require("../models/userModel")
const socketModule = require("../configuration/socketConfig");
const jwt = require("jsonwebtoken");
const serviceJWT = require("../configuration/JWTConfig");



exports.createDemandeModifTjm = async (req, res) => {

    const tjmData = req.body;

    const files = req.files;
    const isSimulationValidatedFilename = files.isSimulationValidated ? files.isSimulationValidated[0].filename : null;
    const tjmRequest = new TjmRequest({
        userId: tjmData.userId,
        missionId: tjmData.missionId,
        datecompte: tjmData.datecompte,
        status: "PENDING",
        valueOfNewTjm: tjmData.valueOfNewTjm,
        simulationValidated: isSimulationValidatedFilename
    });

    await tjmRequest.save()
        .then(async tjmrequest => {
            if (tjmrequest) {

                const notification = new Notification({
                    userId: tjmrequest.userId,
                    typeOfNotification: "TJMREQUEST",
                    toWho: "RH",
                    tjmRequestId: tjmrequest._id,

                })
                await notification.save().then(notification => {
                    socketModule.getIO().emit("rhNotification", { notification: notification })
                })
                    .catch(error => {
                        console.log(error)
                    })
                return res.status(200).send(tjmrequest)
            }
        }).catch(error => {
            return res.status(500).send({ error: error })
        })

}

exports.RhTjmValidation = async (req, res) => {
    const tjmRequestId = req.params.tjmRequestId;
    const tjmReponse = req.body.response;
    const validated = tjmReponse ? "VALIDATED" : "NOTVALIDATED";

    const tjmRequest = await TjmRequest.findOneAndUpdate(
        { _id: tjmRequestId },
        { status: validated },
        { new: true }
    );

    if (!tjmRequest) {
        return res.status(404).send({ error: "TJM request not found" });
    }

    const users = await User.find();

    let userToUpdate;
    let missionToUpdate;

    for (const user of users) {
        missionToUpdate = user.missions.find(mission => mission._id == tjmRequest.missionId);

        if (missionToUpdate) {
            userToUpdate = user;
            break;
        }
    }

    if (tjmReponse) {
        if (missionToUpdate) {
            missionToUpdate.missionInfo.dailyRate = tjmRequest.valueOfNewTjm;
            missionToUpdate.missionInfo.isSimulationValidated = tjmRequest.simulationValidated
            await userToUpdate.save();
        } else {
            return res.status(404).send({ error: "Mission not found" });
        }


        const notification = new Notification({
            userId: tjmRequest.userId,
            typeOfNotification: "TJMREQUESTRESPONSEVALIDATED",
            toWho: "CONSULTANT",
            tjmRequestId: tjmRequest._id,
        });





        await notification.save().then(notification => {
            socketModule.getIO().emit("rhNotification", { notification: notification });
        });

        return res.status(200).send({ message: "Notification sent" });
    } else {
        const notification = new Notification({
            userId: tjmRequest.userId,
            typeOfNotification: "TJMREQUESTRESPONSENOTVALIDATED",
            toWho: "CONSULTANT",
            tjmRequestId: tjmRequest._id,
        });

        await notification.save().then(notification => {
            socketModule.getIO().emit("rhNotification", { notification: notification });
        });

        return res.status(200).send({ message: "Notification sent" });
    }
};

exports.getMyTjmRequest = async (req, res) => {

    const userId = req.params.userId

    await TjmRequest.find({ userId: userId }).then(requests => {
        if (requests) {
            return res.status(200).send(requests)
        } else {
            return res.status(404).send("il y a pas de requetes")
        }
    }).catch(error => {
        return res.status(500).send({ error: error })
    })
}

exports.getAllTjmRequest = async (req, res) => {
    try {
        const requests = await TjmRequest.find({ status: "PENDING" }).sort({ createdAt: -1 });

        if (requests.length > 0) {

            const users = await User.find({ _id: { $in: requests.map(request => request.userId) } });

            const userIdToUsernameMap = users.reduce((acc, user) => {
                acc[user._id] = user.personalInfo.firstName + " " + user.personalInfo.lastName;
                return acc;
            }, {});

            const requestsWithUsername = requests.map(request => {
                return {
                    ...request.toObject(),
                    username: userIdToUsernameMap[request.userId]
                };
            });

            return res.status(200).send(requestsWithUsername);
        } else {
            return res.status(404).send("Il n'y a pas de requêtes en attente");
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: "Erreur lors de la récupération des requêtes" });
    }
};


exports.getTjmRequestsByMissionId = async (req, res) => {
    try {
        const missionId = req.params.missionId

        await TjmRequest.findOne({ _id: missionId }).then(request => {
            if (!request) {
                return res.status(404).send("tjm request not found")
            } else {
                return res.status(200).send(request)
            }
        }).catch(error => {
            return res.status(500).send(error)
        })
    } catch (e) {
        return res.status(500).send("server error")
    }
}

exports.getallTjmRequestsByMissionId = async (req, res) => {
    try {
        const missionId = req.params.missionId;

        await TjmRequest.find({ missionId: missionId }).sort({ createdAt: -1 }).then(requests => {

            if (!requests || requests.length === 0) {
                return res.status(404).send("No TJM requests found for the provided mission ID");
            } else {
                return res.status(200).send(requests);
            }
        }).catch(error => {
            return res.status(500).send(error);
        });
    } catch (e) {
        return res.status(500).send("Server error");
    }
};
exports.getTjmStats = async (req, res) => {
    try {
        const tjms = await TjmRequest.find();

        let pendingTjmCount = 0;
        let preregistersNonTraites = 0;
        let preregistersTraites = 0;


        tjms.forEach(tjm => {
            if (tjm.status === 'PENDING') {
                pendingTjmCount++;
            }
        });
        let newMissions = 0;
        const totalCount = tjms.length;
        const missions = await NewMission.find();
        missions.forEach(mission => {
            if (mission.newMissionStatus === 'PENDING') {
                newMissions++;
            }

        });

        const preregisters = await Preregister.find();
        preregisters.forEach(preregister => {
            if (preregister.status === 'PENDING') {
                preregistersNonTraites++;
            } else if (preregister.status !== 'NOTEXIST' || !preregister.status !== 'PENDING') {
                preregistersTraites++;
            }

        });
        const allPreregisters = preregisters.length;

        res.json({
            pendingTjmCount,
            newMissions,
            preregistersNonTraites,
            preregistersTraites,
            allPreregisters,
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

