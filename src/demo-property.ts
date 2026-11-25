import type { Property } from './types';

/** Development-only visual fixture. It is never selected in a production build. */
export const demoProperty: Property = {
  id: '30000000-0000-4000-8000-000000000001',
  reference: 'DEMO-SALE-001',
  slug: 'demo-kabulonga-family-house',
  title: '[DEMO] Kabulonga family house',
  summary: 'Synthetic four-bedroom house used for local interface testing.',
  description: 'Demonstration listing only. A spacious family layout with a landscaped garden, secure parking and flexible indoor-outdoor living areas.',
  listing_type: 'sale', price: 4_850_000, price_period: 'once', currency: 'ZMW',
  bedrooms: 4, bathrooms: 3, land_size: 1200, land_unit: 'm²', floor_size: 310,
  furnished_status: 'part-furnished', condition: 'excellent', verification_status: 'verified', is_available: true,
  latitude: -15.4145, longitude: 28.3452, address: 'Demonstration address, Kabulonga', is_featured: true,
  location: { name: 'Kabulonga, Lusaka', slug: 'kabulonga' }, property_type: { name: 'House', slug: 'house' },
  agent: { name: 'Demo Advisor — Lusaka', phone: '+260 000 000 001', email: 'demo-lusaka@example.invalid' },
  images: [
    { storage_path: '/assets/hero-villa.webp', alt_text: 'Demonstration luxury house exterior at dusk', is_primary: true, position: 0 },
    { storage_path: '/assets/hero-villa-mobile.webp', alt_text: 'Demonstration house and pool detail', is_primary: false, position: 1 },
  ],
  amenities: ['Garden', 'Security', 'Backup power', 'Parking'].map((name) => ({ amenity: { name, slug: name.toLowerCase().replaceAll(' ', '-') } })),
};
