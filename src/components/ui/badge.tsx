import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#141413] text-[#F4F1EE] dark:bg-[#F4F1EE] dark:text-[#141413]",
        secondary:
          "border-[#E0DBD4] dark:border-[#333330] bg-[#FAF8F5] dark:bg-[#242422] text-[#6B6864] dark:text-[#A4A09B]",
        outline:
          "border-[#E0DBD4] dark:border-[#333330] text-[#141413] dark:text-[#F4F1EE]",
        success:
          "border-transparent bg-[#15803D]/10 text-[#15803D] dark:bg-[#15803D]/20",
        warning:
          "border-transparent bg-[#C05621]/10 text-[#C05621] dark:bg-[#C05621]/20",
        destructive:
          "border-transparent bg-[#B91C1C]/10 text-[#B91C1C] dark:bg-[#B91C1C]/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
