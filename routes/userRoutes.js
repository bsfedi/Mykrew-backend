const express = require('express');
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();
const { register,
        craInformation,
        resetPassword,
        sendForgotPasswordMail,
        sendemailtoconsultant,
        login,
        updatedUser,
        createUserByAdmin,
        getMissionsByUserId,
        getMissionByMissionId,
        getMissionsByJWT,
        getPersonnalInfoByUserId,
        getPreregisterByUserId,
        addDocumentToUser,
        getAllDocuments,
        editIdentificationDocument,
        editDrivingLiscence,
        editRibDocument,
        getMonthlyStatsForAllUsers,
        getConsultantStats,
        updateCraInformations,
        getCraInformations,
        getConsultantUsers,
        getRhUsers,
        updateUserByAdmin,
        updateAccountVisibility,
        updatePassword,
        addPDFtoUser,
        getAllCras } = require('../controllers/userController');


router.post('/resetPassword/:user_id', resetPassword)
router.post('/sendForgotPasswordMail', sendForgotPasswordMail)
router.post('/sendemailtoconsultant', sendemailtoconsultant)
router.get('/craInformation/', craInformation)
router.post('/register/', register);
router.post('/login/', login);

router.post('/createByAdmin/', createUserByAdmin);
router.get('/getMissions/:userId', getMissionsByUserId);
router.get('/getPersonnalInfoByUserId/:userId', getPersonnalInfoByUserId);
router.get('/getMissionById/:newMissionId', getMissionByMissionId);
router.get('/getMyMissions', getMissionsByJWT);
router.get('/getMonthlyStatsForAllUsers', getMonthlyStatsForAllUsers);

router.get('/getConsultantStats', getConsultantStats);
router.get('/getrhUsers', getRhUsers);
router.get('/getConsultantusers', getConsultantUsers);

router.get('/getPreregisterByUserId/:userId', getPreregisterByUserId);

router.get('/getAllcras/:userId', getAllCras);
router.put('/updateuser/:userId', updatedUser)
router.put('/updatepassword/:userId', updatePassword)
router.get('/getAllDacuments/:userId', getAllDocuments);
router.put('/addDocumentToUser/:userId', upload.fields([
        { name: 'userDocument', maxCount: 1 },
]), addDocumentToUser)
router.put('/updateUserByAdmin/:userId', updateUserByAdmin);
router.put('/updateAccountVisibility/:userId', updateAccountVisibility);
router.put('/updateCra/:missionId', upload.fields([
        { name: 'signature', maxCount: 1 },
]), updateCraInformations)

router.get('/getCraInformations/:missionId', getCraInformations)

router.put('/editIdentificationDocument/:userId', upload.fields([
        { name: 'identificationDocument', maxCount: 1 },
]), editIdentificationDocument)

router.put('/addCraPdfToUser/:missionId', upload.fields([
        { name: 'craPdf', maxCount: 1 },
]), addPDFtoUser)

router.put('/editDrivingLiscence/:userId', upload.fields([
        { name: 'drivingLicense', maxCount: 1 },
]), editDrivingLiscence)
router.put('/editRibDocument/:userId', upload.fields([
        { name: 'ribDocument', maxCount: 1 },
]), editRibDocument)
module.exports = router;
