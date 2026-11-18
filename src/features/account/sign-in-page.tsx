import { useNavigate, useSearch } from "@tanstack/react-router"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { useLang } from "@/lib/i18n"

export function SignInPage() {
  const lang = useLang()
  const t = (en: string, th: string) => (lang === "en" ? en : th)
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { next?: string }
  const next = search.next?.startsWith("/") && !search.next.startsWith("//") ? search.next : `/${lang}/returns`
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const address = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError(t("Enter a valid email address.", "กรอกอีเมลให้ถูกต้อง"))
      return
    }
    setBusy(true)
    const res = await authClient.emailOtp.sendVerificationOtp({ email: address, type: "sign-in" })
    setBusy(false)
    if (res.error) {
      setError(t("Couldn't send the code. Try again in a minute.", "ส่งรหัสไม่สำเร็จ ลองใหม่อีกครั้งในอีกสักครู่"))
      return
    }
    setEmail(address)
    setStep("code")
  }

  async function verify(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const res = await authClient.signIn.emailOtp({ email, otp: code.trim() })
    setBusy(false)
    if (res.error) {
      setError(t("That code is incorrect or has expired.", "รหัสไม่ถูกต้องหรือหมดอายุแล้ว"))
      return
    }
    await navigate({ href: next })
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-8 px-4 py-20 sm:py-28">
      <div className="flex flex-col gap-2">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{t("Sign in", "เข้าสู่ระบบ")}</h1>
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          {step === "email"
            ? t("Save returns for each year and plan the next one. We email you a six-digit code; there is no password.", "บันทึกแบบแสดงรายการของแต่ละปีและวางแผนปีถัดไป ระบบส่งรหัส 6 หลักทางอีเมล ไม่มีรหัสผ่าน")
            : t(`Enter the code sent to ${email}.`, `กรอกรหัสที่ส่งไปยัง ${email}`)}
        </p>
      </div>
      {step === "email" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-4">
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="email">{t("Email", "อีเมล")}</FieldLabel>
            <Input id="email" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" aria-invalid={error ? true : undefined} className="bg-sheet ring-1 ring-input/80" />
            {error ? <p className="text-[13px] text-destructive">{error}</p> : null}
          </Field>
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? <Spinner data-icon="inline-start" /> : null}
            {t("Email me a code", "ส่งรหัสทางอีเมล")}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="flex flex-col gap-4">
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="code">{t("Code", "รหัส")}</FieldLabel>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              aria-invalid={error ? true : undefined}
              className="num bg-sheet text-center text-[20px] tracking-[0.4em] ring-1 ring-input/80"
            />
            {error ? <p className="text-[13px] text-destructive">{error}</p> : null}
          </Field>
          <Button type="submit" size="lg" disabled={busy || code.length !== 6}>
            {busy ? <Spinner data-icon="inline-start" /> : null}
            {t("Sign in", "เข้าสู่ระบบ")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-center text-muted-foreground"
            onClick={() => {
              setStep("email")
              setCode("")
              setError(null)
            }}
          >
            {t("Use a different email", "ใช้อีเมลอื่น")}
          </Button>
        </form>
      )}
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
        {t(
          "The calculators work without an account. Signing in stores your saved returns on this site's server so you can open them on any device.",
          "เครื่องคำนวณใช้งานได้โดยไม่ต้องมีบัญชี การเข้าสู่ระบบจะเก็บแบบที่บันทึกไว้บนเซิร์ฟเวอร์ของเว็บไซต์นี้ เพื่อเปิดได้จากทุกอุปกรณ์",
        )}
      </p>
    </div>
  )
}
