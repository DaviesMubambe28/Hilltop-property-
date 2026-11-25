import type { Map as LeafletMap } from 'leaflet';
import type { Property } from './types';
import { safeText } from './validation';

let activeMap: LeafletMap | null = null;

export function publicMapCoordinates(property: Pick<Property, 'latitude' | 'longitude'>): [number, number] | null {
  if (property.latitude === null || property.longitude === null) return null;
  return [Number(property.latitude.toFixed(3)), Number(property.longitude.toFixed(3))];
}

export async function renderPropertyMap(properties: Property[], container: HTMLElement): Promise<void> {
  activeMap?.remove(); activeMap = null;
  const mapped = properties.map((property) => ({ property, coordinates: publicMapCoordinates(property) })).filter((item): item is { property: Property; coordinates: [number, number] } => item.coordinates !== null);
  container.hidden = false;
  if (!mapped.length) { container.innerHTML = '<div class="catalogue-state"><h3>Map locations unavailable</h3><p>These listings do not have approved public coordinates.</p></div>'; return; }
  const preview=import.meta.env.DEV&&new URLSearchParams(location.search).get('preview')==='demo';
  if(preview){(await import('./demo-map')).renderDemoMap(mapped.map(({property})=>property),container);return;}
  container.innerHTML = '<div id="results-map" aria-label="Map of matching properties"></div><p class="map-note">Markers show approximate locations for privacy. Listings without approved coordinates are omitted.</p>';
  const L = await import('leaflet'); await import('leaflet/dist/leaflet.css');
  const map = L.map('results-map', { scrollWheelZoom: false }); activeMap = map;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 18 }).addTo(map);
  const bounds = L.latLngBounds([]);
  mapped.forEach(({ property, coordinates }) => { bounds.extend(coordinates); const marker=L.marker(coordinates).addTo(map); marker.bindPopup(`<b>${safeText(property.title)}</b><br>${safeText(property.location?.name ?? 'Zambia')}<br><a href="/property/${safeText(property.slug)}">View property</a>`); marker.on('click',()=>document.querySelector(`[data-property-id="${property.id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'})); });
  if (mapped.length === 1) map.setView(mapped[0].coordinates, 13); else map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
}
