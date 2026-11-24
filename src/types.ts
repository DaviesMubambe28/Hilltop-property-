export type ListingType = 'sale' | 'rent' | 'investment';

export interface Property {
  id: string;
  reference: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  listing_type: ListingType;
  price: number | null;
  price_period: string | null;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  land_size: number | null;
  land_unit: string | null;
  address: string | null;
  is_featured: boolean;
  location: { name: string; slug: string } | null;
  property_type: { name: string; slug: string } | null;
  agent: { name: string; phone: string | null; email: string | null } | null;
  images: Array<{ storage_path: string; alt_text: string; is_primary: boolean; position: number }>;
}

export interface SearchFilters {
  query?: string;
  locationId?: string;
  propertyTypeId?: string;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  sort?: 'newest' | 'priceAsc' | 'priceDesc';
  page: number;
  pageSize: number;
}

export interface EnquiryInput {
  type: 'property' | 'general' | 'viewing' | 'valuation';
  propertyId?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferredDate?: string;
  consent: boolean;
  idempotencyKey: string;
  website?: string;
}
