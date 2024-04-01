const express = require('express');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();
const { createPreRegistration1,
    createPreRegistration2,
    createPreRegistration3,
    createPreRegistration4,
    getPreRegistrationById,
    RHvalidation,
    getMyPreRegistration,
    getPendingPreRegistrations,
    consultantEdit,
    getPending,
    getValidated,
    getNotValidated,
    getAllPregister,
    killPreregister,
    getARchived,
    updateconsultantstauts,
    createPreRegistration5
} = require('../controllers/preRegistrationController');

router.get('/archived', getARchived);
router.post('/create', createPreRegistration1);
router.post('/create4', upload.fields([
    { name: 'drivingLicense', maxCount: 1 },
    { name: 'identificationDocument', maxCount: 1 },
    { name: 'ribDocument', maxCount: 1 }
]), createPreRegistration4);
router.post('/create2', createPreRegistration2);
router.post('/create3', upload.fields([
    { name: 'isSimulationValidated', maxCount: 1 },
]), createPreRegistration3);
router.post('/create5', upload.fields([
    { name: 'isSimulationValidated', maxCount: 1 },
]), createPreRegistration5);
router.get('/getPreinscriptionById/:preRegistrationId', getPreRegistrationById);
router.get('/getMyPreRegister', getMyPreRegistration);
router.get('/getPending', getPending);
router.get('/getValidated', getValidated);
router.get('/getNotValidated', getNotValidated);
router.get('/getPendingPreregisters', getPendingPreRegistrations);
router.put('/rhValidation/:preRegistrationId', RHvalidation);

router.put('/updateconsultantstauts/:preregister_id', updateconsultantstauts);

router.put("/consultantEdit/:preRegistrationId", upload.fields([
    { name: 'drivingLicense', maxCount: 1 },
    { name: 'identificationDocument', maxCount: 1 },
    { name: 'isSimulationValidated', maxCount: 1 },
    { name: 'ribDocument', maxCount: 1 }
]), consultantEdit)

router.put('/killPreregister/:preregisterId', killPreregister)
module.exports = router;