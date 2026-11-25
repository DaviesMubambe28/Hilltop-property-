/** Failed listing images must not fall back to unrelated property photography. */
export function installPropertyImageFallbacks() {
  document.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    const region = image.closest<HTMLElement>('.property-image, .property-gallery button');
    if (!region) return;
    region.querySelector('img')?.remove();
    region.querySelector('a')?.remove();
    region.classList.add('no-image');
    const message = document.createElement('p');
    message.className = 'missing-photo';
    message.textContent = 'Photograph unavailable';
    region.append(message);
  }, true);
}
