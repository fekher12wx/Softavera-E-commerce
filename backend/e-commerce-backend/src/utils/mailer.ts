import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendWelcomeEmail = async (to: string, name: string) => {
  await transporter.sendMail({
    from: `"Shopy" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Welcome to Shopy!',
    html: `<h2>Hello ${name},</h2><p>Thanks for registering on <strong>Shopy</strong>! 🎉</p>`,
  });
};
