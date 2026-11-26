/** Keep irrelevant room criteria out of a land/commercial search. */
export function updateCategoryFilters(clearHidden = false) {
  const form = document.querySelector<HTMLFormElement>('#property-search');
  const type = document.querySelector<HTMLSelectElement>('#search-type');
  if (!form || !type) return;
  const category = type.selectedOptions[0]?.dataset.category || '';
  const land = ['plot', 'farm', 'estate', 'land'].includes(category);
  const commercial = ['office', 'retail', 'warehouse', 'commercial'].includes(category);
  const visibility: Record<string, boolean> = {
    bedrooms: !land && !commercial,
    bathrooms: !land,
    furnished: !land && !commercial,
    minFloorSize: !['plot', 'land'].includes(category),
    minLandSize: category !== 'apartment',
  };
  Object.entries(visibility).forEach(([name, visible]) => {
    const field = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;
    const label = field?.closest('label');
    if (label) label.hidden = !visible;
    if (field && clearHidden && !visible) field.value = '';
  });
  const bathroom = form.elements.namedItem('bathrooms') as HTMLInputElement | null;
  const caption = bathroom?.closest('label')?.firstChild;
  if (caption?.nodeType === Node.TEXT_NODE) caption.textContent = commercial ? 'Minimum washrooms' : 'Minimum bathrooms';
}
