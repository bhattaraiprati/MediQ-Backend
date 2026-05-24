import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GOOGLE_USERNAME_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
    },
});

export const sendVerificationEmail = async (to: string, token: string) => {
    const verifyLink = `http://localhost:5000/api/auth/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.GOOGLE_USERNAME_EMAIL,
        to,
        subject: 'MediQ AI - Verify Your Email',
        html: `
      <h2>Welcome to MediQ AI!</h2>
      <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
      <a href="${verifyLink}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Verify Email</a>
      <p>If you did not create this account, please ignore this email.</p>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${to}`);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};
