"use client";

import { useState, useEffect } from "react";

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    setIsOpen(false);
  };

  return (
    <div className="absolute top-[62px] right-[12px] z-[1000]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100"
      >
        <div className="space-y-1.5">
          <div className={`w-5 h-0.5 bg-gray-600 transition-all ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <div className={`w-5 h-0.5 bg-gray-600 transition-all ${isOpen ? 'opacity-0' : ''}`} />
          <div className={`w-5 h-0.5 bg-gray-600 transition-all ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            onClick={handleInstall}
            disabled={!deferredPrompt}
            className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors ${deferredPrompt
              ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              : 'text-gray-300 cursor-not-allowed'
              }`}
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
              <img src="/icon-512.png" alt="App Icon" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold">Cài đặt Ứng dụng</span>
              {!deferredPrompt && <span className="text-[10px] text-gray-400">Đã cài đặt hoặc không hỗ trợ</span>}
            </div>
          </button>

          <div className="h-px bg-gray-100 my-1"></div>

          <div className="px-4 py-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
            Phiên bản v2.1.0
          </div>
        </div>
      )}
    </div>
  );
}
