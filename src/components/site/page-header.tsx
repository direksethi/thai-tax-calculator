import type { ReactNode } from "react"

export function PageHeader({ eyebrow, title, description, aside }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 pt-10 pb-8 sm:pt-14 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-2xl flex-col gap-2.5">
        {eyebrow ? <p className="text-[12.5px] font-medium text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="text-[28px] leading-[1.15] font-semibold tracking-[-0.022em] sm:text-[34px]">{title}</h1>
        {description ? <p className="text-[15px] leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  )
}
