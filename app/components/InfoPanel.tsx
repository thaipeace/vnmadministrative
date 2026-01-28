"use client";

import { useEffect, useState } from "react";
import { Province, SelectedLocation } from "../types/administrative";
import { ProcessedLocationData, CropData, StageData, MedicineData, ProductInfo } from "../types/sheet-data";
import { normalizeLocationName } from "../utils/location";
import { LocationIcon } from "@/public/icon/location";
import { getGoogleDriveDirectLink } from "../utils/drive";

interface InfoPanelProps {
  selectedLocation: SelectedLocation | null;
  sheetData: ProcessedLocationData[];
  provinces: Province[];
  productCatalog: Record<string, ProductInfo>;
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
          (rowWard === "all" || rowWard === "tongcong" || !rowWard || rowWard === "total");
      } else {
        // Ward-level match
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
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-md mb-3">
          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
          Dữ liệu nông nghiệp
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{selectedLocation.name}</h2>
        <div className="flex items-center gap-4 mt-3">
          <div>
            <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Tổng diện tích thực tế</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-gray-900">{match?.totalArea || "---"}</span>
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
      <div className="flex-1 overflow-y-auto p-6 space-y-10 bg-gray-50/20">
        {match && match.crops.length > 0 ? (
          <div className="space-y-12">
            {match.crops.map((crop: CropData, cIdx: number) => (
              <div key={cIdx} className="space-y-8">
                {/* Crop Header */}
                <div className="flex items-center justify-between border-b-2 border-emerald-100 pb-3">
                  <h3 className="text-xl font-black text-emerald-800 flex items-center gap-2">
                    <span className="text-2xl">🌱</span> {crop.name}
                  </h3>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Tổng diện tích</span>
                    <div className="text-sm font-bold text-gray-900">{crop.totalArea} ha</div>
                  </div>
                </div>

                {/* Stages */}
                <div className="space-y-12">
                  {crop.stages.map((stage: StageData, sIdx: number) => (
                    <div key={sIdx} className="relative pl-6 border-l-2 border-emerald-50 space-y-6">
                      {/* Stage Name Badge */}
                      <div className="absolute -left-[11px] top-0 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white shadow-sm"></div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-black text-gray-800 uppercase tracking-tight">
                          {stage.name || "Giai đoạn chung"}
                        </h4>
                        <div className="flex gap-4">
                          {stage.totalArea && stage.totalArea !== "0" && (
                            <div className="text-right">
                              <span className="text-[8px] text-gray-300 font-bold uppercase block">Diện tích</span>
                              <span className="text-xs font-bold text-gray-600">{stage.totalArea} ha</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 1. DỊCH HẠI Section */}
                      {stage.pests.length > 0 && (
                        <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100/50">
                          <h5 className="text-[10px] font-black text-orange-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-1 h-3 bg-orange-400 rounded-full"></span>
                            Dịch hại
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {stage.pests.map((pest, pIdx) => (
                              <span key={pIdx} className="px-2.5 py-1 bg-white text-orange-600 text-xs font-bold rounded-lg border border-orange-100 shadow-sm">
                                {pest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. GIẢI PHÁP Section */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1 h-3 bg-emerald-400 rounded-full"></span>
                          Giải pháp sản phẩm
                        </h5>
                        <div className="grid grid-cols-1 gap-3">
                          {stage.medicines.map((med: MedicineData, mIdx: number) => {
                            const prodInfo = productCatalog[med.name];
                            const directUrl = getGoogleDriveDirectLink(prodInfo?.image || med.imageUrl);

                            return (
                              <div key={mIdx} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-50 group-hover:scale-105 transition-transform">
                                  {directUrl ? (
                                    <img
                                      src={directUrl}
                                      alt={med.name}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Solution";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-black text-gray-800 leading-tight mb-1">{med.name}</div>
                                  <div className="text-[10px] text-gray-400 font-medium line-clamp-1 italic mb-2">Đối tượng: {med.pest || "---"}</div>
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                      {med.value}
                                    </div>
                                    {prodInfo?.price && prodInfo.price !== "0" && (
                                      <div className="text-[10px] font-bold text-gray-400">
                                        {Number(prodInfo.price).toLocaleString('vi-VN')} đ
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. CƠ HỘI THỊ TRƯỜNG Section */}
                      {stage.opportunity && stage.opportunity !== "0" && (
                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                          <h5 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-1 h-3 bg-blue-400 rounded-full"></span>
                            Cơ hội thị trường
                          </h5>
                          <div className="text-lg font-black text-blue-800">
                            {stage.opportunity}
                            <span className="text-xs ml-1 font-bold text-blue-400 uppercase">ha khả thi</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 px-8 text-center bg-white rounded-[40px] border-2 border-dashed border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-5xl grayscale opacity-50">🌾</div>
            <h4 className="text-gray-900 font-black text-xl mb-3">Chưa có dữ liệu chi tiết</h4>
            <p className="text-sm text-gray-400 leading-relaxed max-w-[260px] mx-auto">
              Hệ thống chưa ghi nhận giải pháp cụ thể cho <span className="font-bold text-gray-700">{selectedLocation.name}</span> ở tệp dữ liệu này.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-5 bg-white border-t border-gray-50">
        <div className="flex items-center justify-between opacity-30">
          <div className="flex items-center gap-2 text-[8px] text-gray-400 font-black uppercase tracking-[0.2em]">
            <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
            Unified Agriculture Data
          </div>
          <div className="text-[8px] text-gray-300 font-bold uppercase tracking-widest">
            v2.5.0
          </div>
        </div>
      </div>
    </div>
  );
}
