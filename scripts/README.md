# Data Merge Script

## Overview
This script merges Vietnam's administrative data (provinces, districts, wards) with GeoJSON geometry data.

## Files:
- **Input:**
  - `public/data/provinces-geo.json` - GeoJSON với 34 tỉnh (sau sáp nhập 2025)
  - API: `https://provinces.open-api.vn/api/?depth=3` - Data hành chính đầy đủ (63 tỉnh + huyện + xã)

- **Output:**
  - `public/data/vietnam-provinces.json` - GeoJSON merged (geometry + properties)
  - `public/data/vietnam-administrative.json` - Administrative data (cho sidebar list)

## Usage:
```bash
node scripts/merge-data.js
```

## What it does:
1. Loads GeoJSON with geometry (34 provinces after 2025 merger)
2. Fetches complete administrative data from API (63 provinces with districts & wards)
3. Matches province names and merges the data
4. Saves:
   - GeoJSON for map rendering
   - Administrative JSON for location list

## Note:
- GeoJSON has 34 provinces (post-merger)
- Administrative data has 63 provinces (includes all historical data)
- Name matching uses normalization to handle "Thành phố", "Tỉnh" prefixes
