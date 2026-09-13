import nodemailer from 'nodemailer';

export interface SendOtpResult {
  success: boolean;
  messageId?: string;
  previewCode?: string;
  error?: string;
}

function getTransporter() {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');

  if (gmailUser && gmailPass) {
    return {
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      }),
      from: process.env.SMTP_FROM || `"ML-VLAB" <${gmailUser}>`,
    };
  }

  const smtpHost = process.env.SMTP_HOST?.trim();
  if (smtpHost) {
    return {
      transporter: nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }),
      from: process.env.SMTP_FROM || '"ML-VLAB" <no-reply@srmist.edu.in>',
    };
  }

  return null;
}

export async function sendEmailVerificationOtp(email: string, otpCode: string): Promise<SendOtpResult> {
  const mailConfig = getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d1117; color: #e6edf3; padding: 24px; margin: 0; }
          .card { max-width: 500px; margin: 0 auto; background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 32px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
          .logo-badge { display: inline-block; padding: 4px 10px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
          h1 { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
          p { font-size: 14px; line-height: 1.6; color: #8b949e; margin-bottom: 24px; }
          .otp-box { background: #0d1117; border: 2px dashed #38bdf8; border-radius: 8px; text-align: center; padding: 20px; margin-bottom: 24px; }
          .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #38bdf8; }
          .footer { font-size: 12px; color: #484f58; text-align: center; margin-top: 32px; border-top: 1px solid #21262d; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo-badge">ML-VLAB</div>
          <h1>Verify your email address</h1>
          <p>Thank you for registering for the Machine Learning Virtual Laboratory. Your verification code is:</p>
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
          </div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If you did not create an ML-VLAB account, you can safely ignore this email.</p>
          <div class="footer">
            © ${new Date().getFullYear()} Machine Learning Virtual Laboratory.
          </div>
        </div>
      </body>
    </html>
  `;

  if (mailConfig) {
    try {
      const info = await mailConfig.transporter.sendMail({
        from: mailConfig.from,
        to: email,
        subject: 'Verify your email address - ML-VLAB',
        text: `ML-VLAB\nMachine Learning Virtual Laboratory\n\nVerify your email address\n\nYour verification code is:\n${otpCode}\n\nThis code will expire in 10 minutes.\n\nIf you did not create an ML-VLAB account, you can ignore this email.`,
        html: htmlContent,
      });

      console.log(`✉️ Email verification OTP sent via SMTP to ${email} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error('SMTP Email Verification error:', err?.message || err);
      // Fallback to dev log below if sending fails
    }
  }

  // Development / fallback mode: log to server console
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✉️ EMAIL VERIFICATION OTP FOR: ${email}`);
  console.log(`👉 CODE: [ ${otpCode} ] (Valid for 10 minutes)`);
  console.log('═══════════════════════════════════════════════════════════');

  return {
    success: true,
    previewCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
  };
}

export async function sendPasswordResetOtp(email: string, otpCode: string): Promise<SendOtpResult> {
  const mailConfig = getTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d1117; color: #e6edf3; padding: 24px; margin: 0; }
          .card { max-width: 500px; margin: 0 auto; background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 32px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
          .logo-badge { display: inline-block; padding: 4px 10px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
          h1 { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
          p { font-size: 14px; line-height: 1.6; color: #8b949e; margin-bottom: 24px; }
          .otp-box { background: #0d1117; border: 2px dashed #38bdf8; border-radius: 8px; text-align: center; padding: 20px; margin-bottom: 24px; }
          .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #38bdf8; }
          .footer { font-size: 12px; color: #484f58; text-align: center; margin-top: 32px; border-top: 1px solid #21262d; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo-badge">SRM Virtual Laboratory</div>
          <h1>Password Reset Verification</h1>
          <p>We received a request to reset the password for your account associated with <strong>${email}</strong>. Use the verification code below:</p>
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
          </div>
          <p>This code is valid for <strong>15 minutes</strong>. If you did not make this request, you can safely ignore this email.</p>
          <div class="footer">
            © ${new Date().getFullYear()} SRM Machine Learning Virtual Laboratory.
          </div>
        </div>
      </body>
    </html>
  `;

  if (mailConfig) {
    try {
      const info = await mailConfig.transporter.sendMail({
        from: mailConfig.from,
        to: email,
        subject: 'Your Password Reset Verification Code - SRM ML Virtual Lab',
        text: `Your password reset verification code is: ${otpCode}. It expires in 15 minutes.`,
        html: htmlContent,
      });

      console.log(`🔑 Password reset OTP sent via SMTP to ${email} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error('SMTP Password Reset error:', err?.message || err);
    }
  }

  // Development / fallback mode: log to server console
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🔑 PASSWORD RESET OTP DISPATCHED FOR: ${email}`);
  console.log(`👉 CODE: [ ${otpCode} ] (Valid for 15 minutes)`);
  console.log('═══════════════════════════════════════════════════════════');

  return {
    success: true,
    previewCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
  };
}
