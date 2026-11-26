"use client"

import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  ToggleButtonGroup as ToggleGroupPrimitive,
  ToggleButton as TogglePrimitive,
  type ToggleButtonGroupProps,
  type ToggleButtonProps,
} from "react-aria-components"

import { toggleVariants } from "@/components/ui/toggle-variants"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
  }
>({
  size: "default",
  variant: "default",
  spacing: 2,
  orientation: "horizontal",
})

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 2,
  orientation = "horizontal",
  children,
  ...props
}: Omit<ToggleButtonGroupProps, "children"> &
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
    children?: React.ReactNode
  }) {
  const isSegmented = spacing === 0
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-horizontal={orientation === "horizontal" || undefined}
      data-vertical={orientation === "vertical" || undefined}
      orientation={orientation}
      style={
        {
          "--gap": isSegmented ? "2px" : `calc(var(--spacing) * ${spacing})`,
        } as React.CSSProperties
      }
      className={cn(
        "group/toggle-group flex w-fit flex-row items-center gap-(--gap) rounded-lg data-vertical:flex-col data-vertical:items-stretch",
        isSegmented &&
          "border border-border/80 bg-muted/75 p-0.5 dark:bg-muted/45",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider
        value={{ variant, size, spacing, orientation }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: ToggleButtonProps & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)
  const resolvedSize = context.size || size
  const isSegmented = context.spacing === 0

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={resolvedSize}
      data-spacing={context.spacing}
      className={cn(
        isSegmented
          ? "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground transition-all outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 data-[size=default]:h-7 data-[size=sm]:h-6.5 data-selected:bg-background data-selected:text-foreground data-selected:shadow-xs data-selected:border-border/70 dark:data-selected:bg-card dark:data-selected:border-white/12 [&_svg]:pointer-events-none [&_svg]:shrink-0"
          : toggleVariants({
              variant: context.variant || variant,
              size: resolvedSize,
            }),
        className
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  )
}

export { ToggleGroup, ToggleGroupItem }
