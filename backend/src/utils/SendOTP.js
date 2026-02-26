import {Resend} from "resend";

let resend;
const getResend = () => {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

export const sendOTPEmail = async (to, otp) => {
  const digits = otp.toString().split("").map(
    (d) => `<td style="width:40px;height:48px;background:#4F46E5;border-radius:8px;text-align:center;font-size:22px;font-weight:700;color:#fff;font-family:monospace;">${d}</td>`
  ).join('<td style="width:6px"></td>');

  const { data, error } = await getResend().emails.send({
    from: "GeoFence <noreply@geoforms.in>",
    to,
    subject: "Your GeoFence Verification Code",
    html: `
    <body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr><td align="center">
          <table width="420" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
            <tr><td style="background:#4F46E5;padding:20px;text-align:center;">
              <span style="font-size:20px;font-weight:700;color:#fff;">GeoFence</span>
            </td></tr>
            <tr><td style="padding:32px 32px 16px;text-align:center;">
              <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#1a1a2e;">Verify Your Email</p>
              <p style="margin:0;font-size:13px;color:#6b7280;">Enter this code to complete registration. Expires in 5 min.</p>
            </td></tr>
            <tr><td style="padding:16px 32px 24px;" align="center">
              <table cellpadding="0" cellspacing="0"><tr>${digits}</tr></table>
            </td></tr>
            <tr><td style="padding:0 32px 24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">If you didn't request this, ignore this email.</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    `,
  });

  if (error) {
    console.error("Resend email error:", error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }

  console.log("OTP email sent successfully:", data?.id);
};