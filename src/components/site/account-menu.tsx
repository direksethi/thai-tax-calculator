import { UserCircleIcon } from "@phosphor-icons/react"
import { Link, useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAccountsEnabled } from "@/lib/accounts"
import { authClient } from "@/lib/auth-client"
import { useLang } from "@/lib/i18n"

export function AccountMenu() {
  return useAccountsEnabled() ? <SignedInMenu /> : null
}

function SignedInMenu() {
  const lang = useLang()
  const t = (en: string, th: string) => (lang === "en" ? en : th)
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()
  if (isPending) return <span className="w-16" />
  if (!session)
    return (
      <Link to="/$lang/sign-in" params={{ lang }} search={{}} className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-accent/60">
        {t("Sign in", "เข้าสู่ระบบ")}
      </Link>
    )
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={t("Account", "บัญชี")} />}>
        <UserCircleIcon className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{session.user.email}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => void navigate({ to: "/$lang/returns", params: { lang } })}>{t("Saved returns", "แบบที่บันทึกไว้")}</DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              await authClient.signOut()
              await navigate({ to: "/$lang", params: { lang }, search: {} })
            }}
          >
            {t("Sign out", "ออกจากระบบ")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
