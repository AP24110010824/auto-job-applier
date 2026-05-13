const nodemailer = require('nodemailer');

async function sendEmail(gmailUser, gmailPass, toEmail, messageTemplate, resumePath) {
    // Create a transporter using Gmail
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: gmailUser,
            // Important: This needs to be an App Password, not the regular Google account password
            // if 2-Step Verification is enabled.
            pass: gmailPass
        }
    });

    const mailOptions = {
        from: gmailUser,
        to: toEmail,
        subject: 'Application for Java Developer position',
        text: messageTemplate,
    };

    // Attach resume if it was uploaded
    if (resumePath) {
        mailOptions.attachments = [
            {
                filename: 'Resume.pdf', // Or dynamically get original name
                path: resumePath
            }
        ];
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        throw error;
    }
}

module.exports = { sendEmail };
