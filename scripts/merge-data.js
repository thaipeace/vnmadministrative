const fs = require('fs');
const path = require('path');

// Helper function to simplify/round coordinates to reduce file size
function simplifyGeometry(geometry) {
    if (!geometry) return null;

    const round = (val) => Math.round(val * 100000) / 100000;

    if (geometry.type === 'Polygon') {
        return {
            ...geometry,
            coordinates: geometry.coordinates.map(ring =>
                ring.map(coord => [round(coord[0]), round(coord[1])])
            )
        };
    } else if (geometry.type === 'MultiPolygon') {
        return {
            ...geometry,
            coordinates: geometry.coordinates.map(polygon =>
                polygon.map(ring =>
                    ring.map(coord => [round(coord[0]), round(coord[1])])
                )
            )
        };
    }
    return geometry;
}

async function mergeNewStructure() {
    try {
        console.log('🔄 Processing data for 2-level structure (Province -> Ward)...\n');

        // 1. Create wards directory if not exists
        const wardsDir = path.join(__dirname, '../public/data/wards');
        if (!fs.existsSync(wardsDir)) {
            fs.mkdirSync(wardsDir, { recursive: true });
        }

        // 2. Load province-level GeoJSON (34 provinces)
        const provincesGeoPath = path.join(__dirname, '../public/data/provinces-geo.json');
        const provincesGeo = JSON.parse(fs.readFileSync(provincesGeoPath, 'utf8'));
        console.log(`✓ Loaded ${provincesGeo.features.length} provinces`);

        // 3. Load ward-level GeoJSON
        const wardsGeoPath = path.join(__dirname, '../public/data/administrative-geo.json');
        const wardsGeo = JSON.parse(fs.readFileSync(wardsGeoPath, 'utf8'));
        console.log(`✓ Loaded ${wardsGeo.features.length} wards`);

        // 4. Map wards to provinces and simplify coordinates
        const provinceWards = {}; // Stores GeoJSON for each province's wards
        const administrativeData = []; // Hierarchical structure for sidebar

        // Group for administrative listing and prep geo files
        wardsGeo.features.forEach(feature => {
            const props = feature.properties;
            const provinceCode = String(props.maTinh || props.maTinh_BNV);

            if (!provinceWards[provinceCode]) {
                provinceWards[provinceCode] = {
                    type: 'FeatureCollection',
                    features: []
                };
            }

            // Add to GeoJSON collection for this province
            provinceWards[provinceCode].features.push({
                type: 'Feature',
                properties: {
                    name: props.tenXa,
                    code: String(props.maXa || props.maXa_BNV),
                    provinceCode: provinceCode,
                    danSo: props.danSo,
                    dienTich: props.dienTich
                },
                geometry: simplifyGeometry(feature.geometry)
            });
        });

        // 5. Save individual province ward files and build admin structure
        const provinceCodes = Object.keys(provinceWards);
        provinceCodes.forEach(code => {
            const pWardsGeo = provinceWards[code];
            const pName = pWardsGeo.features[0].properties.tenTinh ||
                provincesGeo.features.find(p => String(p.properties.maTinh || p.properties.maTinh_BNV) === code)?.properties.tenTinh ||
                "Tỉnh " + code;

            // Save GeoJSON for this province's wards
            fs.writeFileSync(
                path.join(wardsDir, `${code}.json`),
                JSON.stringify(pWardsGeo)
            );

            // Add to administrative hierarchy
            administrativeData.push({
                name: pName,
                code: code,
                wards: pWardsGeo.features.map(f => ({
                    name: f.properties.name,
                    code: f.properties.code,
                    provinceCode: code,
                    danSo: f.properties.danSo,
                    dienTich: f.properties.dienTich
                }))
            });
        });

        // 6. Save simplified Province GeoJSON
        const simplifiedProvinceGeo = {
            type: 'FeatureCollection',
            features: provincesGeo.features.map(feature => ({
                ...feature,
                properties: {
                    ...feature.properties,
                    name: feature.properties.tenTinh,
                    code: String(feature.properties.maTinh || feature.properties.maTinh_BNV)
                },
                geometry: simplifyGeometry(feature.geometry)
            }))
        };

        fs.writeFileSync(
            path.join(__dirname, '../public/data/vietnam-provinces.json'),
            JSON.stringify(simplifiedProvinceGeo)
        );

        // 7. Save administrative hierarchy
        administrativeData.sort((a, b) => a.name.localeCompare(b.name));
        fs.writeFileSync(
            path.join(__dirname, '../public/data/vietnam-administrative.json'),
            JSON.stringify(administrativeData, null, 2)
        );

        console.log(`\n✅ Successfully generated data:`);
        console.log(`- 34 province ward files in public/data/wards/`);
        console.log(`- Updated vietnam-provinces.json (simplified)`);
        console.log(`- Updated vietnam-administrative.json`);

    } catch (error) {
        console.error('❌ Error merging data:', error);
        process.exit(1);
    }
}

mergeNewStructure();
