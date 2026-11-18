import { Resend } from "resend"
import { workerEnv } from "./env"

/**
 * The sign-in code email, in both languages. Without a Resend key (local dev)
 * the code is printed to the log instead, so sign-in still works.
 */
export async function sendCode(to: string, otp: string): Promise<void> {
  const env = workerEnv()
  const digits = otp.split("").join(" ")
  const text = `Your Thai Tax Calculator sign-in code is ${otp}. It expires in 10 minutes.\n\nรหัสเข้าสู่ระบบของคุณคือ ${otp} ใช้ได้ภายใน 10 นาที`
  if (!env.RESEND_API_KEY) {
    console.log(`[mail] (no RESEND_API_KEY) to=${to} code=${otp}`)
    return
  }
  const host = env.APP_URL ? new URL(env.APP_URL).host : ""
  const footer = host ? `<tr><td style="padding:16px 28px 24px;font-size:12px;color:#8a8e99">${host}</td></tr>` : ""
  const html = `<!doctype html><html><body style="margin:0;background:#f7f6f2;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e7e5df;border-radius:12px">
<tr><td style="padding:28px 28px 8px">
<div style="font-size:15px;font-weight:600;color:#1f2430">Thai Tax Calculator</div>
<div style="margin-top:20px;font-size:14px;color:#5c6170">Your sign-in code · รหัสเข้าสู่ระบบ</div>
<div style="margin-top:10px;font-size:32px;font-weight:600;letter-spacing:6px;color:#2f4fb8;font-variant-numeric:tabular-nums">${digits}</div>
<div style="margin-top:16px;font-size:13px;color:#5c6170">Expires in 10 minutes. If you did not ask for it, ignore this email.<br/>ใช้ได้ภายใน 10 นาที หากคุณไม่ได้ขอรหัสนี้ ไม่ต้องดำเนินการใด ๆ</div>
</td></tr>
${footer}
</table></body></html>`
  if (!env.MAIL_FROM) throw new Error("MAIL_FROM must be set when RESEND_API_KEY is set")
  const resend = new Resend(env.RESEND_API_KEY)
  const result = await resend.emails.send({ from: env.MAIL_FROM, to, subject: `${otp} is your Thai Tax Calculator code`, html, text })
  if (result.error) throw new Error(`Resend: ${result.error.message}`)
}
