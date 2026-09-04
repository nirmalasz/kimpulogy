"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-primary-500/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-bg-default p-8 shadow-lg">
        <div className="mb-6 flex items-start justify-between gap-4">
          {title ? (
            <h2 className="text-xl font-bold font-heading text-fg-default">
              {title}
            </h2>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}