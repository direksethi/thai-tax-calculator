import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Option = { value: string; label: string }

/** A labelled select over a list of options. */
export function Choice({
  value,
  onChange,
  options,
  id,
  className,
  "aria-label": ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  options: Option[]
  id?: string
  className?: string
  "aria-label"?: string
}) {
  return (
    <Select
      value={value}
      items={options}
      onValueChange={(next) => {
        if (typeof next === "string") onChange(next)
      }}
    >
      <SelectTrigger id={id} aria-label={ariaLabel} className={cn("w-full bg-sheet ring-1 ring-input/80 dark:bg-input/30", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="max-h-80">
        <SelectGroup>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="font-normal whitespace-normal">
              {o.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
