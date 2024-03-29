const Notification = require("../models/notificationModel")
const User = require('../models/userModel');
const PreRegistration = require('../models/preRegistrationModel');
exports.getAllMyNotificationsConsultant = async (req, res) => {

    const userId = req.params.userId

    await Notification.find({ userId: userId, toWho: 'CONSULTANT' }).sort({ createdAt: -1 }).
        then(notifications => {
            if (notifications.length === 0) {
                return res.status(404).send({ error: "Notifications not found" })
            }
            else {
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
    try {
        const notifications = await Notification.find({ toWho: 'RH' }).sort({ createdAt: -1 });

        if (notifications.length === 0) {
            return res.status(404).send({ error: 'Notification not found!' });
        } else {
            const updatedNotifications = await Promise.all(notifications.map(async notification => {

                try {
                    if (notification.typeOfNotification == 'NEWPREREGISTER') {
                        const preregister = await PreRegistration.findOne({ _id: notification.preregisterId });
                        if (preregister) {
                            notification['userId'] = `${preregister.personalInfo.firstName.value} ${preregister.personalInfo.firstName.value}`;
                        } else {
                            notification['userId'] = ''; // Replace with empty string if user not found
                        }
                    }
                    else {
                        const user = await User.findOne({ _id: notification.userId });
                        if (user) {
                            notification['userId'] = `${user.personalInfo.firstName} ${user.personalInfo.lastName}`;
                        } else {
                            notification['userId'] = ''; // Replace with empty string if user not found
                        }
                    }

                } catch (error) {
                    console.error("Error finding user:", error);
                    notification['userId'] = ''; // Replace with empty string if error finding user
                }
                return notification;
            }));

            return res.status(200).send(updatedNotifications);
        }
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
};

exports.getRhNotificationsnotseen = async (req, res) => {
    try {
        const notifications = await Notification.find({ toWho: 'RH', isSeen: false }).sort({ createdAt: -1 });

        if (notifications.length === 0) {
            return res.status(404).send({ error: 'Notification not found!' });
        } else {
            const updatedNotifications = await Promise.all(notifications.map(async notification => {

                try {
                    const user = await User.findOne({ _id: notification.userId });
                    if (user) {
                        notification['userId'] = `${user.personalInfo.firstName} ${user.personalInfo.lastName}`;
                    } else {
                        notification['userId'] = ''; // Replace with empty string if user not found
                    }
                } catch (error) {
                    console.error("Error finding user:", error);
                    notification['userId'] = ''; // Replace with empty string if error finding user
                }
                return notification;
            }));

            return res.status(200).send(updatedNotifications);
        }
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
};

exports.markNotificationAsSeen = async (req, res) => {
    const notificationId = req.params.notificationId;

    try {
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).send({ error: "Notification not found" });
        } else {
            notification.isSeen = true;
            await notification.save();
            return res.status(200).send({ message: "Notification marked as seen successfully" });
        }
    } catch (error) {
        return res.status(500).send(error);
    }
};

exports.getMy5LastvirementsNotification = async (req, res) => {
    const userId = req.params.userId;

    try {
        const notifications = await Notification.find({
            userId: userId,
            toWho: 'CONSULTANT',
            typeOfNotification: "VIREMENT"
        })
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