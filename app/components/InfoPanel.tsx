"use client";

import { useEffect, useState } from "react";
import { SelectedLocation } from "../types/administrative";
import { SheetData } from "../types/sheet-data";
import { normalizeLocationName } from "../utils/location";
import { LocationIcon } from "@/public/icon/location";

interface InfoPanelProps {
  selectedLocation: SelectedLocation | null;
  sheetData: SheetData[];
}

export default function InfoPanel({ selectedLocation, sheetData }: InfoPanelProps) {
  const [matches, setMatches] = useState<SheetData[]>([]);

  useEffect(() => {
    if (!selectedLocation || !sheetData.length) {
      setMatches([]);
      return;
    }

    const selectedNameNormalized = normalizeLocationName(selectedLocation.name);

    const filtered = sheetData.filter((row) => {
      const rowProvinceRaw = row["Tỉnh mới"] || "";
      const rowWardRaw = row["Xã mới"] || "";

      const rowProvince = normalizeLocationName(rowProvinceRaw);
      const rowWard = normalizeLocationName(rowWardRaw);

      if (selectedLocation.type === "province") {
        // Match summarized data or any data for this province
        // Note: Some rows might have "All" in Xã mới for province-level data
        return rowProvince === selectedNameNormalized;
      } else {
        // Ward-level match
        // We match Xã mới. To be precise, we should also check if it belongs to the right province 
        // (but selectedLocation only has provinceCode, not name. We can resolve it if needed)
        return rowWard === selectedNameNormalized;
      }
    });

    setMatches(filtered);
  }, [selectedLocation, sheetData]);

  if (!selectedLocation) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-gray-50/50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <LocationIcon className="w-8 h-8" />
          </div>
          <h3 className="text-gray-900 font-semibold">Chưa chọn địa điểm</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-[240px] mx-auto leading-relaxed">Chọn một tỉnh hoặc xã trên bản đồ để xem dữ liệu diện tích cây trồng chi tiết.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white/50">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-md mb-3">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            Dữ liệu cây trồng
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{selectedLocation.name}</h2>
          <p className="text-sm text-gray-400 mt-1 font-medium">Cập nhật: 20.12.2025</p>
        </div>

        {matches.length > 0 ? (
          <div className="grid gap-5">
            {matches.map((item, index) => (
              <div key={index} className="group relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-between items-start mb-5">
                  <div className="px-3 py-1.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    {item["Phân loại cây trồng"] || "Cây trồng"}
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Diện tích</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-gray-900">{item["Tổng diện tích"]}</span>
                      <span className="text-xs font-bold text-gray-400">ha</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-6 leading-tight group-hover:text-blue-600 transition-colors">
                  {item["Cây trồng"]}
                </h3>

                <div className="grid grid-cols-2 gap-6 pt-5 border-t border-gray-50">
                  <div>
                    <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Khu vực</span>
                    <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded">{item["Khu vực"] || "N/A"}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Vùng</span>
                    <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded">{item["Vùng"] || "N/A"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 px-8 text-center bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-100">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-5 text-3xl">🌾</div>
            <h4 className="text-gray-900 font-bold text-lg mb-2">Không tìm thấy dữ liệu</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              Hệ thống chưa tìm thấy thông tin cây trồng tương ứng cho <span className="font-bold text-gray-700">{selectedLocation.name}</span> trong tệp dữ liệu hiện tại.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-6 bg-gray-50/50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live Google Sheet
          </div>
          <div className="text-[10px] text-gray-300 font-medium italic">
            v1.0.2 (2025)
          </div>
        </div>
      </div>
    </div>
  );
}

