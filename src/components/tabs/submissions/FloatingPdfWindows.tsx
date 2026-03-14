"use client";

import { X } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { PdfWindow } from "./types";

const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;

export function FloatingPdfWindows({
  windows,
  onClose,
  onFocus,
  onMove,
  onResize,
}: {
  windows: PdfWindow[];
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
}) {
  const startDrag = (
    e: ReactPointerEvent<HTMLDivElement>,
    windowItem: PdfWindow,
  ) => {
    e.preventDefault();
    onFocus(windowItem.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = windowItem.x;
    const startTop = windowItem.y;

    const handleMove = (ev: PointerEvent) => {
      const nextX = Math.max(0, startLeft + (ev.clientX - startX));
      const nextY = Math.max(0, startTop + (ev.clientY - startY));
      onMove(windowItem.id, nextX, nextY);
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const startResize = (
    e: ReactPointerEvent<HTMLDivElement>,
    windowItem: PdfWindow,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus(windowItem.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = windowItem.width;
    const startHeight = windowItem.height;

    const handleMove = (ev: PointerEvent) => {
      const width = Math.max(MIN_WIDTH, startWidth + (ev.clientX - startX));
      const height = Math.max(MIN_HEIGHT, startHeight + (ev.clientY - startY));
      onResize(windowItem.id, width, height);
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {windows.map((windowItem) => (
        <div
          key={windowItem.id}
          className="absolute pointer-events-auto rounded-lg border bg-background shadow-2xl overflow-hidden"
          style={{
            left: windowItem.x,
            top: windowItem.y,
            width: windowItem.width,
            height: windowItem.height,
            zIndex: windowItem.zIndex,
          }}
          onPointerDown={() => onFocus(windowItem.id)}
        >
          <div
            className="h-10 px-3 border-b bg-muted flex items-center justify-between cursor-move"
            onPointerDown={(e) => startDrag(e, windowItem)}
          >
            <p className="text-sm font-medium truncate pr-2">
              {windowItem.title}
            </p>
            <button
              type="button"
              className="h-7 w-7 rounded hover:bg-muted-foreground/10 inline-flex items-center justify-center"
              onClick={() => onClose(windowItem.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <iframe
            src={windowItem.url}
            title={windowItem.title}
            className="w-full h-[calc(100%-40px)]"
          />

          <div
            className="absolute right-0 bottom-0 h-4 w-4 cursor-se-resize"
            onPointerDown={(e) => startResize(e, windowItem)}
          />
        </div>
      ))}
    </div>
  );
}
