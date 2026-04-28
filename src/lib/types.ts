export type UserRole = 'SUPER_ADMIN' | 'MEDICAL_ADMIN' | 'OPS' | 'PATIENT';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  profile: {
    age: number;
    gender: string;
    height: number; // cm
    weight: number; // kg
    lifestyle: {
      smoker: boolean;
      alcohol: boolean;
      exercise: string; // 'none' | 'light' | 'moderate' | 'heavy'
    };
  };
}

export interface Test {
  id: string;
  name: string;
  price: number;
  description: string;
  includedTests: string[];
  icon: string;
  popular?: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  testId: string;
  testName: string;
  date: Date;
  collectionMethod: 'lab' | 'home';
  labId?: string;
  labName?: string;
  homeAddress?: string;
  status: 'pending' | 'confirmed' | 'completed';
  paymentStatus: 'unpaid' | 'paid';
  transactionCode?: string;
  price: number;
  location?: { lat: number; lng: number; address: string };
  createdAt: Date;
}

export interface Lab {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  coordinates: { lat: number; lng: number };
  active: boolean;
}

export const STATIC_LABS: Lab[] = [
  {
    id: 'lab-1',
    name: 'MediPath Diagnostic Center',
    address: '5th Floor, ACK Garden House, 1st Ngong Ave',
    neighborhood: 'Community, Nairobi',
    coordinates: { lat: -1.2988, lng: 36.8121 },
    active: true,
  },
  {
    id: 'lab-2',
    name: 'PathCare Kenya - Main Lab',
    address: 'Regal Plaza, Limuru Road',
    neighborhood: 'Parklands, Nairobi',
    coordinates: { lat: -1.2612, lng: 36.8219 },
    active: true,
  },
  {
    id: 'lab-3',
    name: 'Lancet Kenya - Upper Hill',
    address: '5th Ngong Ave, Upper Hill',
    neighborhood: 'Upper Hill, Nairobi',
    coordinates: { lat: -1.2965, lng: 36.8085 },
    active: true,
  },
];

export interface Result {
  id: string;
  userId: string;
  bookingId: string;
  rawResults: Record<string, { value: string; unit: string; range: string; status: 'normal' | 'attention' | 'critical' }>;
  doctorNotes: string;
  flag: 'NORMAL' | 'ATTENTION' | 'URGENT';
  followUpAction?: string;
  status: 'pending' | 'reviewed';
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityId: string;
  entityType: 'booking' | 'result' | 'user' | 'payment';
  previousValue?: any;
  newValue?: any;
  timestamp: Date;
}

export const STATIC_TESTS: Test[] = [
  {
    id: 'basic-health',
    name: 'Basic Health Panel',
    price: 2500,
    description: 'Your essential health checkup. Covers blood sugar, kidney function, and complete blood count.',
    includedTests: ['Blood Sugar (Glucose)', 'Kidney Function (Creatinine)', 'Complete Blood Count (CBC)', 'Urine Analysis'],
    icon: '🩺',
    popular: false,
  },
  {
    id: 'heart-cholesterol',
    name: 'Heart & Cholesterol',
    price: 3500,
    description: 'Know your heart risk. Covers all cholesterol types and markers for cardiovascular health.',
    includedTests: ['Total Cholesterol', 'LDL (Bad Cholesterol)', 'HDL (Good Cholesterol)', 'Triglycerides', 'Blood Pressure Markers'],
    icon: '❤️',
    popular: true,
  },
  {
    id: 'full-body',
    name: 'Full Body Check',
    price: 6000,
    description: 'The complete picture of your health. Covers organs, hormones, blood, and more.',
    includedTests: ['All Basic Panel Tests', 'All Heart Panel Tests', 'Liver Function (ALT/AST)', 'Thyroid (TSH)', 'Vitamin D & B12', 'HbA1c (Diabetes Risk)'],
    icon: '🔬',
    popular: false,
  },
];
