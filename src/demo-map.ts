import type { Property } from './types';
import { safeText } from './validation';

export function renderDemoMap(properties: Property[], container: HTMLElement) {
  container.innerHTML=`<div class="demo-map" role="group" aria-label="Approximate demonstration property locations"><p><b>Development map preview</b><br><small>Synthetic coordinates; not verified listing locations.</small></p>${properties.map((property,index)=>`<button type="button" data-map-property="${property.id}" style="--marker-x:${18+(index*23)%68}%;--marker-y:${22+(index*31)%61}%"><span>${index+1}</span><b>${safeText(property.location?.name??'Zambia')}</b><span class="sr-only">: ${safeText(property.title)}. Show in results.</span></button>`).join('')}</div>`;
  container.querySelectorAll<HTMLElement>('[data-map-property]').forEach((button)=>button.addEventListener('click',()=>document.querySelector(`[data-property-id="${button.dataset.mapProperty}"]`)?.scrollIntoView({behavior:'smooth',block:'center'})));
}
