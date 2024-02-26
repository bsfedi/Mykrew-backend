const express = require('express');
const router = express.Router();
const { createVirement,
        getVirementsByType,
        getAllVirements,
        getVirementsByUserId,
        getVirementsByPeriode,
        getVirementsStatsByYear} = require('../controllers/virementController');


router.post('/createVirement', createVirement);
router.get('/virements/:typeVirement', getVirementsByType);
router.get('/virements', getAllVirements);
router.get('/getMyvirements/:userId', getVirementsByUserId);
router.get('/virementByPeriod/:userId', getVirementsByPeriode);
router.get('/virements/year-stats/:year/:userId', getVirementsStatsByYear);

module.exports = router;

