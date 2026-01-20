export type CollegeZone =
  | "North"
  | "West"
  | "South"
  | "East"
  | "Central"
  | "Chhattisgarh";

export interface CollegeOption {
  name: string;
  organizationId: string;
  lat: number;
  lng: number;
  zone: CollegeZone;
  radiusKm?: number;
}

export const DEFAULT_COLLEGE_ID = "ggv-bilaspur";

export const COLLEGE_OPTIONS: CollegeOption[] = [
  // North Zone
  {
    name: "IIT Delhi",
    organizationId: "iit-delhi",
    lat: 28.545,
    lng: 77.1926,
    zone: "North",
  },
  {
    name: "Jawaharlal Nehru University (JNU), Delhi",
    organizationId: "jnu-delhi",
    lat: 28.5398,
    lng: 77.1662,
    zone: "North",
  },
  {
    name: "Jamia Millia Islamia, Delhi",
    organizationId: "jamia-millia-islamia",
    lat: 28.5616,
    lng: 77.2802,
    zone: "North",
  },
  {
    name: "IIT Kanpur",
    organizationId: "iit-kanpur",
    lat: 26.5123,
    lng: 80.2329,
    zone: "North",
  },
  {
    name: "Aligarh Muslim University (AMU)",
    organizationId: "amu-aligarh",
    lat: 27.9135,
    lng: 78.0782,
    zone: "North",
  },
  {
    name: "IIT Roorkee",
    organizationId: "iit-roorkee",
    lat: 29.8649,
    lng: 77.8966,
    zone: "North",
  },
  {
    name: "Panjab University, Chandigarh",
    organizationId: "panjab-university",
    lat: 30.7579,
    lng: 76.7685,
    zone: "North",
  },
  {
    name: "Thapar Institute, Patiala",
    organizationId: "thapar-institute-patiala",
    lat: 30.3564,
    lng: 76.3647,
    zone: "North",
  },

  // West Zone
  {
    name: "BITS Pilani, Rajasthan",
    organizationId: "bits-pilani",
    lat: 28.3639,
    lng: 75.587,
    zone: "West",
  },
  {
    name: "Savitribai Phule Pune University",
    organizationId: "sppu-pune",
    lat: 18.5524,
    lng: 73.8265,
    zone: "West",
  },
  {
    name: "VNIT Nagpur",
    organizationId: "vnit-nagpur",
    lat: 21.1232,
    lng: 79.0515,
    zone: "West",
  },
  {
    name: "Gujarat University, Ahmedabad",
    organizationId: "gujarat-university",
    lat: 23.0364,
    lng: 72.5447,
    zone: "West",
  },
  {
    name: "IIT Gandhinagar",
    organizationId: "iit-gandhinagar",
    lat: 23.2114,
    lng: 72.6842,
    zone: "West",
  },

  // South Zone
  {
    name: "IIT Madras",
    organizationId: "iit-madras",
    lat: 12.9915,
    lng: 80.2337,
    zone: "South",
  },
  {
    name: "Anna University, Chennai",
    organizationId: "anna-university",
    lat: 13.0102,
    lng: 80.2357,
    zone: "South",
  },
  {
    name: "VIT Vellore",
    organizationId: "vit-vellore",
    lat: 12.9716,
    lng: 79.1594,
    zone: "South",
  },
  {
    name: "NIT Warangal",
    organizationId: "nit-warangal",
    lat: 17.9835,
    lng: 79.5308,
    zone: "South",
  },
  {
    name: "IIT Hyderabad",
    organizationId: "iit-hyderabad",
    lat: 17.5947,
    lng: 78.123,
    zone: "South",
  },
  {
    name: "University of Hyderabad",
    organizationId: "university-of-hyderabad",
    lat: 17.4601,
    lng: 78.3243,
    zone: "South",
  },
  {
    name: "NIT Surathkal (Karnataka)",
    organizationId: "nit-surathkal",
    lat: 13.0108,
    lng: 74.7943,
    zone: "South",
  },
  {
    name: "Manipal Academy of Higher Education",
    organizationId: "mahe-manipal",
    lat: 13.3525,
    lng: 74.7928,
    zone: "South",
  },
  {
    name: "Amrita Vishwa Vidyapeetham, Coimbatore",
    organizationId: "amrita-coimbatore",
    lat: 10.9027,
    lng: 76.9006,
    zone: "South",
  },

  // East & Central Zones
  {
    name: "IIT Kharagpur",
    organizationId: "iit-kharagpur",
    lat: 22.3149,
    lng: 87.3105,
    zone: "East",
  },
  {
    name: "Jadavpur University, Kolkata",
    organizationId: "jadavpur-university",
    lat: 22.4989,
    lng: 88.3715,
    zone: "East",
  },
  {
    name: "NIT Rourkela",
    organizationId: "nit-rourkela",
    lat: 22.2531,
    lng: 84.901,
    zone: "East",
  },
  {
    name: "IIT Bhubaneswar",
    organizationId: "iit-bhubaneswar",
    lat: 20.1484,
    lng: 85.671,
    zone: "East",
  },

  // Chhattisgarh (current + nearby campuses)
  {
    name: "NIT Raipur",
    organizationId: "nit-raipur",
    lat: 21.2497,
    lng: 81.605,
    zone: "Chhattisgarh",
  },
  {
    name: "AIIMS Raipur",
    organizationId: "aiims-raipur",
    lat: 21.2572,
    lng: 81.5766,
    zone: "Chhattisgarh",
  },
  {
    name: "IIM Raipur",
    organizationId: "iim-raipur",
    lat: 21.1262,
    lng: 81.7787,
    zone: "Chhattisgarh",
  },
  {
    name: "Pt. Ravishankar Shukla University, Raipur",
    organizationId: "prsu-raipur",
    lat: 21.2455,
    lng: 81.5877,
    zone: "Chhattisgarh",
  },
  {
    name: "Hidayatullah National Law University (HNLU), Raipur",
    organizationId: "hnlu-raipur",
    lat: 21.107,
    lng: 81.759,
    zone: "Chhattisgarh",
  },
  {
    name: "IIT Bhilai",
    organizationId: "iit-bhilai",
    lat: 21.1925,
    lng: 81.3062,
    zone: "Chhattisgarh",
  },
  {
    name: "CSVTU Bhilai",
    organizationId: "csvtu-bhilai",
    lat: 21.2285,
    lng: 81.3468,
    zone: "Chhattisgarh",
  },
  {
    name: "Bhilai Institute of Technology (BIT), Durg",
    organizationId: "bit-durg",
    lat: 21.1876,
    lng: 81.2849,
    zone: "Chhattisgarh",
  },
  {
    name: "Guru Ghasidas Vishwavidyalaya (GGV)",
    organizationId: "ggv-bilaspur",
    lat: 22.1293,
    lng: 82.136,
    zone: "Chhattisgarh",
    radiusKm: 2,
  },
  {
    name: "Govt. Engineering College (GEC), Bilaspur",
    organizationId: "gec-bilaspur",
    lat: 22.0796,
    lng: 82.1391,
    zone: "Chhattisgarh",
  },
  {
    name: "Govt. Engineering College (GEC), Jagdalpur",
    organizationId: "gec-jagdalpur",
    lat: 19.0735,
    lng: 82.0305,
    zone: "Chhattisgarh",
  },
  {
    name: "Sarguja University, Ambikapur",
    organizationId: "sarguja-university",
    lat: 23.1365,
    lng: 83.192,
    zone: "Chhattisgarh",
  },
];

const KM_PER_DEGREE_LAT = 110.574;

function kmToLongitudeDegrees(lat: number, km: number): number {
  const kmPerDegreeLng = 111.32 * Math.cos((lat * Math.PI) / 180);
  return km / kmPerDegreeLng;
}

export function getCollegeByOrganizationId(
  id?: string | null,
): CollegeOption | undefined {
  if (!id) return undefined;
  return COLLEGE_OPTIONS.find((college) => college.organizationId === id);
}

export function createBoundsFromCollege(
  college: CollegeOption,
  fallbackRadiusKm = 1.5,
): [[number, number], [number, number]] {
  const radiusKm = college.radiusKm ?? fallbackRadiusKm;
  const deltaLat = radiusKm / KM_PER_DEGREE_LAT;
  const deltaLng = kmToLongitudeDegrees(college.lat, radiusKm);

  return [
    [college.lat - deltaLat, college.lng - deltaLng],
    [college.lat + deltaLat, college.lng + deltaLng],
  ];
}
