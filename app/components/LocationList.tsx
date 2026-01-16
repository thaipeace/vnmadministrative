"use client";

import { Province, SelectedLocation } from "../types/administrative";
import { useState } from "react";

interface LocationListProps {
  provinces: Province[];
  selectedLocation: SelectedLocation | null;
  onLocationClick: (location: SelectedLocation) => void;
}

export default function LocationList({
  provinces,
  selectedLocation,
  onLocationClick,
}: LocationListProps) {
  const [expandedProvince, setExpandedProvince] = useState<string | null>(null);

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
    <div className="h-full overflow-y-auto bg-white">
      <div className="p-4 border-b sticky top-0 bg-white z-10">
        <h2 className="text-lg font-bold text-gray-800">Danh sách địa phương</h2>
        <p className="text-xs text-gray-500 mt-1">
          {provinces.length} tỉnh/thành • {provinces.reduce((sum, p) => sum + p.wards.length, 0)} xã/phường
        </p>
      </div>

      <div className="divide-y">
        {provinces.map((province) => (
          <div key={province.code} className="border-b">
            {/* Province Level */}
            <div
              className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors ${isActive("province", province.code)
                  ? "bg-blue-100 border-l-4 border-blue-600 font-semibold"
                  : ""
                }`}
              onClick={() => {
                onLocationClick({
                  type: "province",
                  provinceCode: province.code,
                  name: province.name,
                });
                setExpandedProvince(
                  expandedProvince === province.code ? null : province.code
                );
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    {province.name}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({province.wards.length} xã/phường)
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${expandedProvince === province.code ? "rotate-90" : ""
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            {/* Wards - Collapsed/Expanded */}
            {expandedProvince === province.code && (
              <div className="bg-gray-50 max-h-96 overflow-y-auto">
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
  );
}
