const Notification = require("../models/notificationModel")

exports.getAllMyNotificationsConsultant = async (req, res) =>{

    const userId = req.params.userId

    await Notification.find({userId: userId, toWho: 'CONSULTANT'}).
        then(notifications => {
            if (notifications.length === 0){
                return res.status(404).send({error: "Notifications not found"})
            }
            else{
                return res.status(200).send(notifications)
            }
    }).catch(error => {
        return res.status(500).send(error)
    })

}

exports.getMy5LastNotificationsConsultant = async (req, res) => {
    const userId = req.params.userId;

    try {
        const notifications = await Notification.find({ userId: userId, toWho: 'CONSULTANT' })
            .sort({ createdAt: -1 })
            .limit(5);

        if (notifications.length === 0) {
            return res.status(404).send({ error: "Notifications not found" });
        } else {
            return res.status(200).send(notifications);
        }
    } catch (error) {
        return res.status(500).send(error);
    }
};

exports.getRhNotifications = async (req, res) => {

    await Notification.find({toWho: 'RH'}).
        sort({createdAt: -1}).
        then(notifications => {
            if (notifications.length === 0){
                return res.status(404).send({error: 'notification not found!'})
            }
            else{
                return res.status(200).send(notifications)
            }
    }).catch(error => {
        return res.status(500).send({error: error})

    })
}


exports.getMy5LastvirementsNotification = async (req, res) => {
    const userId = req.params.userId;

    try {
        const notifications = await Notification.find({
            userId: userId,
            toWho: 'CONSULTANT',
            typeOfNotification:"VIREMENT"})
            .sort({ createdAt: -1 })
            .limit(5);

        if (notifications.length === 0) {
            return res.status(404).send({ error: "Notifications not found" });
        } else {
            return res.status(200).send(notifications);
        }
    } catch (error) {
        return res.status(500).send(error);
    }
};