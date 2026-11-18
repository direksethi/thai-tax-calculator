import { CheckIcon, CloudArrowUpIcon, FolderOpenIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { Link, useLocation } from "@tanstack/react-router"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAccountsEnabled } from "@/lib/accounts"
import { authClient } from "@/lib/auth-client"
import { useLang } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { saveReturn, type ReturnKind, type ReturnSummary } from "@/server/returns"

type Status = "idle" | "saving" | "saved" | "error"

type SaveBarProps = {
  kind: ReturnKind
  year: number
  data: unknown
  summary: ReturnSummary
  savedId?: string
  name?: string
  defaultName: string
  onSaved: (id: string, name: string) => void
  onRename: (name: string) => void
  actions?: ReactNode
}

/**
 * Save controls above a calculator. Signed out, it offers sign-in and keeps the
 * figures in this browser. Once a return is saved, every change saves itself.
 * On a deployment without accounts it only says where the figures are kept.
 */
export function SaveBar(props: SaveBarProps) {
  return useAccountsEnabled() ? <AccountSaveBar {...props} /> : <LocalBar actions={props.actions} />
}

function LocalBar({ actions }: { actions?: ReactNode }) {
  const lang = useLang()
  return (
    <div className="sheet mb-8 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <span className="text-[13.5px] text-muted-foreground">
        {lang === "en" ? "Figures are stored in this browser only." : "ข้อมูลถูกเก็บในเบราว์เซอร์นี้เท่านั้น"}
      </span>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

function AccountSaveBar({
  kind,
  year,
  data,
  summary,
  savedId,
  name,
  defaultName,
  onSaved,
  onRename,
  actions,
}: SaveBarProps) {
  const lang = useLang()
  const t = (en: string, th: string) => (lang === "en" ? en : th)
  const location = useLocation()
  const { data: session, isPending } = authClient.useSession()
  // The session object is replaced on every refetch; autosave only cares whether someone is signed in.
  const signedIn = Boolean(session)
  const [status, setStatus] = useState<Status>("idle")
  const payload = JSON.stringify(data)
  const lastSaved = useRef<string | null>(null)
  const summaryRef = useRef(summary)
  summaryRef.current = summary

  async function save(id?: string) {
    setStatus("saving")
    try {
      const res = await saveReturn({ data: { id, kind, year, name: name || defaultName, data, summary: summaryRef.current } })
      lastSaved.current = `${payload}|${name}|${year}`
      setStatus("saved")
      if (res.id !== id) onSaved(res.id, name || defaultName)
    } catch {
      setStatus("error")
    }
  }

  useEffect(() => {
    if (!savedId || !signedIn) return
    const key = `${payload}|${name}|${year}`
    if (lastSaved.current === null) {
      // The return was just opened; its stored copy is already current.
      lastSaved.current = key
      setStatus("saved")
      return
    }
    if (key === lastSaved.current) {
      // Edited back to what is already stored.
      setStatus((prev) => (prev === "saving" ? "saved" : prev))
      return
    }
    setStatus("saving")
    const timer = setTimeout(() => void save(savedId), 1200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, name, year, savedId, signedIn])

  useEffect(() => {
    if (!savedId) lastSaved.current = null
  }, [savedId])

  const next = location.pathname + location.searchStr

  return (
    <div className="sheet mb-8 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        {session && savedId ? (
          <>
            <input
              value={name ?? ""}
              onChange={(e) => onRename(e.target.value)}
              placeholder={defaultName}
              aria-label={t("Return name", "ชื่อแบบ")}
              className="min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-1 text-[14px] font-medium outline-none hover:bg-muted/70 focus:bg-muted/70 sm:w-72 sm:flex-none"
            />
            <SaveStatus status={status} />
          </>
        ) : (
          <span className="text-[13.5px] text-muted-foreground">
            {isPending ? " " : session ? t("Not saved yet", "ยังไม่ได้บันทึก") : t("Figures stay in this browser until you sign in and save.", "ข้อมูลอยู่ในเบราว์เซอร์นี้จนกว่าจะเข้าสู่ระบบและบันทึก")}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        {session ? (
          <>
            {!savedId ? (
              <Button size="sm" onClick={() => void save()} disabled={status === "saving"}>
                {status === "saving" ? <Spinner data-icon="inline-start" /> : <CloudArrowUpIcon data-icon="inline-start" />}
                {t("Save", "บันทึก")}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" nativeButton={false} render={<Link to="/$lang/returns" params={{ lang }} />}>
              <FolderOpenIcon data-icon="inline-start" />
              {t("Saved returns", "แบบที่บันทึกไว้")}
            </Button>
          </>
        ) : !isPending ? (
          <Button size="sm" variant="outline" nativeButton={false} render={<Link to="/$lang/sign-in" params={{ lang }} search={{ next }} />}>
            {t("Sign in to save", "เข้าสู่ระบบเพื่อบันทึก")}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function SaveStatus({ status }: { status: Status }) {
  const lang = useLang()
  const t = (en: string, th: string) => (lang === "en" ? en : th)
  if (status === "idle") return null
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 text-[12.5px]", status === "error" ? "text-destructive" : "text-muted-foreground")}>
      {status === "saving" ? <Spinner className="size-3" /> : status === "saved" ? <CheckIcon className="size-3.5" /> : <WarningCircleIcon className="size-3.5" />}
      {status === "saving" ? t("Saving", "กำลังบันทึก") : status === "saved" ? t("Saved", "บันทึกแล้ว") : t("Couldn't save", "บันทึกไม่สำเร็จ")}
    </span>
  )
}
