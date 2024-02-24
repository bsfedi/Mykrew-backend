const cron = require('node-cron');
const PreRegistration = require('../models/preRegistrationModel');



cron.schedule('0 0 1 * *', async () => {
    try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const preRegistrationsToUpdate = await PreRegistration.find({
            addedDate: { $lte: oneMonthAgo },
            status: { $in: ['PENDING', 'NOTVALIDATED',] },
        });

        for (const preRegistration of preRegistrationsToUpdate) {
            preRegistration.status = 'PENDINGTOKILL';
            preRegistration.pendingToKillDate = new Date();
            await preRegistration.save();
        }

        console.log('Statut mis à jour pour les pré-enregistrements dépassant un mois.');
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut de pré-enregistrement :', error);
    }
});
