import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

type Option<T extends string> = { value: T; label: React.ReactNode }

/** A single-choice segmented control over a handful of options. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "default",
  "aria-label": ariaLabel,
}: {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  className?: string
  size?: "default" | "sm"
  "aria-label"?: string
}) {
  return (
    <ToggleGroup
      aria-label={ariaLabel}
      value={[value]}
      onValueChange={(next: unknown[]) => {
        const picked = next[0]
        if (typeof picked === "string") onChange(picked as T)
      }}
      spacing={0}
      className={cn("flex-wrap rounded-lg bg-secondary p-0.5", className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          size={size === "sm" ? "sm" : "default"}
          className={cn(
            "rounded-md! border-0 px-3 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground",
            "aria-pressed:bg-sheet aria-pressed:font-medium aria-pressed:text-foreground aria-pressed:shadow-[0_0_0_1px_oklch(0.2_0.01_260/0.06),0_1px_2px_oklch(0.2_0.01_260/0.08)]",
            "dark:aria-pressed:bg-accent",
            size === "sm" && "h-7 text-[13px]",
          )}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
