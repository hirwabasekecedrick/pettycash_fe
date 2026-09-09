"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Trash2, PencilLine, Undo2 } from "lucide-react";

export const UNDO_DURATION_MS = 5000;

type UndoVariant = "delete" | "edit";

interface UndoToastOptions {
  message: string;
  variant?: UndoVariant;
  onCommit: () => void;
  onUndo: () => void;
}

interface UndoToastContentProps {
  toastId: string;
  message: string;
  variant: UndoVariant;
  onCommit: () => void;
  onUndo: () => void;
  visible: boolean;
}

export function showUndoToast({
  message,
  variant = "edit",
  onCommit,
  onUndo,
}: UndoToastOptions) {
  toast.custom(
    (t) => (
      <UndoToastContent
        toastId={t.id}
        message={message}
        variant={variant}
        onCommit={onCommit}
        onUndo={onUndo}
        visible={t.visible}
      />
    ),
    { duration: UNDO_DURATION_MS + 1000 }
  );
}

function UndoToastContent({
  toastId,
  message,
  variant,
  onCommit,
  onUndo,
  visible,
}: UndoToastContentProps) {
  const [remaining, setRemaining] = useState(UNDO_DURATION_MS);
  const finishedRef = useRef(false);

  useEffect(() => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const left = Math.max(0, UNDO_DURATION_MS - (Date.now() - startedAt));
      setRemaining(left);
      if (left <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        clearInterval(interval);
        onCommit();
        toast.dismiss(toastId);
      }
    }, 100);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUndo = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onUndo();
    toast.dismiss(toastId);
    toast.success("Action undone");
  };

  const secondsLeft = Math.ceil(remaining / 1000);
  const progress = (remaining / UNDO_DURATION_MS) * 100;
  const Icon = variant === "delete" ? Trash2 : PencilLine;
  const isDelete = variant === "delete";

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-100 transition-transform duration-200 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            isDelete ? "bg-red-50 text-red-500" : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{message}</p>
          <p className="mt-0.5 text-xs text-gray-400">
            Undo in {secondsLeft}s
          </p>
        </div>
        <button
          type="button"
          onClick={handleUndo}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <Undo2 className="h-3.5 w-3.5" /> Undo
        </button>
      </div>
      <div className="h-1 w-full bg-gray-100">
        <div
          className={`h-full transition-[width] duration-100 ease-linear ${
            isDelete ? "bg-red-400" : "bg-primary"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}