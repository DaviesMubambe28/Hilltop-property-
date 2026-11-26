import type { Property } from './types';
import { safeText } from './validation';
import { imageUrl } from './services/properties';

export interface PropertyFact { label: string; value: string }

export function propertyPrice(property: Property): string {
  if (property.price === null) return 'Price on enquiry';
  const price = new Intl.NumberFormat('en-ZM', { style: 'currency', currency: property.currency, maximumFractionDigits: 0 }).format(property.price);
  return property.price_period && property.price_period !== 'once' ? `${price} / ${property.price_period}` : price;
}

export function propertyFacts(property: Property): PropertyFact[] {
  const number = (value: number | null, unit = '') => value === null ? 'Not provided' : `${value}${unit}`;
  const land = { label: 'Land area', value: number(property.land_size, ` ${property.land_unit || 'm²'}`) };
  const floor = { label: 'Floor area', value: number(property.floor_size, ' m²') };
  const category = property.property_type?.slug;
  if (['plot', 'farm', 'estate', 'land'].includes(category || '')) return [land, { label: 'Type', value: property.property_type?.name || 'Property' }];
  if (['office', 'retail', 'commercial', 'warehouse'].includes(category || '')) return [floor, { label: 'Washrooms', value: number(property.bathrooms) }, land];
  return [{ label: 'Bedrooms', value: number(property.bedrooms) }, { label: 'Bathrooms', value: number(property.bathrooms) }, floor, land];
}

export function renderPropertyCard(property: Property, preview = false): string {
  const image = [...property.images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position)[0];
  const href = `/property/${safeText(property.slug)}${preview ? '?preview=demo' : ''}`;
  const label = property.listing_type === 'sale' ? 'For sale' : property.listing_type === 'rent' ? 'To rent' : 'Investment';
  return `<article class="property-card" data-property-id="${safeText(property.id)}">
    <div class="property-image${image ? '' : ' no-image'}">${image ? `<a href="${href}" tabindex="-1" aria-hidden="true"><img src="${safeText(imageUrl(image.storage_path))}" alt="" width="720" height="480" loading="lazy" /></a>` : '<p class="missing-photo">Property photographs<br/><small>Not yet available</small></p>'}<span>${label}${property.verification_status === 'verified' ? ' · Verified' : ''}</span><button type="button" data-save="${safeText(property.id)}" aria-pressed="false" aria-label="Save ${safeText(property.title)}">♡</button>${preview && image ? '<small class="card-image-note">Demonstration image</small>' : ''}</div>
    <div class="property-body"><p class="price">${safeText(propertyPrice(property))}</p><h3><a href="${href}">${safeText(property.title)}</a></h3><p class="property-location">${safeText(property.location?.name || 'Location on enquiry')}</p><dl class="ledger">${propertyFacts(property).slice(0, 2).map(fact => `<div><dt>${safeText(fact.label)}</dt><dd>${safeText(fact.value)}</dd></div>`).join('')}</dl><div class="card-actions"><a class="property-link" href="${href}">View property →</a><button type="button" class="link-button" data-compare="${safeText(property.slug)}" aria-pressed="false">Compare</button></div></div></article>`;
}
