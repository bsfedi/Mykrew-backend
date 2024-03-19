const express = require('express');
const router = express.Router();
const { getAllMyNotificationsConsultant,
    getMy5LastNotificationsConsultant,
    getRhNotifications,
    markNotificationAsSeen,
    getMy5LastvirementsNotification } = require('../controllers/notificationController');


router.get('/getAllMyNotifications/:userId', getAllMyNotificationsConsultant);
router.get('/getlastnotification/:userId', getMy5LastNotificationsConsultant);
router.get('/getMy5LastvirementsNotification/:userId', getMy5LastvirementsNotification);
router.get('/getRhNotification/', getRhNotifications);
router.get('/markNotificationAsSeen/:notificationId', markNotificationAsSeen);

module.exports = router;

