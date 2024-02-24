const express = require('express');

const router = express.Router();
const {
    getContractByPreregisterId,
    validatePriseDeContact,
    validateClientValidation,
    validateJobCotractEdition,
    validateContractValidation,
    getContractById
        } = require('../controllers/contractProcessController');



router.get('/getContaractByPrerigister/:preRegistrationId', getContractByPreregisterId);
router.get('/getContaractById/:contractProcessId', getContractById);
router.put('/validatePriseDeContact/:contractProcessId', validatePriseDeContact);
router.put('/validateClientValidation/:contractProcessId', validateClientValidation);
router.put('/validateJobCotractEdition/:contractProcessId', validateJobCotractEdition);
router.put('/validateContractValidation/:contractProcessId', validateContractValidation);


module.exports = router;