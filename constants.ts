import { City, Yield, Asset, Point } from './types';

const ASSET_PREFIXES = ['金龍', '大安', '信義', '忠孝', '和平', '國際'];
const ASSET_TYPES = ['公寓', '辦公大樓', '7-11便利商店', '餐廳', '公車站', '變電箱', 'Toyota Altis', 'Gogoro VIVA', '麵包店', '診所', '交通號誌'];
const STREET_SUFFIXES = ['路', '街', '大道'];

const generateCityAssets = (cityCenter: Point): Asset[] => {
  const assets: Asset[] = [];
  const SPREAD = 0.1; // ~11km radius spread in lat/lng degrees, to cover the largest blast radius

  for (let i = 0; i < 2500; i++) {
    const prefix = ASSET_PREFIXES[Math.floor(Math.random() * ASSET_PREFIXES.length)];
    const type = ASSET_TYPES[Math.floor(Math.random() * ASSET_TYPES.length)];
    const street = `${Math.floor(Math.random() * 200) + 1}號`;
    const suffix = STREET_SUFFIXES[Math.floor(Math.random() * STREET_SUFFIXES.length)];
    
    let name = `${type} (${prefix}${suffix} ${street})`;
    if (type.includes('Toyota') || type.includes('Gogoro')) {
      name = `${type} #${Math.floor(Math.random() * 9000) + 1000}`;
    }

    assets.push({
      id: crypto.randomUUID(),
      name,
      coords: {
        lat: cityCenter.lat + (Math.random() - 0.5) * SPREAD * 2,
        lng: cityCenter.lng + (Math.random() - 0.5) * SPREAD * 2,
      },
    });
  }
  return assets;
};

export const CITIES: City[] = [
  {
    name: '台北市',
    coords: { lat: 25.0478, lng: 121.5319 }, // Taipei Main Station
    population: 2600000,
    landmarks: [
      { name: '台北101', coords: { lat: 25.0336, lng: 121.5645 } },
      { name: '總統府', coords: { lat: 25.0405, lng: 121.5128 } },
      { name: '台北車站', coords: { lat: 25.0478, lng: 121.5170 } },
      { name: '松山機場', coords: { lat: 25.0690, lng: 121.5526 } },
    ],
    assets: [],
  },
  {
    name: '台中市',
    coords: { lat: 24.1477, lng: 120.6736 }, // Taichung City Hall
    population: 2800000,
    landmarks: [
      { name: '台中車站', coords: { lat: 24.1373, lng: 120.6865 } },
      { name: '國家歌劇院', coords: { lat: 24.1645, lng: 120.6415 } },
    ],
    assets: [],
  },
  {
    name: '高雄市',
    coords: { lat: 22.6273, lng: 120.3014 }, // Kaohsiung City Hall
    population: 2770000,
    landmarks: [
      { name: '85大樓', coords: { lat: 22.6111, lng: 120.3006 } },
      { name: '高雄港', coords: { lat: 22.6139, lng: 120.2798 } },
    ],
    assets: [],
  },
];

CITIES.forEach(city => {
  const landmarkAssets: Asset[] = city.landmarks.map(lm => ({
    ...lm,
    id: crypto.randomUUID(),
  }));
  const generatedAssets = generateCityAssets(city.coords);
  city.assets = [...landmarkAssets, ...generatedAssets];
});

export const YIELDS: Yield[] = [
  {
    kt: 5,
    name: '5千噸 (戰術核武)',
    fireballRadius: 125, // meters
    shockwaveRadius: 1000, // meters (for 5 psi overpressure)
    thermalRadius: 1200, // meters (for 3rd degree burns)
    falloutDimensions: { width: 60, height: 200 },
    casualties: { fatalities: 17500, injuries: 17500 },
  },
  {
    kt: 10,
    name: '10千噸 (小型核武)',
    fireballRadius: 160, // meters
    shockwaveRadius: 1300, // meters (for 5 psi overpressure)
    thermalRadius: 1500, // meters (for 3rd degree burns)
    falloutDimensions: { width: 80, height: 250 },
    casualties: { fatalities: 35000, injuries: 35000 },
  },
  {
    kt: 20,
    name: '20千噸 (廣島)',
    fireballRadius: 200, // meters
    shockwaveRadius: 1600, // meters (for 5 psi overpressure)
    thermalRadius: 1900, // meters (for 3rd degree burns)
    falloutDimensions: { width: 100, height: 300 },
    casualties: { fatalities: 70000, injuries: 70000 },
  },
  {
    kt: 300,
    name: '300千噸 (W87)',
    fireballRadius: 600,
    shockwaveRadius: 4700,
    thermalRadius: 6700,
    falloutDimensions: { width: 150, height: 450 },
    casualties: { fatalities: 800000, injuries: 500000 },
  },
  {
    kt: 1000,
    name: '1000千噸 (1MT)',
    fireballRadius: 900,
    shockwaveRadius: 7600,
    thermalRadius: 11000,
    falloutDimensions: { width: 200, height: 600 },
    casualties: { fatalities: 1500000, injuries: 900000 },
  },
];

export const MAP_DIMENSIONS = {
    width: 1000,
    height: 1500
};