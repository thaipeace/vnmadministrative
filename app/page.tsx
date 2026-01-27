"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Province, SelectedLocation } from "./types/administrative";
import LocationList from "./components/LocationList";
import BottomSheet from "./components/BottomSheet";
import InfoPanel from "./components/InfoPanel";
import CropFilter from "./components/CropFilter";
import { ProcessedLocationData, SheetResult } from "./types/sheet-data";
import { CloseIcon } from "@/public/icon/close";
import { normalizeLocationName } from "./utils/location";
import { parseGoogleSheetResponse } from "./utils/sheet-parser";
import HamburgerMenu from "./components/HamburgerMenu";

const VietnamMap = dynamic(() => import("./components/VietnamMap"), {
  ssr: false,
  loading: () => <div className="text-white">Loading Map...</div>,
});


export default function Home() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [sheetData, setSheetData] = useState<SheetResult>({ locations: [], productCatalog: {} });
  const [isMobileInfoOpen, setIsMobileInfoOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isOpenInfoPanel, setIsOpenInfoPanel] = useState(false);
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);

  // Fetch Sheet Data
  useEffect(() => {
    const SHEET_ID = "14hg74J-k4Wlzi3EulkouXfefWzBcuJQ89J70b-0wgAQ";
    const API_KEY = "AIzaSyBhjziOYoLoj76NCoSMAd7GZMww5vK1agc";
    const RANGE = "final!A1:BFI1043";

    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`)
      .then(res => {
        if (!res.ok) throw new Error("Auth/Network error");
        return res.json();
      })
      .then(data => {
        if (data.values) {
          const processed = parseGoogleSheetResponse(data.values);
          setSheetData(processed);
        }
      })
      .catch(err => console.error("Error loading sheet data:", err));

    // Register Service Worker for PWA
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("SW registered:", reg))
          .catch((err) => console.error("SW registration failed:", err));
      });
    }
  }, []);

  useEffect(() => {
    // Load administrative data
    fetch("/data/vietnam-administrative.json")
      .then((res) => res.json())
      .then((data) => {
        const transformedProvinces: Province[] = data.map((province: any) => ({
          name: province.name,
          code: String(province.code),
          danSo: province.danSo,
          dienTich: province.dienTich,
          wards: (province.wards || [])
            .map((ward: any) => ({
              name: ward.name,
              code: String(ward.code),
              provinceCode: String(ward.provinceCode),
              danSo: ward.danSo,
              dienTich: ward.dienTich,
            }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name, "vi")),
        })).sort((a: Province, b: Province) => a.name.localeCompare(b.name, "vi"));
        setProvinces(transformedProvinces);
      })
      .catch((err) => {
        console.error("Failed to load administrative data:", err);
      });
  }, []);

  const handleLocationClick = (location: SelectedLocation) => {
    setSelectedLocation(location);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobileInfoOpen(true);
      setIsBottomSheetOpen(true);
    }
  };

  const handleFeatureClick = (location: SelectedLocation) => {
    setSelectedLocation(location);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobileInfoOpen(true);
      setIsBottomSheetOpen(true);
    }
  };

  useEffect(() => {
    setIsOpenInfoPanel(!!selectedLocation);
  }, [selectedLocation]);

  // Extract unique crops
  const availableCrops = Array.from(new Set(sheetData.locations.flatMap(item => item.crops.map(c => c.name)).filter(Boolean))).sort();

  // Get province codes that grow selected crops
  const highlightedProvinceCodes = selectedCrops.length > 0
    ? Array.from(new Set(sheetData.locations
      .filter(item => item.crops.some(c => selectedCrops.includes(c.name)))
      .map(item => {
        // Robust matching for province names to get codes
        const rowProv = normalizeLocationName(item.province || "");
        const matchingProv = provinces.find(p => normalizeLocationName(p.name) === rowProv);
        return matchingProv?.code;
      })
      .filter(Boolean) as string[]))
    : [];

  const handleCropToggle = (crop: string) => {
    setSelectedCrops(prev =>
      prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop]
    );
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-black overflow-hidden font-sans">
      <div className="relative w-full h-screen flex">
        {/* LEFT: Desktop Sidebar - Location List */}
        <div className="hidden md:flex md:flex-col w-80 h-full border-r border-gray-100 bg-white z-20  shrink-0">
          <div className="p-4 border-b bg-white">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Lọc theo cây trồng</h3>
            <CropFilter
              availableCrops={availableCrops}
              selectedCrops={selectedCrops}
              onCropToggle={handleCropToggle}
              onClearAll={() => setSelectedCrops([])}
            />
            {selectedCrops.length > 0 && (
              <p className="text-[10px] text-blue-500 font-bold mt-3 italic bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                Đang hiển thị {highlightedProvinceCodes.length} tỉnh có trồng các loại cây này
              </p>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <LocationList
              provinces={provinces}
              selectedLocation={selectedLocation}
              onLocationClick={handleLocationClick}
              highlightedProvinceCodes={highlightedProvinceCodes}
            />
          </div>
        </div>

        {/* CENTER: Map Container */}
        <div className="flex-1 relative z-10">
          <HamburgerMenu />
          <VietnamMap
            selectedLocation={selectedLocation}
            onFeatureClick={handleFeatureClick}
            highlightedProvinceCodes={highlightedProvinceCodes}
          />
        </div>

        {/* RIGHT: Desktop Info Panel Sidebar */}
        {isOpenInfoPanel && (
          <div className="hidden md:block w-[400px] h-full overflow-hidden border-l border-gray-100 bg-white z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.05)] animate-in slide-in-from-right duration-300 shrink-0">
            <button
              onClick={() => setIsOpenInfoPanel(false)}
              className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full transition-colors"
            >
              <CloseIcon />
            </button>
            <InfoPanel
              selectedLocation={selectedLocation}
              sheetData={sheetData.locations}
              provinces={provinces}
              productCatalog={sheetData.productCatalog}
            />
          </div>
        )}

        {/* MOBILE: Bottom Sheet List */}
        <div className="md:hidden">
          <BottomSheet isInfoOpened={isBottomSheetOpen} onToggle={setIsBottomSheetOpen}>
            <div className="px-4 py-4 border-b bg-gray-50/50">
              <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Lọc cây trồng</h3>
              <CropFilter
                availableCrops={availableCrops}
                selectedCrops={selectedCrops}
                onCropToggle={handleCropToggle}
                onClearAll={() => setSelectedCrops([])}
              />
            </div>
            <LocationList
              provinces={provinces}
              selectedLocation={selectedLocation}
              onLocationClick={handleLocationClick}
              highlightedProvinceCodes={highlightedProvinceCodes}
            />
          </BottomSheet>

          {/* MOBILE: Info Modal/Popup */}
          {isMobileInfoOpen && selectedLocation && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setIsMobileInfoOpen(false)}
              />

              <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10">
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{selectedLocation.name}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">
                      {selectedLocation.type === 'ward' ? 'Xã / Phường' : 'Tỉnh / Thành phố'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsMobileInfoOpen(false)}
                    className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full transition-colors"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <InfoPanel
                    selectedLocation={selectedLocation}
                    sheetData={sheetData.locations}
                    provinces={provinces}
                    productCatalog={sheetData.productCatalog}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

