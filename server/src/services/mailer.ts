import nodemailer from 'nodemailer';

export interface SendOtpResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  previewCode?: string;
  error?: string;
}

export async function sendPasswordResetOtp(email: string, otpCode: string): Promise<SendOtpResult> {
  const isProd = process.env.NODE_ENV === 'production' && process.env.SMTP_HOST;

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
          .warning { font-size: 12px; color: #f85149; margin-top: 16px; }
          .footer { font-size: 12px; color: #484f58; text-align: center; margin-top: 32px; border-top: 1px solid #21262d; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo-badge">SRM Virtual Laboratory</div>
          <h1>Password Reset Verification</h1>
          <p>We received a request to reset the password for your SRM Virtual Lab account associated with <strong>${email}</strong>. Use the verification code below to proceed with resetting your password:</p>
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
          </div>
          <p>This single-use code is valid for <strong>15 minutes</strong>. If you did not make this request, you can safely ignore this email; your account remains secure.</p>
          <div class="footer">
            © ${new Date().getFullYear()} SRM Machine Learning Virtual Laboratory.
          </div>
        </div>
      </body>
    </html>
  `;

  if (isProd && process.env.SMTP_HOST) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"SRM ML Virtual Lab" <no-reply@srmist.edu.in>',
        to: email,
        subject: 'Your Password Reset Verification Code - SRM ML Virtual Lab',
        text: `Your password reset verification code is: ${otpCode}. It expires in 15 minutes.`,
        html: htmlContent,
      });

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error('SMTP email dispatch error:', err);
      // Fall through to dev preview so user is not completely blocked
    }
  }

  // Development / fallback mode: log to server console for immediate visibility
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🔑 PASSWORD RESET OTP DISPATCHED FOR: ${email}`);
  console.log(`👉 CODE: [ ${otpCode} ] (Valid for 15 minutes)`);
  console.log('═══════════════════════════════════════════════════════════');

  return {
    success: true,
    previewCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
  };
}
