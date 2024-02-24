const Virement = require('../models/virementModel')
const moment = require('moment');
const socketModule = require('../configuration/socketConfig');
const Notification = require("../models/notificationModel");

exports.createVirement = async (req, res) => {

    const virementInfo = req.body

    const virement = new Virement({
        userId: virementInfo.userId,
        typeVirement: virementInfo.typeVirement,
        montant: virementInfo.montant
    })

    await virement.save()
        .then(async virement => {

            const notification = new Notification({
                userId: virementInfo.userId,
                typeOfNotification: "VIREMENT",
                toWho: "CONSULTANT",
                virementId: virement._id,

            })
            await notification.save().then(notification => {
                socketModule.getIO().emit("rhNotification", {notification: notification})
            })
                .catch(error => {
                    console.log(error)
                })

            return res.status(200).send(virement)
        })
        .catch(error => {
            return res.status(500).send({error: error})
        })
}

exports.getVirementsByType = async (req, res) => {
    const typeVirement = req.params.typeVirement;

    try {
        const virements = await Virement.find({ typeVirement: typeVirement });

        if (!virements || virements.length === 0) {
            return res.status(404).json({ message: `Aucun virement trouvé pour le type ${typeVirement}` });
        }

        return res.status(200).json(virements);
    } catch (error) {
        console.error(`Erreur lors de la récupération des virements de type ${typeVirement}:`, error);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
};

exports.getAllVirements = async (req, res) => {
    try {
        const virements = await Virement.find();

        if (!virements || virements.length === 0) {
            return res.status(404).json({ message: 'Aucun virement trouvé' });
        }

        return res.status(200).json(virements);
    } catch (error) {
        console.error('Erreur lors de la récupération de tous les virements :', error);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
};

exports.getVirementsByUserId = async (req, res) => {
    const userId = req.params.userId;

    try {
        const virements = await Virement.find({ userId: userId });

        if (!virements || virements.length === 0) {
            return res.status(404).json({ message: `Aucun virement trouvé pour l'utilisateur avec l'ID ${userId}` });
        }

        return res.status(200).json(virements);
    } catch (error) {
        console.error(`Erreur lors de la récupération des virements pour l'utilisateur avec l'ID ${userId} :`, error);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
};

exports.getVirementsByPeriode = async (req, res) => {
    const periode = req.params.periode;

    let startDate;
    switch (periode) {
        case 'today':
            startDate = moment().startOf('day');
            break;
        case '7days':
            startDate = moment().subtract(7, 'days');
            break;
        case 'month':
            startDate = moment().subtract(1, 'months');
            break;
        case 'year':
            startDate = moment().subtract(1, 'years');
            break;
        default:
            return res.status(400).json({ message: 'Période non prise en charge' });
    }

    try {
        const virements = await Virement.find({
            createdAt: { $gte: startDate.toDate() }
        });

        if (!virements || virements.length === 0) {
            return res.status(404).json({ message: `Aucun virement trouvé pour la période spécifiée` });
        }

        return res.status(200).json(virements);
    } catch (error) {
        console.error(`Erreur lors de la récupération des virements pour la période spécifiée :`, error);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
};

exports.getVirementsStatsByYear = async (req, res) => {
    const year = req.params.year;
    const userId = req.params.userId;

    try {
        const virementsStats = await Virement.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${Number(year) + 1}-01-01`) },
                    userId: userId
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalCooptation: {
                        $sum: {
                            $cond: { if: { $eq: ["$typeVirement", "Cooptation"] }, then: "$montant", else: 0 }
                        }
                    },
                    totalParticipation: {
                        $sum: {
                            $cond: { if: { $eq: ["$typeVirement", "Participation"] }, then: "$montant", else: 0 }
                        }
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        if (!virementsStats || virementsStats.length === 0) {
            return res.status(404).json({ message: `Aucun virement trouvé pour l'année ${year}` });
        }

        const seriesDataCooptation = virementsStats.map(stat => stat.totalCooptation);
        const seriesDataParticipation = virementsStats.map(stat => stat.totalParticipation);
        const months = virementsStats.map(stat => moment(stat._id, "M").format("MMMM"));

        return res.status(200).json({
            series: [
                { name: 'Cooptation', data: seriesDataCooptation },
                { name: 'Participation', data: seriesDataParticipation }
            ],
            categories: months
        });
    } catch (error) {
        console.error(`Erreur lors de la récupération des statistiques des virements pour l'année ${year} :`, error);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
};

