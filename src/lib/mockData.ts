export const SERVICE_TYPES = [
  "Carpenter", "Electrician", "Tailor", "Plumber", "Painter",
  "Mechanic", "House Maid", "Mehendi Artist", "Cobbler",
  "Washerman", "Iron Man", "AC Repair",
] as const;

export type ServiceType = typeof SERVICE_TYPES[number];

export interface ServiceProvider {
  id: string;
  name: string;
  age: number;
  experience: number;
  contact: string;
  serviceType: ServiceType;
  city: string;
  area: string;
  bio: string;
  photo: string;
  available: boolean;
  verified: boolean;
  rating: number;
  reviewCount: number;
  reviews: Review[];
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export const SERVICE_ICONS: Record<string, string> = {
  Carpenter: "🪚",
  Electrician: "⚡",
  Tailor: "🧵",
  Plumber: "🔧",
  Painter: "🎨",
  Mechanic: "🔩",
  "House Maid": "🏠",
  "Mehendi Artist": "✋",
  Cobbler: "👞",
  Washerman: "👔",
  "Iron Man": "♨️",
  "AC Repair": "❄️",
};

export const MOCK_PROVIDERS: ServiceProvider[] = [
  {
    id: "1", name: "Rajesh Kumar", age: 35, experience: 12,
    contact: "9876543210", serviceType: "Carpenter",
    city: "Mumbai", area: "Andheri West",
    bio: "Expert in custom furniture, modular kitchens, and wood repair. Quality work guaranteed.",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    available: true, verified: true, rating: 4.8, reviewCount: 47,
    reviews: [
      { id: "r1", customerName: "Amit S.", rating: 5, comment: "Excellent carpentry work! Very professional.", date: "2025-12-15" },
      { id: "r2", customerName: "Priya M.", rating: 4, comment: "Good work, slightly delayed but quality was great.", date: "2025-11-20" },
    ],
  },
  {
    id: "2", name: "Suresh Patel", age: 42, experience: 18,
    contact: "9876543211", serviceType: "Electrician",
    city: "Mumbai", area: "Bandra",
    bio: "Certified electrician. Wiring, repairs, installations & smart home solutions.",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    available: true, verified: true, rating: 4.6, reviewCount: 63,
    reviews: [
      { id: "r3", customerName: "Neha R.", rating: 5, comment: "Fixed the wiring issue quickly. Very knowledgeable.", date: "2026-01-10" },
    ],
  },
  {
    id: "3", name: "Meena Devi", age: 38, experience: 15,
    contact: "9876543212", serviceType: "Mehendi Artist",
    city: "Delhi", area: "Lajpat Nagar",
    bio: "Bridal & occasion mehendi specialist. Arabic, Indian & contemporary designs.",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    available: true, verified: true, rating: 4.9, reviewCount: 89,
    reviews: [
      { id: "r4", customerName: "Sunita K.", rating: 5, comment: "Beautiful bridal mehendi! Everyone loved it.", date: "2026-01-05" },
    ],
  },
  {
    id: "4", name: "Vikram Singh", age: 30, experience: 8,
    contact: "9876543213", serviceType: "Plumber",
    city: "Mumbai", area: "Dadar",
    bio: "All plumbing solutions - leaks, installations, bathroom fitting & pipeline work.",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    available: false, verified: true, rating: 4.3, reviewCount: 31,
    reviews: [],
  },
  {
    id: "5", name: "Lakshmi Bai", age: 45, experience: 20,
    contact: "9876543214", serviceType: "House Maid",
    city: "Bangalore", area: "Koramangala",
    bio: "Experienced in deep cleaning, cooking, and daily household management.",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    available: true, verified: true, rating: 4.7, reviewCount: 55,
    reviews: [
      { id: "r5", customerName: "Rahul D.", rating: 5, comment: "Very dedicated and honest. Highly recommended!", date: "2026-02-01" },
    ],
  },
  {
    id: "6", name: "Arjun Mishra", age: 28, experience: 6,
    contact: "9876543215", serviceType: "Painter",
    city: "Delhi", area: "Saket",
    bio: "Interior & exterior painting. Texture, stencil and wall art specialist.",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
    available: true, verified: false, rating: 4.4, reviewCount: 22,
    reviews: [],
  },
  {
    id: "7", name: "Gopal Sharma", age: 50, experience: 25,
    contact: "9876543216", serviceType: "Mechanic",
    city: "Bangalore", area: "Indiranagar",
    bio: "Two-wheeler and four-wheeler specialist. Doorstep service available.",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face",
    available: true, verified: true, rating: 4.5, reviewCount: 38,
    reviews: [],
  },
  {
    id: "8", name: "Fatima Sheikh", age: 33, experience: 10,
    contact: "9876543217", serviceType: "Tailor",
    city: "Mumbai", area: "Kurla",
    bio: "Ladies & gents tailoring. Blouse, suits, alterations & designer work.",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    available: true, verified: true, rating: 4.6, reviewCount: 41,
    reviews: [],
  },
];
