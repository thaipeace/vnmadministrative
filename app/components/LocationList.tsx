"use client";

import { Province, SelectedLocation } from "../types/administrative";
import { useState, useEffect, useRef } from "react";
import { ChevronIcon } from "@/public/icon/chevron";
import { formatNumber } from "../utils/format";

interface LocationListProps {
  provinces: Province[];
  selectedLocation: SelectedLocation | null;
  onLocationClick: (location: SelectedLocation) => void;
  highlightedProvinceCodes?: string[];
}

export default function LocationList({
  provinces,
  selectedLocation,
  onLocationClick,
  highlightedProvinceCodes = [],
}: LocationListProps) {
  const [expandedProvince, setExpandedProvince] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const provinceRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (selectedLocation?.provinceCode) {
      setExpandedProvince(selectedLocation.provinceCode);

      // Use requestAnimationFrame or setTimeout to ensure the DOM has updated (expanded) before scrolling
      setTimeout(() => {
        const provinceElement = provinceRefs.current[selectedLocation.provinceCode];
        if (provinceElement) {
          provinceElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    }
  }, [selectedLocation]);

  const isActive = (
    type: "province" | "ward",
    provinceCode: string,
    wardCode?: string
  ) => {
    if (!selectedLocation) return false;

    if (type === "province") {
      return selectedLocation.provinceCode === provinceCode;
    }
    if (type === "ward") {
      return (
        selectedLocation.provinceCode === provinceCode &&
        selectedLocation.wardCode === wardCode
      );
    }
    return false;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-white/50 md:bg-white scrollbar-thin scrollbar-thumb-gray-300">
      <div className="p-4 border-b sticky top-0 z-10 bg-white md:bg-white backdrop-blur-md">
        <h2 className="text-lg font-bold text-gray-800">Danh sách địa phương</h2>
        <p className="text-xs text-gray-500 mt-1">
          {formatNumber(provinces.length)} tỉnh/thành • {formatNumber(provinces.reduce((sum, p) => sum + p.wards.length, 0))} xã/phường
        </p>
      </div>

      <div className="divide-y overflow-y-auto">
        <div>
          {provinces.map((province) => (
            <div key={province.code} className="border-b">
              {/* Province Level */}
              <div
                ref={(el) => {
                  provinceRefs.current[province.code] = el;
                }}
                className={`flex items-stretch cursor-pointer hover:bg-blue-50 transition-colors ${isActive("province", province.code)
                  ? "bg-blue-100 border-l-4 border-blue-600 font-semibold"
                  : highlightedProvinceCodes.includes(province.code)
                    ? "bg-green-50 border-l-4 border-green-500" // Secondary highlight for filter
                    : ""
                  }`}
              >
                {/* Province Info - Click to select */}
                <div
                  className="flex-1 p-3"
                  onClick={() => {
                    onLocationClick({
                      type: "province",
                      provinceCode: province.code,
                      name: province.name,
                    });
                  }}
                >
                  <span className="text-sm font-medium text-gray-900">
                    {province.name}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({province.wards.length})
                  </span>
                </div>

                {/* Caret Icon - Click to toggle wards */}
                <div
                  className="px-4 flex items-center justify-center border-l border-black/5 hover:bg-black/5 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedProvince(
                      expandedProvince === province.code ? null : province.code
                    );
                  }}
                >
                  <ChevronIcon
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedProvince === province.code ? "rotate-90" : ""
                      }`}
                  />
                </div>
              </div>

              {/* Wards - Collapsed/Expanded */}
              {expandedProvince === province.code && (
                <div className="max-h-96 overflow-y-auto">
                  {province.wards.map((ward) => (
                    <div
                      key={ward.code}
                      className={`pl-8 pr-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${isActive("ward", province.code, ward.code)
                        ? "bg-blue-50 border-l-4 border-blue-400 font-medium"
                        : ""
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLocationClick({
                          type: "ward",
                          provinceCode: province.code,
                          wardCode: ward.code,
                          name: ward.name,
                        });
                      }}
                    >
                      <span className="text-xs text-gray-700">{ward.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
