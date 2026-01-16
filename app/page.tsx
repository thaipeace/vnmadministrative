"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Province, SelectedLocation } from "./types/administrative";
import LocationList from "./components/LocationList";
import BottomSheet from "./components/BottomSheet";

const VietnamMap = dynamic(() => import("./components/VietnamMap"), {
  ssr: false,
  loading: () => <div className="text-white">Loading Map...</div>,
});

export default function Home() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);

  useEffect(() => {
    // Load administrative data with new 2-level structure (Province -> Ward)
    fetch("/data/vietnam-administrative.json")
      .then((res) => res.json())
      .then((data) => {
        // Data is already in correct format
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
        setProvinces([]);
      });
  }, []);

  const handleLocationClick = (location: SelectedLocation) => {
    setSelectedLocation(location);
  };

  const handleFeatureClick = (location: SelectedLocation) => {
    setSelectedLocation(location);
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-black overflow-hidden">
      <div className="relative w-full h-screen flex">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:block w-80 h-full overflow-hidden border-r border-gray-200 bg-white">
          <LocationList
            provinces={provinces}
            selectedLocation={selectedLocation}
            onLocationClick={handleLocationClick}
          />
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <VietnamMap
            selectedLocation={selectedLocation}
            onFeatureClick={handleFeatureClick}
          />
        </div>

        {/* Mobile Bottom Sheet - Hidden on desktop */}
        <div className="md:hidden">
          <BottomSheet>
            <LocationList
              provinces={provinces}
              selectedLocation={selectedLocation}
              onLocationClick={handleLocationClick}
            />
          </BottomSheet>
        </div>
      </div>
    </main>
  );
}
