const nodemailer = require('nodemailer');
const serviceEmail = require('../configuration/emailConfig');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: serviceEmail.email,
        pass: serviceEmail.password,
    },
});

const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: serviceEmail.email,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent:', info.response);
        return true; // Succès, le courriel a été envoyé
    } catch (error) {
        console.error('Error sending email:', error);
        return false; // Échec, le courriel n'a pas pu être envoyé
    }
};

module.exports = {
    sendEmail,
};