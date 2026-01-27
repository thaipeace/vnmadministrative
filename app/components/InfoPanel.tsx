"use client";

import { useEffect, useState } from "react";
import { Province, SelectedLocation } from "../types/administrative";
import { ProcessedLocationData, CropData, StageData, MedicineData } from "../types/sheet-data";
import { normalizeLocationName } from "../utils/location";
import { LocationIcon } from "@/public/icon/location";
import { getGoogleDriveDirectLink } from "../utils/drive";

interface InfoPanelProps {
  selectedLocation: SelectedLocation | null;
  sheetData: ProcessedLocationData[];
  provinces: Province[];
  productCatalog: Record<string, string>;
}

export default function InfoPanel({ selectedLocation, sheetData, provinces, productCatalog }: InfoPanelProps) {
  const [match, setMatch] = useState<ProcessedLocationData | null>(null);

  useEffect(() => {
    if (!selectedLocation || !sheetData.length) {
      setMatch(null);
      return;
    }

    const selectedNameNormalized = normalizeLocationName(selectedLocation.name);
    const parentProvince = provinces.find(p => p.code === selectedLocation.provinceCode);
    const provinceNameNormalized = parentProvince ? normalizeLocationName(parentProvince.name) : "";

    const found = sheetData.find((row) => {
      const rowProvince = normalizeLocationName(row.province);
      const rowWard = normalizeLocationName(row.ward);

      if (selectedLocation.type === "province") {
        // Match province level data
        return rowProvince === selectedNameNormalized &&
          (rowWard === "all" || rowWard === "tongcong" || !rowWard);
      } else {
        // Ward-level match - must also match province to be safe
        return rowWard === selectedNameNormalized && rowProvince === provinceNameNormalized;
      }
    });
    setMatch(found || null);
  }, [selectedLocation, sheetData, provinces]);

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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-md mb-3">
          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
          Dữ liệu nông nghiệp
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{selectedLocation.name}</h2>
        <div className="flex items-center gap-4 mt-3">
          <div>
            <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Tổng diện tích thực tế</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">{match?.totalArea || "---"}</span>
              <span className="text-[10px] font-bold text-gray-400">ha</span>
            </div>
          </div>
          <div className="w-px h-8 bg-gray-100"></div>
          <div>
            <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Cơ hội thị trường</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-blue-600">{match?.opportunity || "---"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/30">
        {match && match.crops.length > 0 ? (
          <div className="space-y-10">
            {match.crops.map((crop: CropData, cIdx: number) => (
              <div key={cIdx} className="space-y-6">
                {/* Crop Header */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <h3 className="text-xl font-black text-green-700 flex items-center gap-2">
                    <span className="text-2xl">🌱</span> {crop.name}
                  </h3>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Diện tích cây trồng</span>
                    <div className="text-sm font-bold text-gray-900">{crop.totalArea} ha</div>
                  </div>
                </div>

                {/* Stages */}
                <div className="space-y-8">
                  {crop.stages.map((stage: StageData, sIdx: number) => (
                    <div key={sIdx} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-800 bg-white border border-gray-100 px-3 py-1.5 rounded-lg shadow-sm">
                          {stage.name || "Giai đoạn chung"}
                        </h4>
                        <div className="flex gap-4 text-[10px]">
                          {stage.totalArea && stage.totalArea !== "0" && (
                            <div className="text-right">
                              <span className="text-gray-400 font-bold uppercase block">Diện tích</span>
                              <span className="font-bold text-gray-700">{stage.totalArea} ha</span>
                            </div>
                          )}
                          {stage.opportunity && stage.opportunity !== "0" && (
                            <div className="text-right">
                              <span className="text-gray-400 font-bold uppercase block">Cơ hội</span>
                              <span className="font-bold text-blue-600">{stage.opportunity}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Products/Medicines Grid */}
                      <div className="grid grid-cols-1 gap-3">
                        {stage.medicines.map((med: MedicineData, mIdx: number) => {
                          const rawUrl = productCatalog[med.name] || med.imageUrl;
                          const directUrl = getGoogleDriveDirectLink(rawUrl);

                          return (
                            <div key={mIdx} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                              {directUrl ? (
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-50">
                                  <img
                                    src={directUrl}
                                    alt={med.name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=No+Image";
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                                  💊
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-gray-800 truncate">{med.name}</div>
                                <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Giá trị / Liều lượng</div>
                                <div className="text-sm font-black text-blue-600">{med.value}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 px-8 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl">🌾</div>
            <h4 className="text-gray-900 font-bold text-lg mb-2">Không tìm thấy dữ liệu cây trồng</h4>
            <p className="text-sm text-gray-500 leading-relaxed max-w-[240px] mx-auto">
              Hệ thống chưa tìm thấy thông tin chi tiết các loại thuốc và giai đoạn cho {selectedLocation.name} trong tệp dữ liệu hiện tại.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center justify-between opacity-50">
          <div className="flex items-center gap-2 text-[8px] text-gray-400 font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Sheet: Final
          </div>
          <div className="text-[8px] text-gray-300 font-medium italic uppercase tracking-widest">
            Admin Interaction v2.0
          </div>
        </div>
      </div>
    </div>
  );
}
