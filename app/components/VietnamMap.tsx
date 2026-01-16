"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, LayersControl, Polygon, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { SelectedLocation } from "../types/administrative";

// Fix for default marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const PROVINCE_GEOJSON_URL = "/data/vietnam-provinces.json";

const VIETNAM_BOUNDS: L.LatLngBoundsExpression = [
  [6.0, 101.5],
  [24.5, 119.0],
];

interface MapControllerProps {
  provinceGeoJson: any;
  selectedLocation: SelectedLocation | null;
  onFeatureClick: (location: SelectedLocation) => void;
}

function MapController({ provinceGeoJson, selectedLocation, onFeatureClick }: MapControllerProps) {
  const map = useMap();
  const highlightLayerRef = useRef<L.LayerGroup | null>(null);
  const [wardGeoJson, setWardGeoJson] = useState<any>(null);
  const [currentProvinceLoaded, setCurrentProvinceLoaded] = useState<string | null>(null);

  useEffect(() => {
    map.setMaxBounds(VIETNAM_BOUNDS);
    map.setMinZoom(7);

    if (provinceGeoJson) {
      const geoJsonLayer = L.geoJSON(provinceGeoJson);
      const bounds = geoJsonLayer.getBounds();
      map.fitBounds(bounds, { padding: [10, 10] });
    } else {
      map.fitBounds(VIETNAM_BOUNDS);
    }
  }, [provinceGeoJson, map]);

  // Load ward GeoJSON when a province is selected
  useEffect(() => {
    if (!selectedLocation) {
      setWardGeoJson(null);
      setCurrentProvinceLoaded(null);
      return;
    }

    const pCode = selectedLocation.provinceCode;
    if (pCode && pCode !== currentProvinceLoaded) {
      fetch(`/data/wards/${pCode}.json`)
        .then(res => res.json())
        .then(data => {
          setWardGeoJson(data);
          setCurrentProvinceLoaded(pCode);
        })
        .catch(err => {
          console.error(`Failed to load wards for province ${pCode}:`, err);
          setWardGeoJson(null);
        });
    }
  }, [selectedLocation, currentProvinceLoaded]);

  // Handle selected location - zoom and highlight
  useEffect(() => {
    if (!selectedLocation) return;

    // Clear previous highlight
    if (highlightLayerRef.current) {
      map.removeLayer(highlightLayerRef.current);
    }

    let targetFeature: any = null;

    if (selectedLocation.type === 'province' && provinceGeoJson) {
      targetFeature = provinceGeoJson.features.find((f: any) => f.properties.code === selectedLocation.provinceCode);
    } else if (selectedLocation.type === 'ward' && wardGeoJson) {
      targetFeature = wardGeoJson.features.find((f: any) => f.properties.code === selectedLocation.wardCode);
    }

    if (targetFeature) {
      const group = L.layerGroup();

      const highlight = L.geoJSON(targetFeature, {
        style: {
          color: "#3B82F6",
          weight: 4,
          fillOpacity: 0.3,
          fillColor: "#3B82F6",
        }
      });

      highlight.addTo(group);
      highlightLayerRef.current = group;
      group.addTo(map);

      // Zoom to feature
      const bounds = highlight.getBounds();
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: selectedLocation.type === 'ward' ? 14 : 12
      });
    }
  }, [selectedLocation, provinceGeoJson, wardGeoJson, map]);

  return (
    <>
      {/* Show ward borders of the selected province if available */}
      {wardGeoJson && (
        <GeoJSON
          key={`wards-${currentProvinceLoaded}`}
          data={wardGeoJson}
          style={{
            color: "#666",
            weight: 1,
            fillOpacity: 0.05,
            fillColor: "#000"
          }}
          onEachFeature={(feature, layer) => {
            layer.on({
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                onFeatureClick({
                  type: 'ward',
                  provinceCode: feature.properties.provinceCode,
                  wardCode: feature.properties.code,
                  name: feature.properties.name
                });
              },
              mouseover: (e) => {
                const l = e.target;
                l.setStyle({ fillOpacity: 0.2, weight: 2 });
              },
              mouseout: (e) => {
                const l = e.target;
                l.setStyle({ fillOpacity: 0.05, weight: 1 });
              }
            });
          }}
        />
      )}
    </>
  );
}

interface VietnamMapProps {
  selectedLocation: SelectedLocation | null;
  onFeatureClick: (location: SelectedLocation) => void;
}

export default function VietnamMap({ selectedLocation, onFeatureClick }: VietnamMapProps) {
  const [geoJson, setGeoJson] = useState<any>(null);
  const [maskPositions, setMaskPositions] = useState<L.LatLngExpression[][]>([]);

  useEffect(() => {
    const outerBounds = [
      [90, -180],
      [90, 180],
      [-90, 180],
      [-90, -180],
    ] as L.LatLngExpression[];

    fetch(PROVINCE_GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => {
        setGeoJson(data);

        const holes: L.LatLngExpression[][] = [];

        data.features.forEach((feature: any) => {
          const type = feature.geometry.type;
          const coords = feature.geometry.coordinates;

          if (type === "Polygon") {
            const hole = coords[0].map((p: number[]) => [p[1], p[0]]);
            holes.push(hole);
          } else if (type === "MultiPolygon") {
            coords.forEach((poly: any[]) => {
              const hole = poly[0].map((p: number[]) => [p[1], p[0]]);
              holes.push(hole);
            });
          }
        });

        setMaskPositions([outerBounds, ...holes]);
      })
      .catch((err) => console.error("Failed to load map data", err));
  }, []);

  const onEachFeature = (feature: any, layer: L.Layer) => {
    layer.on({
      click: (e) => {
        L.DomEvent.stopPropagation(e);
        const props = feature.properties;
        onFeatureClick({
          type: "province",
          provinceCode: props.code,
          name: props.name,
        });
      },
      mouseover: (e: L.LeafletMouseEvent) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          color: "#444",
          fillOpacity: 0.1,
        });
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        const layer = e.target;
        layer.setStyle({
          weight: 1,
          color: "#999",
          fillOpacity: 0,
        });
      },
    });
  };

  return (
    <div className="w-full h-full relative bg-[#1a1a1a]">
      <MapContainer
        center={[10.8231, 106.6297]}
        zoom={7}
        style={{ width: "100%", height: "100%", backgroundColor: "#1a1a1a" }}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        maxBounds={VIETNAM_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        <MapController
          provinceGeoJson={geoJson}
          selectedLocation={selectedLocation}
          onFeatureClick={onFeatureClick}
        />

        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Vệ tinh (Satellite)">
            <TileLayer
              attribution="Esri World Imagery"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Bản đồ đường phố (OSM)">
            <TileLayer
              attribution="OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <TileLayer
          attribution="CartoDB"
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
          zIndex={100}
        />

        {/* Interactive Province Layer */}
        {geoJson && (
          <GeoJSON
            data={geoJson}
            style={{
              color: "#999",
              weight: 1,
              fillOpacity: 0,
            }}
            onEachFeature={onEachFeature}
          />
        )}

        {maskPositions.length > 0 && (
          <Polygon
            positions={maskPositions}
            pathOptions={{
              color: "transparent",
              fillColor: "#ffffff",
              fillOpacity: 1.0,
              interactive: false,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
