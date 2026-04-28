export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
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
  status: 'pending' | 'confirmed' | 'completed';
  paymentStatus: 'unpaid' | 'paid';
  transactionCode?: string;
  price: number;
  createdAt: Date;
}

export interface Result {
  id: string;
  userId: string;
  bookingId: string;
  rawResults: Record<string, { value: string; unit: string; range: string; status: 'normal' | 'attention' | 'critical' }>;
  doctorNotes: string;
  status: 'pending' | 'reviewed';
  createdAt: Date;
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
