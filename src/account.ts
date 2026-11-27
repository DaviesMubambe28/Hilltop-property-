import { requireSupabase } from './supabase';
import type { VerifiedAccountSession } from './services/auth';
import { safeText } from './validation';
import { searchParamsFromFilters } from './search';
import type { SearchFilters } from './types';
import { validatePrivateDocument } from './ecosystem';
import { reportAccountFailure } from './account-access';

const client = requireSupabase();
const feedback = document.querySelector('#account-feedback');

async function loadAccountSection(targetId: string, load: () => Promise<void>): Promise<void> {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.setAttribute('aria-busy', 'true');
  try {
    await load();
  } catch (error) {
    target.replaceChildren();
    const message = document.createElement('p');
    message.className = 'account-section-error';
    message.textContent = 'This section is temporarily unavailable.';
    target.append(message);
    reportAccountFailure('account-initialize', error);
  } finally {
    target.removeAttribute('aria-busy');
  }
}

function setFeedback(message: string, error = false) {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.setAttribute('data-error', String(error));
}

export async function mountAccount(session: VerifiedAccountSession): Promise<void> {
  if (
    !session.user ||
    !session.profile ||
    session.user.id !== session.profile.id ||
    !session.profile.is_active
  ) {
    throw new Error('Verified active account required.');
  }

  const form = document.querySelector<HTMLFormElement>('#profile-form');
  if (form) {
    (form.elements.namedItem('full_name') as HTMLInputElement).value = session.profile.full_name ?? '';
    (form.elements.namedItem('phone') as HTMLInputElement).value = session.profile.phone ?? '';
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const result = await client
        .from('profiles')
        .update({
          full_name: String(data.get('full_name')),
          phone: String(data.get('phone') || ''),
        })
        .eq('id', session.user.id);
      if (result.error) {
        reportAccountFailure('account-initialize', result.error);
        setFeedback('Your profile could not be saved. Please try again.', true);
      } else {
        setFeedback('Profile saved.');
      }
    });
  }

  await Promise.all([
    loadAccountSection('saved-list', async () => {
      const result = await client
        .from('saved_properties')
        .select('created_at,property:properties(id,title,slug,price,currency,status)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (result.error) throw result.error;
      const target = document.getElementById('saved-list');
      if (!target) return;
      target.innerHTML = (result.data ?? []).map((item) => {
        const property = Array.isArray(item.property) ? item.property[0] : item.property;
        return `<article class="content-card"><b>${safeText(property?.title)}</b><span> · ${property?.price ?? 'Price on enquiry'}</span><button data-remove-saved="${safeText(property?.id)}">Remove</button></article>`;
      }).join('') || '<p>No saved properties yet.</p>';
    }),
    loadAccountSection('search-list', async () => {
      const result = await client
        .from('saved_searches')
        .select('id,name,filters,alert_enabled,updated_at')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });
      if (result.error) throw result.error;
      const target = document.getElementById('search-list');
      if (!target) return;
      target.innerHTML = (result.data ?? []).map((item) => {
        const params = searchParamsFromFilters({
          ...item.filters,
          page: 1,
          pageSize: 8,
        } as SearchFilters);
        return `<article class="content-card"><b>${safeText(item.name)}</b><span> · alerts ${item.alert_enabled ? 'on' : 'paused'}</span><a href="/?${safeText(params)}#properties">View results</a><button data-toggle-search="${safeText(item.id)}" data-enabled="${item.alert_enabled}">${item.alert_enabled ? 'Pause alerts' : 'Enable alerts'}</button><button data-remove-search="${safeText(item.id)}">Delete</button></article>`;
      }).join('') || '<p>No saved searches yet. Create one from the property catalogue.</p>';
    }),
    loadAccountSection('notification-list', async () => {
      const result = await client
        .from('system_notifications')
        .select('id,title,body,read_at,created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (result.error) throw result.error;
      const target = document.getElementById('notification-list');
      if (!target) return;
      target.innerHTML = (result.data ?? []).map((item) =>
        `<article class="content-card"><b>${safeText(item.title)}</b><p>${safeText(item.body)}</p><small>${new Date(item.created_at).toLocaleString()}</small>${item.read_at ? '' : `<button data-read-notification="${safeText(item.id)}">Mark read</button>`}</article>`
      ).join('') || '<p>No alerts yet.</p>';
    }),
    loadAccountSection('submission-list', async () => {
      const result = await client
        .from('property_submissions')
        .select('id,title,status,review_notes,created_at')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (result.error) throw result.error;
      const target = document.getElementById('submission-list');
      if (!target) return;
      target.innerHTML = (result.data ?? []).map((item) =>
        `<article class="content-card"><b>${safeText(item.title)}</b><span> · ${safeText(item.status)}</span>${item.review_notes ? `<p>${safeText(item.review_notes)}</p>` : ''}</article>`
      ).join('') || '<p>No property submissions yet.</p>';
    }),
    loadAccountSection('lease-list', async () => {
      const result = await client
        .from('leases')
        .select('id,status,starts_on,ends_on,rent_amount,currency,property:properties(title),maintenance:maintenance_requests(id,title,status,created_at)')
        .or(`tenant_id.eq.${session.user.id},landlord_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false })
        .limit(100);
      if (result.error) throw result.error;
      const target = document.getElementById('lease-list');
      if (!target) return;
      target.innerHTML = (result.data ?? []).map((item) => {
        const property = Array.isArray(item.property) ? item.property[0] : item.property;
        const maintenance = Array.isArray(item.maintenance) ? item.maintenance : [];
        return `<article class="content-card"><b>${safeText(property?.title)}</b><span> · ${safeText(item.status)} · ${safeText(item.currency)} ${item.rent_amount}</span><p>${item.starts_on} to ${item.ends_on}</p>${maintenance.map((request) => `<small>${safeText(request.title)} · ${safeText(request.status)}</small>`).join('<br>')}<form data-maintenance="${safeText(item.id)}"><input name="title" required minlength="3" maxlength="180" placeholder="Maintenance issue"/><textarea name="description" required minlength="10" maxlength="4000" placeholder="Describe the issue"></textarea><select name="priority"><option>normal</option><option>low</option><option>high</option><option>urgent</option></select><button>Report issue</button></form></article>`;
      }).join('') || '<p>No leases are linked to this account.</p>';
    }),
    loadAccountSection('offer-list', async () => {
      const result = await client
        .from('property_offers')
        .select('id,amount,currency,status,created_at,property:properties(title,slug),milestones:transaction_milestones(title,due_at,completed_at,position)')
        .eq('buyer_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (result.error) throw result.error;
      const target = document.getElementById('offer-list');
      if (!target) return;
      target.innerHTML = (result.data ?? []).map((item) => {
        const property = Array.isArray(item.property) ? item.property[0] : item.property;
        const milestones = Array.isArray(item.milestones) ? item.milestones : [];
        return `<article class="content-card"><b>${safeText(property?.title)}</b><span> · ${safeText(item.currency)} ${item.amount} · ${safeText(item.status)}</span>${milestones.sort((a, b) => a.position - b.position).map((milestone) => `<p>${milestone.completed_at ? '✓' : '○'} ${safeText(milestone.title)}${milestone.due_at ? ` · ${new Date(milestone.due_at).toLocaleDateString()}` : ''}</p>`).join('')}</article>`;
      }).join('') || '<p>No offers submitted.</p>';
    }),
    loadAccountSection('service-request-list', async () => {
      const result = await client
        .from('property_service_requests')
        .select('id,kind,status,requirements,created_at')
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (result.error) throw result.error;
      const target = document.getElementById('service-request-list');
      if (!target) return;
      target.innerHTML = (result.data ?? []).map((item) =>
        `<article class="content-card"><b>${safeText(item.kind)}</b><span> · ${safeText(item.status)}</span><p>${safeText(item.requirements)}</p></article>`
      ).join('') || '<p>No specialist requests yet.</p>';
    }),
    loadAccountSection('history-list', async () => {
      const result = await client
        .from('enquiries')
        .select('id,type,status,created_at,property:properties(title)')
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false });
      if (result.error) throw result.error;
      const target = document.getElementById('history-list');
      if (!target) return;
      target.innerHTML = (result.data ?? []).map((item) => {
        const property = Array.isArray(item.property) ? item.property[0] : item.property;
        return `<article class="content-card"><b>${safeText(property?.title ?? 'General enquiry')}</b><span> · ${safeText(item.type)} · ${safeText(item.status)} · ${new Date(item.created_at).toLocaleDateString()}</span></article>`;
      }).join('') || '<p>No enquiries yet.</p>';
    }),
  ]);

  document.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    const propertyId = target.closest<HTMLElement>('[data-remove-saved]')?.dataset.removeSaved;
    const removeSearch = target.closest<HTMLElement>('[data-remove-search]')?.dataset.removeSearch;
    const toggle = target.closest<HTMLElement>('[data-toggle-search]');
    const notification = target.closest<HTMLElement>('[data-read-notification]')?.dataset.readNotification;
    let error: unknown = null;
    if (propertyId) {
      ({ error } = await client.from('saved_properties').delete().eq('user_id', session.user.id).eq('property_id', propertyId));
    } else if (removeSearch) {
      ({ error } = await client.from('saved_searches').delete().eq('user_id', session.user.id).eq('id', removeSearch));
    } else if (toggle) {
      ({ error } = await client.from('saved_searches').update({
        alert_enabled: toggle.dataset.enabled !== 'true',
        last_checked_at: new Date().toISOString(),
      }).eq('user_id', session.user.id).eq('id', toggle.dataset.toggleSearch ?? ''));
    } else if (notification) {
      ({ error } = await client.from('system_notifications').update({
        read_at: new Date().toISOString(),
      }).eq('user_id', session.user.id).eq('id', notification));
    } else {
      return;
    }
    if (error) {
      reportAccountFailure('account-initialize', error);
      setFeedback('This account action could not be completed. Please try again.', true);
    } else {
      location.reload();
    }
  });

  document.addEventListener('submit', async (event) => {
    const target = event.target as HTMLFormElement;
    if (target.id === 'property-submission-form') {
      event.preventDefault();
      const data = new FormData(target);
      const file = data.get('document');
      if (file instanceof File && file.size) {
        const documentError = validatePrivateDocument(file);
        if (documentError) {
          setFeedback(documentError, true);
          return;
        }
      }
      const created = await client.from('property_submissions').insert({
        owner_id: session.user.id,
        title: String(data.get('title')),
        listing_type: data.get('listing_type'),
        property_type: String(data.get('property_type')),
        address: String(data.get('address')),
        asking_price: data.get('asking_price') ? Number(data.get('asking_price')) : null,
        bedrooms: data.get('bedrooms') ? Number(data.get('bedrooms')) : null,
        bathrooms: data.get('bathrooms') ? Number(data.get('bathrooms')) : null,
        description: String(data.get('description')),
        status: 'draft',
      }).select('id').single();
      if (created.error) {
        reportAccountFailure('account-initialize', created.error);
        setFeedback('The property could not be submitted. Please try again.', true);
        return;
      }
      if (file instanceof File && file.size) {
        const path = `${session.user.id}/${created.data.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const upload = await client.storage.from('owner-submission-documents').upload(path, file, { contentType: file.type });
        if (upload.error) {
          reportAccountFailure('account-initialize', upload.error);
          setFeedback('The supporting document could not be uploaded.', true);
          return;
        }
        const record = await client.from('property_submission_documents').insert({
          submission_id: created.data.id,
          storage_path: path,
          document_type: 'supporting_document',
          original_name: file.name,
        });
        if (record.error) {
          await client.storage.from('owner-submission-documents').remove([path]);
          reportAccountFailure('account-initialize', record.error);
          setFeedback('The submission record could not be completed.', true);
          return;
        }
      }
      const submitted = await client.from('property_submissions').update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      }).eq('id', created.data.id);
      if (submitted.error) {
        reportAccountFailure('account-initialize', submitted.error);
        setFeedback('The property could not be submitted. Please try again.', true);
        return;
      }
      target.reset();
      setFeedback('Property submitted for staff review.');
      location.reload();
    }
    const leaseId = target.dataset.maintenance;
    if (leaseId) {
      event.preventDefault();
      const data = new FormData(target);
      const result = await client.from('maintenance_requests').insert({
        lease_id: leaseId,
        created_by: session.user.id,
        title: String(data.get('title')),
        description: String(data.get('description')),
        priority: String(data.get('priority')),
      });
      if (result.error) {
        reportAccountFailure('account-initialize', result.error);
        setFeedback('The maintenance request could not be submitted.', true);
      } else {
        setFeedback('Maintenance request submitted.');
        location.reload();
      }
    }
  });

  document.querySelector('#service-request-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const target = event.currentTarget as HTMLFormElement;
    const data = new FormData(target);
    const result = await client.from('property_service_requests').insert({
      customer_id: session.user.id,
      kind: data.get('kind'),
      requirements: String(data.get('requirements')),
      budget: data.get('budget') ? Number(data.get('budget')) : null,
      preferred_contact: data.get('preferred_contact'),
      timezone: String(data.get('timezone') || '') || null,
    });
    if (result.error) {
      reportAccountFailure('account-initialize', result.error);
      setFeedback('The specialist request could not be submitted.', true);
    } else {
      setFeedback('Specialist request submitted.');
      location.reload();
    }
  });
}
