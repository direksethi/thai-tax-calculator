import { useEffect, useId, useState } from "react"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 })

function parse(text: string): number {
  const cleaned = text.replace(/[^0-9.]/g, "")
  const value = Number.parseFloat(cleaned)
  return Number.isFinite(value) ? value : 0
}

type MoneyInputProps = {
  value: number
  onChange: (value: number) => void
  id?: string
  suffix?: string
  placeholder?: string
  className?: string
  "aria-label"?: string
  max?: number
}

/** A baht amount with thousands separators. Focusing selects the figure; blurring reformats it. */
export function MoneyInput({ value, onChange, id, suffix = "฿", placeholder = "0", className, max, ...rest }: MoneyInputProps) {
  const fallbackId = useId()
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState(value ? fmt.format(value) : "")

  useEffect(() => {
    if (!focused) setText(value ? fmt.format(value) : "")
  }, [value, focused])

  return (
    <InputGroup className={cn("bg-sheet ring-1 ring-input/80 dark:bg-input/30", className)}>
      <InputGroupInput
        id={id ?? fallbackId}
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        className="num text-right"
        value={text}
        aria-label={rest["aria-label"]}
        onFocus={(event) => {
          setFocused(true)
          // Leave the text as shown (commas parse fine) and select it, so typing replaces the figure.
          const el = event.currentTarget
          requestAnimationFrame(() => el.select())
        }}
        onBlur={() => {
          setFocused(false)
          setText(value ? fmt.format(value) : "")
        }}
        onChange={(event) => {
          const next = event.target.value.replace(/[^0-9.,]/g, "")
          setText(next)
          const parsed = parse(next)
          onChange(max !== undefined ? Math.min(parsed, max) : parsed)
        }}
      />
      <InputGroupAddon align="inline-end" className="num text-[12px] text-muted-foreground/80">
        {suffix}
      </InputGroupAddon>
    </InputGroup>
  )
}

type CountInputProps = {
  value: number
  onChange: (value: number) => void
  max?: number
  id?: string
  "aria-label"?: string
}

/** A small whole-number stepper for people counts. */
export function CountInput({ value, onChange, max = 20, id, ...rest }: CountInputProps) {
  return (
    <div className="inline-flex h-9 items-center rounded-lg bg-sheet ring-1 ring-input/80 dark:bg-input/30">
      <button
        type="button"
        className="grid size-9 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        aria-label="−"
      >
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden><path d="M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
      <output id={id} aria-label={rest["aria-label"]} className="num w-6 text-center text-sm font-medium">{value}</output>
      <button
        type="button"
        className="grid size-9 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="+"
      >
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden><path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
    </div>
  )
}
