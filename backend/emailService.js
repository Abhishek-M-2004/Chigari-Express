const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendTicketEmail(toEmail, ticket, userName) {
  // Extract only the base64 part
  const base64QR = ticket.qrCodeDataURL.split("base64,")[1];

  // Helper to make the date look cleaner
  const dateObj = new Date(ticket.validTill);
  const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const mailOptions = {
    from: `"Chigari Express" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🎫 Ticket Confirmed: ${ticket.from} ➝ ${ticket.to} | OTP: ${ticket.otp}`,

    // 📌 CID ATTACHMENT
    attachments: [
      {
        filename: "ticket-qr.png",
        cid: "ticketqr",
        content: base64QR,
        encoding: "base64"
      }
    ],

    // 📌 PROFESSIONAL UI WITH OTP
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .details-col { display: block !important; width: 100% !important; padding-bottom: 10px; }
          }
        </style>
      </head>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #eef2f5; margin: 0; padding: 0;">
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #eef2f5; padding: 40px 10px;">
          <tr>
            <td align="center">
              
              <div class="container" style="max-width: 500px; background: #ffffff; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); overflow: hidden; text-align: left;">
                
                <div style="background: linear-gradient(135deg, #003366 0%, #0056b3 100%); padding: 30px 25px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">🚍 Chigari Express</h1>
                  <p style="color: #dbeafe; margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Ticket Confirmation</p>
                </div>

                <!-- OTP SECTION - PROMINENT -->
                <div style="background: linear-gradient(135deg, #ff003c 0%, #cc0030 100%); padding: 25px; text-align: center;">
                  <p style="color: rgba(255,255,255,0.9); font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">Your Gate Entry OTP</p>
                  <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 20px; display: inline-block;">
                    <span style="color: #ffffff; font-size: 48px; font-weight: bold; letter-spacing: 15px; font-family: 'Courier New', monospace;">${ticket.otp}</span>
                  </div>
                  <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 15px 0 0 0;">Show this OTP at the bus gate for entry</p>
                </div>

                <div style="padding: 25px 25px 10px 25px; border-bottom: 2px dashed #f0f0f0;">
                  <p style="color: #28a745; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">● Booking Confirmed</p>
                  <table width="100%">
                    <tr>
                      <td width="45%">
                        <p style="color: #8898aa; font-size: 11px; text-transform: uppercase; margin: 0;">From</p>
                        <p style="color: #32325d; font-size: 18px; font-weight: 700; margin: 5px 0;">${ticket.from}</p>
                      </td>
                      <td width="10%" align="center" style="color: #ccc;">➝</td>
                      <td width="45%" align="right">
                        <p style="color: #8898aa; font-size: 11px; text-transform: uppercase; margin: 0;">To</p>
                        <p style="color: #32325d; font-size: 18px; font-weight: 700; margin: 5px 0;">${ticket.to}</p>
                      </td>
                    </tr>
                  </table>
                </div>

                <div style="padding: 20px 25px;">
                  <table width="100%">
                    <tr>
                      <td class="details-col" width="50%" style="vertical-align: top; padding-bottom: 15px;">
                        <p style="color: #8898aa; font-size: 11px; text-transform: uppercase; margin: 0;">Date</p>
                        <p style="color: #32325d; font-size: 15px; font-weight: 600; margin: 5px 0;">${dateStr}</p>
                      </td>
                      <td class="details-col" width="50%" style="vertical-align: top; padding-bottom: 15px;">
                        <p style="color: #8898aa; font-size: 11px; text-transform: uppercase; margin: 0;">Time</p>
                        <p style="color: #32325d; font-size: 15px; font-weight: 600; margin: 5px 0;">${timeStr}</p>
                      </td>
                    </tr>
                    <tr>
                      <td class="details-col" width="50%" style="vertical-align: top;">
                        <p style="color: #8898aa; font-size: 11px; text-transform: uppercase; margin: 0;">Ticket ID</p>
                        <p style="color: #32325d; font-size: 15px; font-weight: 600; margin: 5px 0;">${ticket.ticketId}</p>
                      </td>
                      <td class="details-col" width="50%" style="vertical-align: top;">
                        <p style="color: #8898aa; font-size: 11px; text-transform: uppercase; margin: 0;">Amount</p>
                        <p style="color: #003366; font-size: 18px; font-weight: 800; margin: 5px 0;">₹${ticket.amount}</p>
                      </td>
                    </tr>
                  </table>
                </div>

                <div style="background-color: #f8f9fa; padding: 25px 25px 10px 25px; text-align: center; border-top: 1px solid #e9ecef;">
                  <div style="background: white; padding: 10px; display: inline-block; border-radius: 8px; border: 1px solid #e1e4e8;">
                    <img src="cid:ticketqr" alt="QR Code" style="width: 180px; height: 180px; display: block;" />
                  </div>
                  <p style="color: #525f7f; font-size: 13px; margin: 15px 0 0;">Scan this at the bus entry.</p>
                </div>

                <div style="padding: 20px 25px;">
                  <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
                    <p style="margin: 0 0 5px 0; color: #b78a02; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                      ⚠️ Important Information
                    </p>
                    <p style="margin: 0; color: #5c4e24; font-size: 13px; line-height: 1.5;">
                      This ticket is valid <strong>only for 1 day</strong> (the date shown above). 
                      If the ticket is unused, the full amount will be automatically refunded.
                    </p>
                  </div>
                </div>

                <div style="background-color: #003366; padding: 15px; text-align: center;">
                  <p style="color: rgba(255,255,255,0.7); font-size: 11px; margin: 0;">
                    Passenger: <b>${userName}</b> | Distance: ${ticket.distance} km
                  </p>
                </div>
                
              </div>
              
              <p style="text-align: center; color: #8898aa; font-size: 12px; margin-top: 20px;">
                Need help? <a href="mailto:support@chigiriexpress.com" style="color: #0056b3; text-decoration: none;">Contact Support</a>
              </p>

            </td>
          </tr>
        </table>

      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to ${toEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email:`, error);
    return { success: false, error: error.message };
  }
}

// Password reset email
async function sendPasswordResetEmail(toEmail, resetToken, userName) {
  const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Chigari Express" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🔐 Password Reset Request - Chigari Express`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #eef2f5; margin: 0; padding: 0;">
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #eef2f5; padding: 40px 10px;">
          <tr>
            <td align="center">
              
              <div style="max-width: 500px; background: #ffffff; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); overflow: hidden; text-align: left;">
                
                <div style="background: linear-gradient(135deg, #003366 0%, #0056b3 100%); padding: 30px 25px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">🔐 Password Reset</h1>
                  <p style="color: #dbeafe; margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Chigari Express</p>
                </div>

                <div style="padding: 30px 25px;">
                  <p style="color: #32325d; font-size: 16px; margin: 0 0 20px 0;">Hi <strong>${userName}</strong>,</p>
                  <p style="color: #525f7f; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0;">
                    We received a request to reset your password. Click the button below to create a new password:
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background: linear-gradient(135deg, #ff003c 0%, #cc0030 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                      Reset Password
                    </a>
                  </div>

                  <p style="color: #8898aa; font-size: 12px; margin: 25px 0 0 0;">
                    This link will expire in <strong>1 hour</strong>. If you didn't request this, please ignore this email.
                  </p>
                </div>

                <div style="background-color: #f8f9fa; padding: 15px 25px; border-top: 1px solid #e9ecef;">
                  <p style="color: #8898aa; font-size: 11px; margin: 0; text-align: center;">
                    If the button doesn't work, copy this link: ${resetLink}
                  </p>
                </div>
                
              </div>

            </td>
          </tr>
        </table>

      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to ${toEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send password reset email:`, error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendTicketEmail, sendPasswordResetEmail };