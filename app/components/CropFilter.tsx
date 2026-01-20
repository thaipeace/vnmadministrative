"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronIcon } from "@/public/icon/chevron";

interface CropFilterProps {
    availableCrops: string[];
    selectedCrops: string[];
    onCropToggle: (crop: string) => void;
    onClearAll: () => void;
}

export default function CropFilter({
    availableCrops,
    selectedCrops,
    onCropToggle,
    onClearAll,
}: CropFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-400 transition-all text-sm group"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-gray-500 shrink-0">
                        {selectedCrops.length > 0 ? (
                            <span className="bg-blue-600 text-white min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold">
                                {selectedCrops.length}
                            </span>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        )}
                    </span>
                    <span className={`truncate font-medium ${selectedCrops.length > 0 ? "text-blue-600" : "text-gray-700"}`}>
                        {selectedCrops.length === 0
                            ? "Tất cả cây trồng"
                            : selectedCrops.length === 1
                                ? selectedCrops[0]
                                : `${selectedCrops.length} loại cây đã chọn`}
                    </span>
                </div>
                <ChevronIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-90" : "rotate-0"}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-[60] py-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 pb-2 border-b border-gray-50 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Danh sách cây trồng</span>
                        {selectedCrops.length > 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onClearAll(); }}
                                className="text-[10px] font-bold text-red-500 hover:text-red-600"
                            >
                                Xóa hết
                            </button>
                        )}
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                        {availableCrops.map((crop) => (
                            <div
                                key={crop}
                                onClick={() => onCropToggle(crop)}
                                className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${selectedCrops.includes(crop) ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"
                                    }`}>
                                    {selectedCrops.includes(crop) && (
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`text-sm ${selectedCrops.includes(crop) ? "text-blue-700 font-medium" : "text-gray-600"}`}>
                                    {crop}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
