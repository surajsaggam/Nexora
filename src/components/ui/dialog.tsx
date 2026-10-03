"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {open && children}
    </DialogContext.Provider>
  );
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("DialogContent must be used within Dialog");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => context.onOpenChange(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
      />
      {/* Modal Surface */}
      <div
        data-slot="dialog-content"
        className={cn(
          "relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#FAF8F5] dark:bg-[#1D1D1B] border border-[#E0DBD4] dark:border-[#333330] rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200",
          className
        )}
        {...props}
      >
        <button
          onClick={() => context.onOpenChange(false)}
          className="absolute right-5 top-5 p-2 rounded-full hover:bg-[#EAE6E1] dark:hover:bg-[#2A2A28] text-[#6B6864] transition-colors cursor-pointer"
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 pb-4 mb-6 border-b border-[#E0DBD4] dark:border-[#333330]", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="dialog-title"
      className={cn("text-xl sm:text-2xl font-bold tracking-tight text-[#141413] dark:text-[#F4F1EE]", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="dialog-description"
      className={cn("text-xs sm:text-sm text-[#6B6864] dark:text-[#A4A09B]", className)}
      {...props}
    />
  );
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription };
