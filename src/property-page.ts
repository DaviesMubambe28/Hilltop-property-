import type { Property } from './types';

export function galleryIndex(current: number, change: number, total: number): number {
  if (total < 1) return 0;
  return (current + change + total) % total;
}

export function galleryPositionLabel(index: number, total: number): string {
  return `Image ${index + 1} of ${total}`;
}

export function propertySlugFromLocation(pathname: string, search: string): string | null {
  const pathMatch = pathname.match(/^\/property\/([a-z0-9-]+)\/?$/);
  const candidate = pathMatch?.[1] ?? new URLSearchParams(search).get('slug');
  return candidate && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate) ? candidate : null;
}

export function propertyStructuredData(property: Property, url: string, imageUrls: string[]) {
  return {
    '@context': 'https://schema.org', '@type': 'RealEstateListing', name: property.title,
    description: property.description || property.summary, identifier: property.reference, url,
    ...(imageUrls.length ? { image: imageUrls } : {}),
    ...(property.price !== null ? { offers: { '@type': 'Offer', price: property.price, priceCurrency: property.currency, availability: 'https://schema.org/InStock' } } : {}),
    address: { '@type': 'PostalAddress', addressLocality: property.location?.name, addressCountry: 'ZM', ...(property.address ? { streetAddress: property.address } : {}) },
    numberOfBedrooms: property.bedrooms ?? undefined, numberOfBathroomsTotal: property.bathrooms ?? undefined,
    ...(property.latitude !== null && property.longitude !== null ? { geo: { '@type': 'GeoCoordinates', latitude: Number(property.latitude.toFixed(3)), longitude: Number(property.longitude.toFixed(3)) } } : {}),
  };
}
