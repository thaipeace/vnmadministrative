"use client";

import { ReactNode, useState } from "react";

interface BottomSheetProps {
  children: ReactNode;
}

export default function BottomSheet({ children }: BottomSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 md:hidden transition-transform duration-300 ${isOpen ? "translate-y-0" : "translate-y-[calc(100%-4rem)]"
          }`}
        style={{ maxHeight: "80vh" }}
      >
        {/* Handle Bar */}
        <div
          className="p-4 cursor-pointer flex flex-col items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full mb-2" />
          <span className="text-sm font-medium text-gray-700">
            {isOpen ? "Click để đóng" : "Click để xem danh sách"}
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
