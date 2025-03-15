"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("relative", className)} {...props} />;
});
ChartContainer.displayName = "ChartContainer";

const Chart = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("overflow-hidden rounded-md border", className)}
      {...props}
    />
  );
});
Chart.displayName = "Chart";

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-md border bg-popover p-4 text-popover-foreground shadow-md",
        className
      )}
      {...props}
    />
  );
});
ChartTooltip.displayName = "ChartTooltip";

const ChartTooltipContent = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  );
});
ChartTooltipContent.displayName = "ChartTooltipContent";

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex justify-center pt-4", className)}
      {...props}
    />
  );
});
ChartLegend.displayName = "ChartLegend";

interface ChartLegendItemProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  color: string;
}

const ChartLegendItem = React.forwardRef<HTMLDivElement, ChartLegendItemProps>(
  ({ className, name, color, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center space-x-2", className)}
        {...props}
      >
        <span
          className="block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span>{name}</span>
      </div>
    );
  }
);
ChartLegendItem.displayName = "ChartLegendItem";

export {
  ChartContainer,
  Chart,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendItem,
};
