import { currentProfile } from './services/auth';
import { requireSupabase } from './supabase';
import { safeText } from './validation';
import { normalizeImageOrder, validatePropertyDraft } from './property-workflow';

const client = requireSupabase();
const expectedRole = document.body.dataset.workspace as 'agent' | 'editor';
const feedback = document.querySelector<HTMLElement>('#workspace-feedback');
let userId = '';
let agentId = '';
let saving = false;

interface ManagedImage {
  id: string;
  file?: File;
  storagePath?: string;
  url: string;
  isPrimary: boolean;
}

let managedImages: ManagedImage[] = [];

function message(value: string) {
  if (feedback) feedback.textContent = value;
}

function table(headers: string[], rows: string[]) {
  if (!rows.length) return '<p class="workspace-empty">Nothing to show yet.</p>';
  return `<div class="workspace-table-wrap"><table class="workspace-table"><thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

function status(value: string) {
  return `<span class="workspace-status" data-status="${safeText(value)}">${safeText(value.replaceAll('_', ' '))}</span>`;
}

async function requireWorkspaceAccess() {
  const session = await currentProfile();
  if (!session || session.profile.role !== expectedRole || !session.profile.is_active) {
    location.href = `/sign-in.html?returnTo=/${expectedRole}.html`;
    throw new Error(`${expectedRole} access required`);
  }
  userId = session.user.id;
  const name = document.querySelector('#workspace-user');
  if (name) name.textContent = session.profile.full_name;
  if (expectedRole === 'agent') {
    const agent = await client.from('agents').select('id').eq('profile_id', userId).single();
    if (agent.error) throw new Error('Your agent profile is not connected. Ask an administrator to complete access setup.');
    agentId = agent.data.id;
  }
}

function showPanel(name: string) {
  document.querySelectorAll<HTMLElement>('[data-workspace-panel]').forEach(panel => {
    panel.hidden = panel.dataset.workspacePanel !== name;
  });
  document.querySelectorAll<HTMLElement>('[data-workspace-view]').forEach(button => {
    button.classList.toggle('active', button.dataset.workspaceView === name);
  });
  document.querySelector<HTMLElement>(`[data-workspace-panel="${name}"] h1`)?.focus({ preventScroll: true });
}

function renderStats(items: Array<[string, number | null]>) {
  const target = document.querySelector('#workspace-stats');
  if (target) target.innerHTML = items.map(([label, value]) => `<article class="workspace-stat"><b>${value ?? 0}</b><span>${label}</span></article>`).join('');
}

async function loadOverview() {
  if (expectedRole === 'agent') {
    const [drafts, submitted, approved, enquiries] = await Promise.all([
      client.from('properties').select('id', { count: 'exact', head: true }).eq('created_by', userId).eq('review_status', 'draft'),
      client.from('properties').select('id', { count: 'exact', head: true }).eq('created_by', userId).in('review_status', ['submitted', 'under_review']),
      client.from('properties').select('id', { count: 'exact', head: true }).eq('created_by', userId).in('review_status', ['approved', 'published']),
      client.from('enquiries').select('id', { count: 'exact', head: true }).eq('assigned_to', userId).neq('status', 'closed'),
    ]);
    renderStats([['Drafts', drafts.count], ['In review', submitted.count], ['Approved', approved.count], ['Open enquiries', enquiries.count]]);
    return;
  }
  const [properties, review, pages, articles] = await Promise.all([
    client.from('properties').select('id', { count: 'exact', head: true }),
    client.from('properties').select('id', { count: 'exact', head: true }).in('review_status', ['submitted', 'under_review']),
    client.from('pages').select('id', { count: 'exact', head: true }),
    client.from('articles').select('id', { count: 'exact', head: true }),
  ]);
  renderStats([['Properties', properties.count], ['Awaiting review', review.count], ['Pages', pages.count], ['Articles', articles.count]]);
}

async function loadProperties() {
  let query = client.from('properties').select('id,reference,title,slug,listing_type,status,review_status,review_feedback,updated_at').order('updated_at', { ascending: false });
  if (expectedRole === 'agent') query = query.eq('created_by', userId);
  const result = await query;
  if (result.error) throw result.error;
  const rows = (result.data ?? []).map(item => `<tr><td><b>${safeText(item.reference)}</b><br><small>${safeText(item.listing_type)}</small></td><td>${safeText(item.title)}${item.review_feedback ? `<br><small>${safeText(item.review_feedback)}</small>` : ''}</td><td>${status(item.review_status)}</td><td>${new Date(item.updated_at).toLocaleDateString('en-ZM')}</td><td>${expectedRole === 'agent' && ['draft', 'changes_requested'].includes(item.review_status) ? `<button data-edit-workspace-property="${item.id}">Edit</button>` : expectedRole === 'editor' ? `<button data-edit-editor-property="${item.id}">Edit content</button>` : '<span>Read only</span>'}</td></tr>`);
  const target = document.querySelector('#workspace-properties');
  if (target) target.innerHTML = table(['Reference', 'Property', 'Approval status', 'Updated', 'Action'], rows);
}

async function loadOptions() {
  const [types, locations, amenities] = await Promise.all([
    client.from('property_types').select('id,name').order('name'),
    client.from('locations').select('id,name,province').eq('is_published', true).order('name'),
    client.from('amenities').select('id,name').order('name'),
  ]);
  if (types.error || locations.error || amenities.error) throw types.error ?? locations.error ?? amenities.error;
  const typeSelect = document.querySelector<HTMLSelectElement>('#workspace-property-type');
  const locationSelect = document.querySelector<HTMLSelectElement>('#workspace-location');
  if (typeSelect) typeSelect.innerHTML = '<option value="">Select property type</option>' + types.data.map(item => `<option value="${item.id}">${safeText(item.name)}</option>`).join('');
  if (locationSelect) locationSelect.innerHTML = '<option value="">Select location</option>' + locations.data.map(item => `<option value="${item.id}">${safeText(item.name)}${item.province ? `, ${safeText(item.province)}` : ''}</option>`).join('');
  const amenityTarget = document.querySelector('#workspace-amenities');
  if (amenityTarget) amenityTarget.innerHTML = '<legend>Amenities</legend>' + amenities.data.map(item => `<label><input type="checkbox" name="amenity" value="${item.id}"/> ${safeText(item.name)}</label>`).join('');
}

function renderImages() {
  const target = document.querySelector('#workspace-image-previews');
  if (!target) return;
  target.innerHTML = managedImages.map((image, index) => `<figure class="image-preview ${image.isPrimary ? 'is-primary' : ''}" draggable="true" data-image-index="${index}"><img src="${safeText(image.url)}" alt="Property photograph preview ${index + 1}"/><figcaption><span>${image.isPrimary ? 'Primary photograph' : `Photograph ${index + 1}`}</span><button type="button" data-set-primary="${index}">Make primary</button><button type="button" data-remove-image="${index}">Remove</button></figcaption></figure>`).join('');
}

function addSelectedImages(files: File[]) {
  const accepted = files.filter(file => file.size <= 10 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type));
  if (accepted.length !== files.length) message('Some files were skipped. Use JPG, PNG, WebP or AVIF files under 10 MB.');
  managedImages.push(...accepted.map((file, index) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file), isPrimary: managedImages.length === 0 && index === 0 })));
  renderImages();
}

async function editProperty(id: string) {
  const [property, images, amenities] = await Promise.all([
    client.from('properties').select('*').eq('id', id).single(),
    client.from('property_images').select('id,storage_path,is_primary,position').eq('property_id', id).order('position'),
    client.from('property_amenities').select('amenity_id').eq('property_id', id),
  ]);
  if (property.error || images.error || amenities.error) throw property.error ?? images.error ?? amenities.error;
  const form = document.querySelector<HTMLFormElement>('#workspace-property-form')!;
  form.reset();
  Object.entries(property.data).forEach(([key, value]) => {
    const field = form.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    if (field) field.value = value == null ? '' : String(value);
  });
  amenities.data.forEach(item => {
    const checkbox = form.querySelector<HTMLInputElement>(`input[name="amenity"][value="${item.amenity_id}"]`);
    if (checkbox) checkbox.checked = true;
  });
  managedImages = images.data.map(image => ({ id: image.id, storagePath: image.storage_path, url: client.storage.from('property-media').getPublicUrl(image.storage_path).data.publicUrl, isPrimary: image.is_primary }));
  renderImages();
  showPanel('property-form');
  document.querySelector('#workspace-property-title')!.textContent = 'Edit property';
}

async function saveProperty(form: HTMLFormElement, intent: 'draft' | 'submitted') {
  if (saving) return;
  saving = true;
  form.setAttribute('aria-busy', 'true');
  try {
    const data = new FormData(form);
    const id = String(data.get('id') ?? '');
    const price = data.get('price') ? Number(data.get('price')) : null;
    const draft = {
      reference: String(data.get('reference') ?? ''), title: String(data.get('title') ?? ''), slug: String(data.get('slug') ?? ''),
      listingType: String(data.get('listing_type') ?? ''), propertyTypeId: String(data.get('property_type_id') ?? ''), locationId: String(data.get('location_id') ?? ''),
      price, currency: String(data.get('currency') ?? 'ZMW'), description: String(data.get('description') ?? ''),
    };
    validatePropertyDraft(draft);
    const payload = {
      reference: draft.reference.trim(), title: draft.title.trim(), slug: draft.slug,
      listing_type: draft.listingType, property_type_id: draft.propertyTypeId, location_id: draft.locationId,
      price, currency: draft.currency, summary: String(data.get('summary') ?? '').trim(), description: draft.description.trim(),
      bedrooms: data.get('bedrooms') ? Number(data.get('bedrooms')) : null,
      bathrooms: data.get('bathrooms') ? Number(data.get('bathrooms')) : null,
      parking_spaces: data.get('parking_spaces') ? Number(data.get('parking_spaces')) : null,
      floor_size: data.get('floor_size') ? Number(data.get('floor_size')) : null,
      land_size: data.get('land_size') ? Number(data.get('land_size')) : null,
      land_unit: data.get('land_size') ? String(data.get('land_unit') || 'sqm') : null,
      agent_id: agentId, status: 'draft', is_available: false,
    };
    const saved = id
      ? await client.from('properties').update(payload).eq('id', id).select('id').single()
      : await client.from('properties').insert({ ...payload, created_by: userId, review_status: 'draft' }).select('id').single();
    if (saved.error) throw saved.error;
    const propertyId = saved.data.id;

    const selectedAmenities = data.getAll('amenity').map(String);
    const cleared = await client.from('property_amenities').delete().eq('property_id', propertyId);
    if (cleared.error) throw cleared.error;
    if (selectedAmenities.length) {
      const attached = await client.from('property_amenities').insert(selectedAmenities.map(amenityId => ({ property_id: propertyId, amenity_id: amenityId })));
      if (attached.error) throw attached.error;
    }

    for (const image of managedImages.filter(item => item.file)) {
      const file = image.file!;
      const path = `${propertyId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const uploaded = await client.storage.from('property-media').upload(path, file, { contentType: file.type });
      if (uploaded.error) throw uploaded.error;
      image.storagePath = path;
      image.file = undefined;
      const inserted = await client.from('property_images').insert({ property_id: propertyId, storage_path: path, alt_text: `${draft.title} property photograph`, position: managedImages.indexOf(image), is_primary: false }).select('id').single();
      if (inserted.error) {
        await client.storage.from('property-media').remove([path]);
        throw inserted.error;
      }
      image.id = inserted.data.id;
    }
    const normalized = normalizeImageOrder(managedImages.map(image => ({ id: image.id, isPrimary: image.isPrimary })));
    for (const image of normalized) {
      const updated = await client.from('property_images').update({ position: image.position, is_primary: image.isPrimary }).eq('id', image.id).eq('property_id', propertyId);
      if (updated.error) throw updated.error;
    }
    if (intent === 'submitted') {
      const submitted = await client.from('properties').update({ review_status: 'submitted' }).eq('id', propertyId);
      if (submitted.error) throw submitted.error;
    }
    message(intent === 'submitted' ? 'Property submitted for administrator review.' : 'Draft saved.');
    form.reset();
    managedImages = [];
    renderImages();
    await Promise.all([loadOverview(), loadProperties()]);
    showPanel('properties');
  } finally {
    saving = false;
    form.removeAttribute('aria-busy');
  }
}

async function loadEnquiries() {
  const result = await client.from('enquiries').select('id,name,email,phone,type,status,created_at,property:properties(reference,title)').eq('assigned_to', userId).order('created_at', { ascending: false });
  if (result.error) throw result.error;
  const target = document.querySelector('#workspace-enquiries');
  if (target) target.innerHTML = table(['Customer', 'Property', 'Type', 'Status', 'Received'], result.data.map((item: any) => `<tr><td>${safeText(item.name)}<br><small>${safeText(item.email)} · ${safeText(item.phone ?? 'No phone')}</small></td><td>${safeText(item.property?.reference ?? 'General')}<br><small>${safeText(item.property?.title ?? '')}</small></td><td>${safeText(item.type)}</td><td>${status(item.status)}</td><td>${new Date(item.created_at).toLocaleDateString('en-ZM')}</td></tr>`));
}

async function loadProfile() {
  const result = await client.from('agents').select('name,title,phone,bio').eq('profile_id', userId).single();
  if (result.error) throw result.error;
  const form = document.querySelector<HTMLFormElement>('#workspace-profile-form');
  if (!form) return;
  Object.entries(result.data).forEach(([key, value]) => {
    const field = form.elements.namedItem(key) as HTMLInputElement | HTMLTextAreaElement | null;
    if (field) field.value = value ?? '';
  });
}

async function loadReviewQueue() {
  const result = await client.from('properties').select('id,reference,title,review_status,review_feedback,updated_at,agent:agents(name)').in('review_status', ['submitted', 'under_review', 'changes_requested']).order('updated_at');
  if (result.error) throw result.error;
  const target = document.querySelector('#workspace-review');
  if (target) target.innerHTML = table(['Property', 'Agent', 'Status', 'Editorial review'], result.data.map((item: any) => `<tr><td><b>${safeText(item.reference)}</b><br>${safeText(item.title)}</td><td>${safeText(item.agent?.name ?? 'Unassigned')}</td><td>${status(item.review_status)}</td><td><textarea data-editor-feedback="${item.id}" maxlength="4000" aria-label="Review feedback for ${safeText(item.title)}">${safeText(item.review_feedback ?? '')}</textarea><br><button data-editor-review="${item.id}:under_review">Start review</button><button data-editor-review="${item.id}:changes_requested">Request changes</button></td></tr>`));
}

async function loadContent() {
  const [pages, articles] = await Promise.all([
    client.from('pages').select('id,title,slug,is_published,updated_at').order('updated_at', { ascending: false }).limit(20),
    client.from('articles').select('id,title,slug,is_published,updated_at').order('updated_at', { ascending: false }).limit(20),
  ]);
  if (pages.error || articles.error) throw pages.error ?? articles.error;
  const rows = [...pages.data.map(item => ({ ...item, kind: 'pages' })), ...articles.data.map(item => ({ ...item, kind: 'articles' }))]
    .map(item => `<tr><td>${safeText(item.kind === 'pages' ? 'Page' : 'Article')}</td><td><b>${safeText(item.title)}</b><br><small>/${safeText(item.slug)}</small></td><td>${item.is_published ? 'Published' : 'Draft'}</td><td><button data-toggle-editor-content="${item.kind}:${item.id}:${!item.is_published}">${item.is_published ? 'Move to draft' : 'Publish'}</button></td></tr>`);
  const target = document.querySelector('#workspace-content');
  if (target) target.innerHTML = table(['Type', 'Content', 'Status', 'Action'], rows);
}

async function loadMedia() {
  const result = await client.from('property_images').select('id,storage_path,alt_text,position,property:properties(reference,title)').order('created_at', { ascending: false }).limit(60);
  if (result.error) throw result.error;
  const target = document.querySelector('#workspace-media');
  if (target) target.innerHTML = result.data.length ? `<div class="image-order">${result.data.map((item: any) => `<figure class="image-preview"><img src="${client.storage.from('property-media').getPublicUrl(item.storage_path).data.publicUrl}" alt="${safeText(item.alt_text)}" loading="lazy"/><figcaption><b>${safeText(item.property?.reference ?? 'Property')}</b><span>${safeText(item.property?.title ?? '')}</span></figcaption></figure>`).join('')}</div>` : '<p class="workspace-empty">No property media has been uploaded.</p>';
}

function showPreview() {
  const form = document.querySelector<HTMLFormElement>('#workspace-property-form')!;
  const data = new FormData(form);
  const primary = managedImages.find(image => image.isPrimary) ?? managedImages[0];
  const dialog = document.createElement('dialog');
  dialog.className = 'workspace-preview';
  dialog.innerHTML = `<article class="workspace-card"><button type="button" data-close-preview aria-label="Close preview">Close</button>${primary ? `<img src="${safeText(primary.url)}" alt="" style="width:100%;max-height:360px;object-fit:cover"/>` : ''}<p class="eyebrow">Listing preview</p><h2>${safeText(String(data.get('title') || 'Untitled property'))}</h2><p><b>${safeText(String(data.get('currency') || 'ZMW'))} ${safeText(String(data.get('price') || 'Price on enquiry'))}</b></p><p>${safeText(String(data.get('description') || 'Add a description to preview the listing.'))}</p></article>`;
  document.body.append(dialog);
  dialog.addEventListener('close', () => dialog.remove());
  dialog.querySelector('[data-close-preview]')?.addEventListener('click', () => dialog.close());
  dialog.showModal();
}

async function editPropertyContent(id: string) {
  const result = await client.from('properties').select('id,title,summary,description,review_status').eq('id', id).single();
  if (result.error) throw result.error;
  const dialog = document.createElement('dialog');
  dialog.className = 'workspace-preview';
  dialog.innerHTML = `<form class="workspace-form workspace-card" data-editor-property-form="${result.data.id}"><button type="button" data-close-preview>Close</button><h2>Property content</h2><p>${status(result.data.review_status)}</p><label>Title<input name="title" required minlength="5" maxlength="180" value="${safeText(result.data.title)}"/></label><label class="full">Summary<textarea name="summary" maxlength="500">${safeText(result.data.summary)}</textarea></label><label class="full">Description<textarea name="description" required minlength="20" maxlength="10000">${safeText(result.data.description)}</textarea></label><button class="button button-yellow" type="submit">Save editorial changes</button></form>`;
  document.body.append(dialog);
  dialog.addEventListener('close', () => dialog.remove());
  dialog.querySelector('[data-close-preview]')?.addEventListener('click', () => dialog.close());
  dialog.querySelector('form')?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    void client.from('properties').update({ title: String(data.get('title')).trim(), summary: String(data.get('summary')).trim(), description: String(data.get('description')).trim() }).eq('id', id).then(({ error }) => {
      if (error) message(error.message);
      else { message('Property content updated.'); dialog.close(); void loadProperties(); }
    });
  });
  dialog.showModal();
}

document.querySelectorAll<HTMLElement>('[data-workspace-view]').forEach(button => button.addEventListener('click', () => {
  const view = button.dataset.workspaceView!;
  showPanel(view);
  const loaders: Record<string, () => Promise<void>> = { overview: loadOverview, properties: loadProperties, enquiries: loadEnquiries, profile: loadProfile, review: loadReviewQueue, content: loadContent, media: loadMedia };
  void loaders[view]?.().catch(error => message(error.message));
}));

document.querySelector('[data-open-property-form]')?.addEventListener('click', () => {
  document.querySelector<HTMLFormElement>('#workspace-property-form')?.reset();
  managedImages = [];
  renderImages();
  showPanel('property-form');
});

document.querySelector<HTMLInputElement>('#workspace-property-form input[name="images"]')?.addEventListener('change', event => {
  addSelectedImages([...((event.currentTarget as HTMLInputElement).files ?? [])]);
});

document.querySelector('#workspace-property-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null;
  const intent = submitter?.value === 'submitted' ? 'submitted' : 'draft';
  void saveProperty(event.currentTarget as HTMLFormElement, intent).catch(error => message(error.message));
});

document.querySelector('[data-preview-property]')?.addEventListener('click', showPreview);

document.querySelector('#workspace-profile-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget as HTMLFormElement);
  void client.from('agents').update({ name: String(data.get('name')).trim(), title: String(data.get('title')).trim() || null, phone: String(data.get('phone')).trim() || null, bio: String(data.get('bio')).trim() || null }).eq('profile_id', userId).then(({ error }) => message(error ? error.message : 'Profile saved.'));
});

document.addEventListener('click', event => {
  const target = event.target as HTMLElement;
  const edit = target.closest<HTMLElement>('[data-edit-workspace-property]');
  if (edit) void editProperty(edit.dataset.editWorkspaceProperty!).catch(error => message(error.message));
  const editorProperty = target.closest<HTMLElement>('[data-edit-editor-property]');
  if (editorProperty) void editPropertyContent(editorProperty.dataset.editEditorProperty!).catch(error => message(error.message));
  const primary = target.closest<HTMLElement>('[data-set-primary]');
  if (primary) {
    const index = Number(primary.dataset.setPrimary);
    managedImages = managedImages.map((image, position) => ({ ...image, isPrimary: position === index }));
    renderImages();
  }
  const remove = target.closest<HTMLElement>('[data-remove-image]');
  if (remove) {
    const index = Number(remove.dataset.removeImage);
    const [image] = managedImages.splice(index, 1);
    if (image?.file) URL.revokeObjectURL(image.url);
    if (image?.storagePath) void client.from('property_images').delete().eq('id', image.id).then(({ error }) => { if (error) message(error.message); });
    if (managedImages.length && !managedImages.some(item => item.isPrimary)) managedImages[0].isPrimary = true;
    renderImages();
  }
  const review = target.closest<HTMLElement>('[data-editor-review]');
  if (review) {
    const [id, reviewStatus] = review.dataset.editorReview!.split(':');
    const reviewFeedback = document.querySelector<HTMLTextAreaElement>(`[data-editor-feedback="${id}"]`)?.value.trim() || null;
    void client.from('properties').update({ review_status: reviewStatus, review_feedback: reviewFeedback }).eq('id', id).then(({ error }) => {
      message(error ? error.message : 'Editorial review saved for administrator decision.');
      if (!error) void loadReviewQueue();
    });
  }
  const content = target.closest<HTMLElement>('[data-toggle-editor-content]');
  if (content) {
    const [kind, id, published] = content.dataset.toggleEditorContent!.split(':');
    void client.from(kind).update({ is_published: published === 'true' }).eq('id', id).then(({ error }) => {
      message(error ? error.message : 'Content status updated.');
      if (!error) void loadContent();
    });
  }
});

let draggedIndex: number | null = null;
document.addEventListener('dragstart', event => {
  const item = (event.target as HTMLElement).closest<HTMLElement>('[data-image-index]');
  if (item) draggedIndex = Number(item.dataset.imageIndex);
});
document.addEventListener('dragover', event => {
  if ((event.target as HTMLElement).closest('[data-image-index]')) event.preventDefault();
});
document.addEventListener('drop', event => {
  const item = (event.target as HTMLElement).closest<HTMLElement>('[data-image-index]');
  if (!item || draggedIndex === null) return;
  event.preventDefault();
  const destination = Number(item.dataset.imageIndex);
  const [moved] = managedImages.splice(draggedIndex, 1);
  managedImages.splice(destination, 0, moved);
  draggedIndex = null;
  renderImages();
});

await requireWorkspaceAccess();
if (expectedRole === 'agent') await loadOptions();
await Promise.all([loadOverview(), loadProperties()]);
