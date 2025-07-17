const nodemailer = require("nodemailer");

const sendMail = async (options) => {
    if (!options.email) {
        throw new Error("No recipient defined");
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.mailtrap.io",
        port: process.env.SMTP_PORT || 2525,
        auth: {
            user: process.env.SMTP_EMAIL, // Use SMTP_EMAIL from .env
            pass: process.env.SMTP_PASS,  // Use SMTP_PASS from .env
        },
    });

    const mailOptions = {
        from: options.from || `${process.env.SMTP_FROM_NAME || 'Bidding'} <${process.env.SMTP_FROM_EMAIL || 'non_reply@gmail.com'}>`,
        to: options.email,
        subject: options.subject || 'BidCrunch Notification',
        text: options.text || '',
        html: options.html || '',
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendMail;