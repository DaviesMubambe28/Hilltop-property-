/** Failed listing images must not fall back to unrelated property photography. */
export function installPropertyImageFallbacks() {
  document.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    if (image.id === 'gallery-lightbox-image') {
      image.hidden = true;
      const caption = document.querySelector('#gallery-lightbox-caption');
      if (caption) caption.textContent = 'This photograph is unavailable. Close the gallery or try another image.';
      return;
    }
    const region = image.closest<HTMLElement>('.property-image, .property-gallery button');
    if (!region) return;
    region.querySelector('img')?.remove();
    region.querySelector('a')?.remove();
    region.classList.add('no-image');
    if (region instanceof HTMLButtonElement) { region.disabled = true; region.querySelector('span:not(.sr-only)')?.remove(); }
    const message = document.createElement('p');
    message.className = 'missing-photo';
    message.textContent = 'Photograph unavailable';
    region.append(message);
  }, true);
}
