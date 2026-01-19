"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Province, SelectedLocation } from "./types/administrative";
import LocationList from "./components/LocationList";
import BottomSheet from "./components/BottomSheet";
import InfoPanel from "./components/InfoPanel";
import { SheetData } from "./types/sheet-data";
import { CloseIcon } from "@/public/icon/close";

const VietnamMap = dynamic(() => import("./components/VietnamMap"), {
  ssr: false,
  loading: () => <div className="text-white">Loading Map...</div>,
});

// CSV Parser for the specific structure: starts at row 7
function parseCSV(text: string): SheetData[] {
  const lines = text.trim().split(/\r?\n/);
  // Find the header row (contains "Tỉnh mới" and "Xã mới")
  const headerIndex = lines.findIndex(line => line.includes("Tỉnh mới") && line.includes("Xã mới"));
  if (headerIndex === -1 || headerIndex >= lines.length - 1) return [];

  const headers = lines[headerIndex].split(",").map(h => h.trim().replace(/^"|"$/g, ''));

  return lines.slice(headerIndex + 1).map(line => {
    // Handling commas inside quotes properly (e.g., "1,320")
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));

    const entry: SheetData = {};
    headers.forEach((h, i) => {
      if (h) entry[h] = values[i] || "";
    });
    return entry;
  });
}

export default function Home() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [sheetData, setSheetData] = useState<SheetData[]>([]);
  const [isMobileInfoOpen, setIsMobileInfoOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isOpenInfoPanel, setIsOpenInfoPanel] = useState(false);

  // Fetch Sheet Data
  useEffect(() => {
    const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1EHrYzgmECJhLLhjCwfOA-c42nh796Xxe/export?format=csv&gid=1882977395";

    fetch(SHEET_CSV_URL)
      .then(res => {
        if (!res.ok) throw new Error("Auth/Network error");
        return res.text();
      })
      .then(text => {
        const parsed = parseCSV(text);
        setSheetData(parsed);
      })
      .catch(err => console.error("Error loading sheet data:", err));
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
          wards: (province.wards || []).map((ward: any) => ({
            name: ward.name,
            code: String(ward.code),
            provinceCode: String(ward.provinceCode),
            danSo: ward.danSo,
            dienTich: ward.dienTich,
          })),
        }));
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

  return (
    <main className="flex items-center justify-center min-h-screen bg-black overflow-hidden font-sans">
      <div className="relative w-full h-screen flex">
        {/* LEFT: Desktop Sidebar - Location List */}
        <div className="hidden md:block w-72 h-full overflow-hidden border-r border-gray-100 bg-white z-20">
          <LocationList
            provinces={provinces}
            selectedLocation={selectedLocation}
            onLocationClick={handleLocationClick}
          />
        </div>

        {/* CENTER: Map Container */}
        <div className="flex-1 relative z-10">
          <VietnamMap
            selectedLocation={selectedLocation}
            onFeatureClick={handleFeatureClick}
          />
        </div>

        {/* RIGHT: Desktop Info Panel Sidebar */}
        {isOpenInfoPanel && (
          <div className="hidden md:block w-[400px] h-full overflow-hidden border-l border-gray-100 bg-white z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.05)] animate-in slide-in-from-right duration-300">
            <button
              onClick={() => setIsOpenInfoPanel(false)}
              className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full transition-colors"
            >
              <CloseIcon />
            </button>
            <InfoPanel
              selectedLocation={selectedLocation}
              sheetData={sheetData}
            />
          </div>
        )}

        {/* MOBILE: Bottom Sheet List */}
        <div className="md:hidden">
          <BottomSheet isInfoOpened={isBottomSheetOpen} onToggle={setIsBottomSheetOpen}>
            <LocationList
              provinces={provinces}
              selectedLocation={selectedLocation}
              onLocationClick={handleLocationClick}
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
                  <InfoPanel selectedLocation={selectedLocation} sheetData={sheetData} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
