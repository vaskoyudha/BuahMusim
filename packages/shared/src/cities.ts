export interface CityData {
  id: string;
  name: string;
  province: string;
  market: string;
  lat: number;
  lng: number;
  population: number;
  priceMultiplier: number;
  fruitSpecialties: string[];
}

export const CITIES: CityData[] = [
  {
    id: 'jakarta',
    name: 'Jakarta',
    province: 'DKI Jakarta',
    market: 'Pasar Induk Kramat Jati',
    lat: -6.2827,
    lng: 106.8636,
    population: 10.6,
    priceMultiplier: 1.0,
    fruitSpecialties: ['mangga', 'pepaya', 'pisang'],
  },
  {
    id: 'surabaya',
    name: 'Surabaya',
    province: 'Jawa Timur',
    market: 'Pasar Pabean',
    lat: -7.2333,
    lng: 112.7508,
    population: 2.9,
    priceMultiplier: 1.0,
    fruitSpecialties: ['mangga', 'semangka', 'melon'],
  },
  {
    id: 'bandung',
    name: 'Bandung',
    province: 'Jawa Barat',
    market: 'Pasar Induk Caringin',
    lat: -6.9345,
    lng: 107.5803,
    population: 2.5,
    priceMultiplier: 1.05,
    fruitSpecialties: ['alpukat', 'jeruk', 'salak'],
  },
  {
    id: 'medan',
    name: 'Medan',
    province: 'Sumatera Utara',
    market: 'Pasar Induk Tavip',
    lat: 3.5896,
    lng: 98.6739,
    population: 2.5,
    priceMultiplier: 0.95,
    fruitSpecialties: ['durian', 'rambutan', 'langsat'],
  },
  {
    id: 'semarang',
    name: 'Semarang',
    province: 'Jawa Tengah',
    market: 'Pasar Johar',
    lat: -6.9667,
    lng: 110.4196,
    population: 1.8,
    priceMultiplier: 1.02,
    fruitSpecialties: ['pisang', 'nanas', 'kedondong'],
  },
  {
    id: 'makassar',
    name: 'Makassar',
    province: 'Sulawesi Selatan',
    market: 'Pasar Induk Daya',
    lat: -5.1127,
    lng: 119.4872,
    population: 1.5,
    priceMultiplier: 1.08,
    fruitSpecialties: ['durian', 'leci', 'cempedak'],
  },
  {
    id: 'palembang',
    name: 'Palembang',
    province: 'Sumatera Selatan',
    market: 'Pasar Induk Jakabaring',
    lat: -3.0224,
    lng: 104.7644,
    population: 1.7,
    priceMultiplier: 0.97,
    fruitSpecialties: ['duku', 'rambutan', 'nanas'],
  },
  {
    id: 'denpasar',
    name: 'Denpasar',
    province: 'Bali',
    market: 'Pasar Badung',
    lat: -8.6561,
    lng: 115.2126,
    population: 0.9,
    priceMultiplier: 1.10,
    fruitSpecialties: ['mangga', 'salak', 'buah_naga'],
  },
  {
    id: 'yogyakarta',
    name: 'Yogyakarta',
    province: 'DI Yogyakarta',
    market: 'Pasar Induk Giwangan',
    lat: -7.8120,
    lng: 110.3813,
    population: 0.4,
    priceMultiplier: 1.03,
    fruitSpecialties: ['salak', 'mangga', 'belimbing'],
  },
  {
    id: 'malang',
    name: 'Malang',
    province: 'Jawa Timur',
    market: 'Pasar Induk Gadang',
    lat: -7.9934,
    lng: 112.6378,
    population: 0.9,
    priceMultiplier: 1.01,
    fruitSpecialties: ['alpukat', 'jeruk', 'apel'],
  },
];

export const getCityById = (id: string): CityData | undefined =>
  CITIES.find((c) => c.id === id);

export const getCitiesByProvince = (province: string): CityData[] =>
  CITIES.filter((c) => c.province === province);
