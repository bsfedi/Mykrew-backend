const express = require('express');
const router = express.Router();
const { createDemandeModifTjm,
        RhTjmValidation,
        getAllTjmRequest,
        getMyTjmRequest,
        getTjmRequestsByMissionId,
        getTjmStats} = require('../controllers/tjmRequestController');
const upload = require("../middlewares/uploadMiddleware");


router.post('/createTjmRequest', upload.fields([
        { name: 'isSimulationValidated', maxCount: 1 },
]), createDemandeModifTjm);
router.put('/rhTjmValidation/:tjmRequestId', RhTjmValidation);
router.get('/getMyTjmRequest/:userId', getMyTjmRequest);
router.get('/getAllTjmRequest/', getAllTjmRequest);
router.get('/getTjmStats/', getTjmStats);
router.get('/getTjmRequestsByMissionId/:missionId', getTjmRequestsByMissionId);
module.exports = router;

