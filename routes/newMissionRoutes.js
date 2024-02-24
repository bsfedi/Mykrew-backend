const express = require('express');
const router = express.Router();
const {
    createNewMission,
    getMyNewMission,
    getNewMissionById,
    RHvalidation,
    consultantEdit,
    validateClientValidationMission,
    validateContractValidationMission,
    validateJobCotractEditionMission,
    validatePriseDeContactMission,
    getPendingMissions,
    getValidatedMissions,
    getNotValidatedMissions,
    killMission,
    getNewMissionnotValidatedById
} = require('../controllers/newMissionController');
const upload = require("../middlewares/uploadMiddleware");


router.post('/createNewMission/', upload.fields([
    { name: 'isSimulationValidated', maxCount: 1 },
]) , createNewMission);
router.get('/getMyMissions',getMyNewMission)
router.get('/getMissionById/:newMissionId',getNewMissionById)
router.get('/getPendingMissions',getPendingMissions)
router.get('/notValidatedNewMission',getNotValidatedMissions)
router.get('/getValidatedMissions',getValidatedMissions)
router.put('/rhValidation/:missionId',RHvalidation)

router.put('/killMission/:missionId', killMission)

router.put('/validatePriseDeContactMission/:contractProcessId',validatePriseDeContactMission)
router.put('/validateClientValidationMission/:contractProcessId',validateClientValidationMission)
router.put('/validateJobCotractEditionMission/:contractProcessId',validateJobCotractEditionMission)
router.put('/validateContractValidationMission/:contractProcessId',validateContractValidationMission)

router.put("/consultantEdit/:missionId",upload.fields([
    { name: 'isSimulationValidated', maxCount: 1 }
]),consultantEdit)
module.exports = router;
