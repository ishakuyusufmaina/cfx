// netlify/functions/send-email.js
const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { recipient } = JSON.parse(event.body);

    if (!recipient) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Recipient email is required" }),
      };
    }

    // Use Gmail + App Password stored in Netlify Environment Variables
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SENDER_EMAIL,      // your Gmail address
        pass: process.env.GMAIL_APP_PASS,    // your Gmail App Password
      },
    });

    // Build email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Dear Esteemed SIB Provider,</h2>
        <p>Thank you for choosing to partner with us. To complete your registration, please click below:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="https://provider.mainafly.com?email=${encodeURIComponent(recipient)}"
             style="background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Complete Registration
          </a>
        </p>
        <p>If you did not initiate this request, please disregard this message.</p>
        <p>Best regards,<br><b>The Mainafly Team</b></p>
      </body>
      </html>
    `;

    // Send mail
    await transporter.sendMail({
      from: `"Mainafly" <${process.env.SENDER_EMAIL}>`,
      to: recipient,
      subject: "Complete Your Registration",
      html: htmlContent,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Email sent successfully" }),
    };
  } catch (err) {
    console.error("Error sending email:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send email" }),
    };
  }
};
