const Virement = require('../models/virementModel')
const moment = require('moment');
const socketModule = require('../configuration/socketConfig');
const Notification = require("../models/notificationModel");
const User = require('../models/userModel');
exports.createVirement = async (req, res) => {

    const virementInfo = req.body

    const virement = new Virement({
        rhId: virementInfo.rhId,
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
                socketModule.getIO().emit("rhNotification", { notification: notification })
            })
                .catch(error => {
                    console.log(error)
                })

            return res.status(200).send(virement)
        })
        .catch(error => {
            return res.status(500).send({ error: error })
        })
}

exports.getVirementsByType = async (req, res) => {
    const typeVirement = req.params.typeVirement;

    try {
        const virements = await Virement.find({ typeVirement: typeVirement });

        if (!virements || virements.length === 0) {
            return res.status(200).json({ message: `Aucun virement trouvé pour le type ${typeVirement}` });
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
            return res.status(200).json({ message: 'Aucun virement trouvé' });
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
        const user = await User.findById(userId); // Fetch user by ID

        if (!user) {
            return res.status(404).json({ message: `Utilisateur avec l'ID ${userId} non trouvé` });
        }

        const virements = await Virement.find({ userId: userId });

        if (!virements || virements.length === 0) {
            return res.status(200).json({ message: `Aucun virement trouvé pour l'utilisateur avec l'ID ${userId}` });
        }

        // Update each virement object with the user's first name
        const virementsWithFirstName = await Promise.all(virements.map(async virement => {
            if (virement.rhId != "") {
                const user = await User.findOne({ _id: virement.rhId });
                console.log("user", user)
                return {
                    ...virement.toObject(), // Convert Mongoose object to plain JavaScript object
                    rhId: user.personalInfo.firstName + ' ' + user.personalInfo.lastName // Update rhId with user's first name
                };
            }


        }));

        return res.status(200).json(virementsWithFirstName);
    } catch (error) {
        console.error(`Erreur lors de la récupération des virements pour l'utilisateur avec l'ID ${userId} :`, error);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
};


exports.getVirementsByPeriode = async (req, res) => {
    const periode = req.query.periode;
    const userId = req.params.userId;
    const typevirement = req.query.typevirement;

    console.log("periode:", periode); // Check if periode is correctly received

    let startDate, endDate;

    if (!periode && !typevirement) {
        try {
            const allVirements = await Virement.find({ userId: userId });
            return res.status(200).json(allVirements);
        } catch (error) {
            console.error(`Error retrieving all virements:`, error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    if (periode) {
        switch (periode) {
            case 'today':
                startDate = moment().startOf('day');
                endDate = moment().endOf('day');
                break;
            case '7days':
                startDate = moment().subtract(6, 'days').startOf('day');
                endDate = moment().endOf('day');
                break;
            case 'month':
                startDate = moment().startOf('month');
                endDate = moment().endOf('month');
                break;
            case 'year':
                startDate = moment().startOf('year');
                endDate = moment().endOf('year');
                break;
            default:
                return res.status(400).json({ message: 'Unsupported period' });
        }
    }

    console.log("startDate:", startDate.format()); // Check the start date
    console.log("endDate:", endDate.format()); // Check the end date

    try {
        let query = { userId: userId };

        if (periode) {
            query.createdAt = {
                $gte: startDate.utc().startOf('day').toDate(),
                $lte: endDate.utc().endOf('day').toDate()
            };
        }
        if (typevirement === 'all') {
            const virements = await Virement.find(query);
        }
        if (typevirement != 'all') {

            query.typeVirement = typevirement;
        }

        console.log("Query:", query); // Check the constructed query

        const virements = await Virement.find(query);

        if (!virements || virements.length === 0) {
            return res.status(400).json({ message: 'No virements found' });
        }

        return res.status(200).json(virements);
    } catch (error) {
        console.error(`Error retrieving virements:`, error);
        return res.status(500).json({ message: 'Internal Server Error' });
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
            return res.status(200).json({ message: `Aucun virement trouvé pour l'année ${year}` });
        }

        // Prepare categories and initialize data arrays
        const currentYear = new Date().getFullYear();
        const categories = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            return `${month}/${currentYear}`;
        });
        const cooptationData = Array.from({ length: 12 }, () => 0);
        const participationData = Array.from({ length: 12 }, () => 0);

        // Fill in the actual data
        virementsStats.forEach(stat => {
            const monthIndex = stat._id - 1;
            cooptationData[monthIndex] = stat.totalCooptation;
            participationData[monthIndex] = stat.totalParticipation;
        });

        return res.status(200).json({
            series: [
                { name: 'Cooptation', data: cooptationData },
                { name: 'Participation', data: participationData }
            ],
            categories: categories
        });
    } catch (error) {
        console.error(`Erreur lors de la récupération des statistiques des virements pour l'année ${year} :`, error);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
};

