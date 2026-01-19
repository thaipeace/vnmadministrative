"use client";

import { ReactNode } from "react";

interface BottomSheetProps {
  isInfoOpened: boolean;
  onToggle: (isOpen: boolean) => void;
  children: ReactNode;
}

export default function BottomSheet({ isInfoOpened, onToggle, children }: BottomSheetProps) {
  return (
    <>
      {/* Backdrop */}
      {isInfoOpened && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => onToggle(false)}
        />
      )}

      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white/50 rounded-t-2xl shadow-2xl z-50 md:hidden transition-transform duration-300 ${isInfoOpened ? "translate-y-0" : "translate-y-[calc(100%-4rem)]"
          }`}
        style={{ maxHeight: "80vh" }}
      >
        {/* Handle Bar */}
        <div
          className="p-4 cursor-pointer flex flex-col items-center"
          onClick={() => onToggle(!isInfoOpened)}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full mb-2" />
          <span className="text-sm font-medium text-gray-700">
            {isInfoOpened ? "Click để đóng" : "Click để xem danh sách"}
          </span>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(80vh - 4rem)" }}>
          {children}
        </div>
      </div>
    </>
  );
}
