import type { ReactNode } from "react"
import { baht } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type FormLineProps = {
  no?: string
  label: ReactNode
  value?: number | null
  sub?: ReactNode
  tone?: "default" | "total" | "minus" | "muted"
  className?: string
}

/**
 * One numbered line of a Revenue Department form: the line number, the
 * printed label, a dotted leader, and the figure as a filer would write it.
 */
export function FormLine({ no, label, value, sub, tone = "default", className }: FormLineProps) {
  return (
    <div
      className={cn(
        "grid items-baseline gap-x-2 py-1.5 text-[13.5px]",
        no ? "grid-cols-[2.25rem_1fr_auto]" : "grid-cols-[1fr_auto]",
        tone === "total" && "border-t border-border pt-2.5 font-medium",
        className,
      )}
    >
      {no ? <span className="num text-[12px] text-muted-foreground">{no}</span> : null}
      <span className="flex min-w-0 items-baseline gap-2">
        <span className={cn("min-w-0", tone === "muted" && "text-muted-foreground")}>
          {label}
          {sub ? <span className="mt-0.5 block text-[12px] font-normal text-muted-foreground">{sub}</span> : null}
        </span>
        <span className="leader hidden h-3 min-w-6 flex-1 sm:block" aria-hidden />
      </span>
      <span
        className={cn(
          "num text-right font-medium text-ink",
          tone === "muted" && "font-normal text-muted-foreground",
          value === null || value === undefined ? "text-muted-foreground/60" : "",
        )}
      >
        {value === null || value === undefined ? "–" : `${tone === "minus" && value > 0 ? "−" : ""}${baht(value)}`}
      </span>
    </div>
  )
}
