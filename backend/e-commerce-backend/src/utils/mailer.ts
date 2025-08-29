import nodemailer from 'nodemailer';
import { shouldSendEmail, logEmailValidation } from './emailValidator';

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
  // Check if we should send email to this address
  if (!shouldSendEmail(to)) {
    logEmailValidation(to, false);
    return;
  }
  
  try {
    await transporter.sendMail({
      from: `"Softavera" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Welcome to Softavera!',
      html: `<h2>Hello ${name},</h2><p>Thanks for registering on <strong>Softavera</strong>! 🎉</p>`,
    });
    
    logEmailValidation(to, true);
    console.log(`✅ Welcome email sent successfully to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${to}:`, error);
    throw error;
  }
};
