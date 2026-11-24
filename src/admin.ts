import { requireSupabase } from './supabase';
import { currentProfile, signOut } from './services/auth';
import { safeText } from './validation';
import { safeStorageName, validateVerificationFile } from './verification';

const client = requireSupabase();
const feedback = document.querySelector<HTMLElement>('#admin-feedback');
let role: 'editor' | 'admin';
let staffId = '';

function message(text: string) { if (feedback) feedback.textContent = text; }
function table(headers: string[], rows: string[]) { return `<table class="admin-table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`; }

async function requireStaff() {
  const session = await currentProfile();
  if (!session || !['editor', 'admin'].includes(session.profile.role) || !session.profile.is_active) { location.href = '/?staff-access=required'; throw new Error('Staff access required.'); }
  role = session.profile.role as 'editor' | 'admin';
  staffId = session.user.id;
  const name = document.querySelector('#staff-name'); if (name) name.textContent = session.profile.full_name;
  document.querySelectorAll<HTMLElement>('[data-admin-only]').forEach((element) => { element.hidden = role !== 'admin'; });
}

async function loadDashboard() {
  const [properties, enquiries, available, viewings, recent] = await Promise.all([
    client.from('properties').select('id', { count: 'exact', head: true }), client.from('enquiries').select('id', { count: 'exact', head: true }),
    client.from('properties').select('id', { count: 'exact', head: true }).eq('is_available', true), client.from('enquiries').select('id', { count: 'exact', head: true }).eq('type', 'viewing'),
    client.from('enquiries').select('id,name,email,type,status,created_at').order('created_at', { ascending: false }).limit(8),
  ]);
  const stats = document.querySelector('#dashboard-stats'); if (stats) stats.innerHTML = [['Properties',properties.count],['Enquiries',enquiries.count],['Available',available.count],['Viewings',viewings.count]].map(([label,count])=>`<div class="stat"><b>${count ?? 0}</b><span>${label}</span></div>`).join('');
  const target = document.querySelector('#recent-enquiries'); if (target) target.innerHTML = table(['Customer','Type','Status','Received'],(recent.data??[]).map((item)=>`<tr><td>${safeText(item.name)}<br><small>${safeText(item.email)}</small></td><td>${item.type}</td><td class="status-${item.status}">${item.status}</td><td>${new Date(item.created_at).toLocaleDateString()}</td></tr>`));
}

async function loadProperties() {
  const { data, error } = await client.from('properties').select('id,reference,title,listing_type,status,price,is_available,updated_at').order('updated_at',{ascending:false}); if(error) throw error;
  const target=document.querySelector('#property-admin-list'); if(target) target.innerHTML=table(['Reference','Property','Type','Status','Price','Actions'],(data??[]).map((item)=>`<tr><td>${safeText(item.reference)}</td><td>${safeText(item.title)}</td><td>${item.listing_type}</td><td>${item.status}</td><td>${item.price??'Enquiry'}</td><td><button data-edit-property="${item.id}">Edit</button><button data-archive-property="${item.id}">Archive</button></td></tr>`));
}

async function editProperty(id:string) {
  const {data,error}=await client.from('properties').select('*').eq('id',id).single(); if(error) throw error;
  const form=document.querySelector<HTMLFormElement>('#property-form')!; form.hidden=false;
  Object.entries(data).forEach(([key,value])=>{const field=form.elements.namedItem(key) as HTMLInputElement|null;if(field){if(field.type==='checkbox')field.checked=Boolean(value);else field.value=value==null?'':String(value);}}); form.scrollIntoView({behavior:'smooth'});
}

async function saveProperty(form:HTMLFormElement) {
  const data=new FormData(form); const id=String(data.get('id')||'');
  const payload={reference:String(data.get('reference')),title:String(data.get('title')),slug:String(data.get('slug')),listing_type:String(data.get('listing_type')),status:String(data.get('status')),price:data.get('price')?Number(data.get('price')):null,bedrooms:data.get('bedrooms')?Number(data.get('bedrooms')):null,bathrooms:data.get('bathrooms')?Number(data.get('bathrooms')):null,summary:String(data.get('summary')),description:String(data.get('description')),is_featured:data.get('is_featured')==='on',is_available:data.get('is_available')==='on',published_at:data.get('status')==='published'?new Date().toISOString():null};
  const result=id?await client.from('properties').update(payload).eq('id',id).select('id').single():await client.from('properties').insert(payload).select('id').single(); if(result.error) throw result.error;
  const files=data.getAll('images').filter((file):file is File=>file instanceof File&&file.size>0); for(const [index,file] of files.entries()){if(file.size>10*1024*1024||!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type))throw new Error('Images must be JPG, PNG, WebP or AVIF and under 10 MB.');const path=`${result.data.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g,'_')}`;const upload=await client.storage.from('property-media').upload(path,file,{contentType:file.type});if(upload.error)throw upload.error;const image=await client.from('property_images').insert({property_id:result.data.id,storage_path:path,alt_text:`${payload.title} property image`,position:index,is_primary:index===0});if(image.error)throw image.error;}
  form.reset();form.hidden=true;message('Property saved.');await loadProperties();await loadDashboard();
}

async function loadEnquiries() { const status=(document.querySelector<HTMLSelectElement>('#enquiry-status-filter')?.value)||'';let query=client.from('enquiries').select('id,name,email,phone,type,status,created_at,assigned_to').order('created_at',{ascending:false});if(status)query=query.eq('status',status);const{data,error}=await query;if(error)throw error;const target=document.querySelector('#enquiry-admin-list');if(target)target.innerHTML=table(['Customer','Type','Status','Received','Action'],(data??[]).map((item)=>`<tr><td>${safeText(item.name)}<br><small>${safeText(item.email)} · ${safeText(item.phone)}</small></td><td>${item.type}</td><td><select data-enquiry-status="${item.id}">${['new','contacted','qualified','closed','spam'].map((s)=>`<option ${s===item.status?'selected':''}>${s}</option>`).join('')}</select></td><td>${new Date(item.created_at).toLocaleString()}</td><td><button data-enquiry-view="${item.id}">View</button></td></tr>`));}

async function loadAppointments(){const{data,error}=await client.from('viewing_appointments').select('id,name,email,phone,mode,preferred_start,proposed_start,status,assigned_to,property:properties(reference,title)').order('preferred_start');if(error)throw error;const target=document.querySelector('#appointment-admin-list');if(target)target.innerHTML=table(['Property','Customer','Requested','Status','Assignment'],(data??[]).map((item:any)=>`<tr><td>${safeText(item.property?.reference)}<br><small>${safeText(item.property?.title)}</small></td><td>${safeText(item.name)}<br><small>${safeText(item.email)} · ${safeText(item.mode)}</small></td><td>${new Date(item.preferred_start).toLocaleString()}<br><input type="datetime-local" data-proposed="${item.id}" value="${item.proposed_start?new Date(item.proposed_start).toISOString().slice(0,16):''}" aria-label="Proposed time"/></td><td><select data-appointment-status="${item.id}">${['requested','confirmed','rejected','proposed','cancelled','completed'].map((status)=>`<option ${status===item.status?'selected':''}>${status}</option>`).join('')}</select></td><td><input data-assignee="${item.id}" value="${safeText(item.assigned_to??'')}" placeholder="Staff user UUID" aria-label="Assigned staff user ID"/><button data-save-appointment="${item.id}">Save</button></td></tr>`));}

async function loadVerification() {
  const [requests, properties] = await Promise.all([
    client.from('property_verification_requests').select('id,status,review_notes,created_at,reviewed_at,property:properties(reference,title),documents:property_verification_documents(id,original_name,storage_path,document_type)').order('created_at',{ascending:false}),
    client.from('properties').select('id,reference,title').neq('status','archived').order('reference'),
  ]);
  if(requests.error)throw requests.error;if(properties.error)throw properties.error;
  const select=document.querySelector<HTMLSelectElement>('#verification-property');if(select)select.innerHTML='<option value="">Select a property</option>'+((properties.data??[]).map((item)=>`<option value="${item.id}">${safeText(item.reference)} — ${safeText(item.title)}</option>`).join(''));
  const target=document.querySelector('#verification-list');if(!target)return;
  target.innerHTML=table(['Property','Submitted','Documents','Status','Review'],(requests.data??[]).map((item:any)=>{
    const documents=(item.documents??[]).map((document:any)=>`<button type="button" data-verification-document="${safeText(document.storage_path)}">${safeText(document.document_type)}: ${safeText(document.original_name)}</button>`).join('<br>')||'None';
    const review=role==='admin'?`<textarea data-verification-notes="${item.id}" maxlength="2000" placeholder="Review notes">${safeText(item.review_notes??'')}</textarea><select data-verification-status="${item.id}">${['submitted','under_review','approved','rejected','expired'].map((status)=>`<option ${status===item.status?'selected':''}>${status.replace('_',' ')}</option>`).join('')}</select><button type="button" data-save-verification="${item.id}">Save review</button>`:safeText(item.review_notes??'Awaiting administrator review');
    return `<tr><td>${safeText(item.property?.reference)}<br><small>${safeText(item.property?.title)}</small></td><td>${new Date(item.created_at).toLocaleString()}</td><td>${documents}</td><td>${safeText(item.status)}</td><td>${review}</td></tr>`;
  }));
}

async function submitVerification(form:HTMLFormElement){
  const data=new FormData(form);const file=data.get('document');if(!(file instanceof File))throw new Error('Choose a supporting document.');
  const validation=validateVerificationFile(file);if(validation)throw new Error(validation);
  const propertyId=String(data.get('property_id')??'');const documentType=String(data.get('document_type')??'').trim();
  const request=await client.from('property_verification_requests').insert({property_id:propertyId,requested_by:staffId}).select('id').single();if(request.error)throw request.error;
  const path=`${request.data.id}/${crypto.randomUUID()}-${safeStorageName(file.name)}`;
  const upload=await client.storage.from('verification-documents').upload(path,file,{contentType:file.type,upsert:false});
  if(upload.error){await client.from('property_verification_requests').delete().eq('id',request.data.id);throw upload.error;}
  const document=await client.from('property_verification_documents').insert({request_id:request.data.id,storage_path:path,document_type:documentType,original_name:file.name,uploaded_by:staffId});
  if(document.error){await client.storage.from('verification-documents').remove([path]);await client.from('property_verification_requests').delete().eq('id',request.data.id);throw document.error;}
  form.reset();message('Verification request and supporting document submitted.');await loadVerification();
}

async function openVerificationDocument(path:string){const{data,error}=await client.storage.from('verification-documents').createSignedUrl(path,60);if(error)throw error;window.open(data.signedUrl,'_blank','noopener,noreferrer');}

async function saveVerification(id:string){
  if(role!=='admin')throw new Error('Administrator access is required.');
  const status=document.querySelector<HTMLSelectElement>(`[data-verification-status="${id}"]`)?.value;const review_notes=document.querySelector<HTMLTextAreaElement>(`[data-verification-notes="${id}"]`)?.value.trim()||null;
  if(!status)throw new Error('Choose a review status.');const{error}=await client.from('property_verification_requests').update({status,review_notes}).eq('id',id);if(error)throw error;message('Verification review saved.');await loadVerification();
}

type ContentKind='pages'|'articles'|'faqs'|'testimonials'|'branches'|'partners'|'projects';
const contentConfig:Record<ContentKind,{primary:string;slug?:string;secondary?:string;body?:string;published:string}>={pages:{primary:'title',slug:'slug',body:'body',published:'is_published'},articles:{primary:'title',slug:'slug',secondary:'excerpt',body:'body',published:'is_published'},faqs:{primary:'question',body:'answer',published:'is_published'},testimonials:{primary:'name',secondary:'role',body:'quote',published:'is_published'},branches:{primary:'name',slug:'slug',secondary:'email',body:'address',published:'is_active'},partners:{primary:'name',secondary:'website_url',published:'is_published'},projects:{primary:'title',slug:'slug',secondary:'status',body:'description',published:'is_published'}};
let contentKind:ContentKind='pages';
async function loadContent(kind:ContentKind='pages'){contentKind=kind;const config=contentConfig[kind];const fields=['id',config.primary,config.slug,config.secondary,config.body,config.published,'updated_at'].filter(Boolean).join(',');const{data,error}=await client.from(kind).select(fields).order('updated_at',{ascending:false});if(error)throw error;const target=document.querySelector('#content-admin-list');if(target)target.innerHTML=(data??[]).map((item:any)=>`<article class="content-card"><b>${safeText(item[config.primary])}</b><span> · ${item[config.published]?'Published':'Draft'}</span><button data-edit-content="${item.id}">Edit</button><button data-toggle-content="${kind}:${item.id}:${!item[config.published]}">${item[config.published]?'Unpublish':'Publish'}</button></article>`).join('')||'<p>No records yet.</p>';}
function configureContentForm(){const config=contentConfig[contentKind];const form=document.querySelector<HTMLFormElement>('#content-form')!;form.hidden=false;form.reset();(form.elements.namedItem('id') as HTMLInputElement).value='';document.querySelector<HTMLElement>('#content-primary-label')!.firstChild!.textContent=`${config.primary.replace('_',' ')} `;document.querySelector<HTMLElement>('#content-slug-label')!.hidden=!config.slug;document.querySelector<HTMLElement>('#content-secondary-label')!.hidden=!config.secondary;document.querySelector<HTMLElement>('#content-body-label')!.hidden=!config.body;}
async function editContent(id:string){const config=contentConfig[contentKind];const{data,error}=await client.from(contentKind).select('*').eq('id',id).single();if(error)throw error;configureContentForm();const form=document.querySelector<HTMLFormElement>('#content-form')!;(form.elements.namedItem('id') as HTMLInputElement).value=id;(form.elements.namedItem('primary') as HTMLInputElement).value=data[config.primary]??'';(form.elements.namedItem('slug') as HTMLInputElement).value=config.slug?data[config.slug]??'':'';(form.elements.namedItem('secondary') as HTMLInputElement).value=config.secondary?data[config.secondary]??'':'';(form.elements.namedItem('body') as HTMLTextAreaElement).value=config.body?data[config.body]??'':'';(form.elements.namedItem('published') as HTMLInputElement).checked=Boolean(data[config.published]);}
async function saveContent(form:HTMLFormElement){const config=contentConfig[contentKind];const data=new FormData(form);const id=String(data.get('id')||'');const payload:Record<string,unknown>={[config.primary]:String(data.get('primary')), [config.published]:data.get('published')==='on'};if(config.slug)payload[config.slug]=String(data.get('slug'));if(config.secondary)payload[config.secondary]=String(data.get('secondary'));if(config.body)payload[config.body]=String(data.get('body'));const result=id?await client.from(contentKind).update(payload).eq('id',id):await client.from(contentKind).insert(payload);if(result.error)throw result.error;form.hidden=true;message('Content saved.');await loadContent(contentKind);}

async function loadStaff(){if(role!=='admin')return;const{data,error}=await client.from('profiles').select('id,full_name,role,is_active,updated_at').neq('role','customer').order('full_name');if(error)throw error;const target=document.querySelector('#staff-list');if(target)target.innerHTML=table(['Name','User ID','Role','Active'],(data??[]).map((item)=>`<tr><td>${safeText(item.full_name)}</td><td><code>${item.id}</code></td><td>${item.role}</td><td>${item.is_active?'Yes':'No'}</td></tr>`));}

const viewLoaders: Record<string, () => Promise<void>> = { dashboard:loadDashboard, properties:loadProperties, enquiries:loadEnquiries, appointments:loadAppointments, verification:loadVerification, content:()=>loadContent(), staff:loadStaff };
document.querySelectorAll<HTMLElement>('[data-view]').forEach((button)=>button.addEventListener('click',()=>{document.querySelectorAll('[data-view]').forEach((item)=>item.classList.toggle('active',item===button));document.querySelectorAll<HTMLElement>('[data-panel]').forEach((panel)=>panel.hidden=panel.dataset.panel!==button.dataset.view);const loader=viewLoaders[button.dataset.view??''];if(loader)void loader();}));
document.querySelector('#new-property')?.addEventListener('click',()=>{const form=document.querySelector<HTMLFormElement>('#property-form')!;form.reset();form.hidden=false;});document.querySelector('#cancel-property')?.addEventListener('click',()=>{document.querySelector<HTMLFormElement>('#property-form')!.hidden=true;});
document.querySelector('#property-form')?.addEventListener('submit',(event)=>{event.preventDefault();void saveProperty(event.currentTarget as HTMLFormElement).catch((error)=>message(error.message));});document.querySelector('#enquiry-status-filter')?.addEventListener('change',()=>void loadEnquiries());document.querySelector('#admin-signout')?.addEventListener('click',async()=>{await signOut();location.href='/';});
document.addEventListener('click',(event)=>{const target=event.target as HTMLElement;const edit=target.closest<HTMLElement>('[data-edit-property]');if(edit)void editProperty(edit.dataset.editProperty!).catch((error)=>message(error.message));const archive=target.closest<HTMLElement>('[data-archive-property]');if(archive&&confirm('Archive this property?'))void client.from('properties').update({status:'archived',is_available:false}).eq('id',archive.dataset.archiveProperty!).then(()=>loadProperties());const saveAppointment=target.closest<HTMLElement>('[data-save-appointment]');if(saveAppointment){const id=saveAppointment.dataset.saveAppointment!;const assigned=(document.querySelector<HTMLInputElement>(`[data-assignee="${id}"]`)?.value||null);const proposed=document.querySelector<HTMLInputElement>(`[data-proposed="${id}"]`)?.value;void client.from('viewing_appointments').update({assigned_to:assigned,proposed_start:proposed?new Date(proposed).toISOString():null}).eq('id',id).then(({error})=>message(error?error.message:'Viewing assignment saved.'));}const verificationDocument=target.closest<HTMLElement>('[data-verification-document]');if(verificationDocument)void openVerificationDocument(verificationDocument.dataset.verificationDocument!).catch((error)=>message(error.message));const saveVerificationButton=target.closest<HTMLElement>('[data-save-verification]');if(saveVerificationButton)void saveVerification(saveVerificationButton.dataset.saveVerification!).catch((error)=>message(error.message));const contentTab=target.closest<HTMLElement>('[data-content]');if(contentTab)void loadContent(contentTab.dataset.content as ContentKind);const editCms=target.closest<HTMLElement>('[data-edit-content]');if(editCms)void editContent(editCms.dataset.editContent!).catch((error)=>message(error.message));const toggle=target.closest<HTMLElement>('[data-toggle-content]');if(toggle){const[kind,id,published]=toggle.dataset.toggleContent!.split(':') as [ContentKind,string,string];const config=contentConfig[kind];void client.from(kind).update({[config.published]:published==='true'}).eq('id',id).then(()=>loadContent(kind));}});
document.addEventListener('change',(event)=>{const target=event.target as HTMLSelectElement;if(target.dataset.enquiryStatus)void client.from('enquiries').update({status:target.value}).eq('id',target.dataset.enquiryStatus).then(()=>message('Enquiry status updated.'));if(target.dataset.appointmentStatus)void client.from('viewing_appointments').update({status:target.value}).eq('id',target.dataset.appointmentStatus).then(({error})=>{message(error?error.message:'Viewing status updated.');if(error)void loadAppointments();});});
document.querySelector('#staff-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const data=new FormData(event.currentTarget as HTMLFormElement);const{error}=await client.rpc('set_staff_role',{target_user:data.get('user_id'),target_role:data.get('role'),active:data.get('active')==='on'});message(error?error.message:'Staff access updated.');if(!error)await loadStaff();});
document.querySelector('#new-content')?.addEventListener('click',configureContentForm);document.querySelector('#cancel-content')?.addEventListener('click',()=>{document.querySelector<HTMLFormElement>('#content-form')!.hidden=true;});document.querySelector('#content-form')?.addEventListener('submit',(event)=>{event.preventDefault();void saveContent(event.currentTarget as HTMLFormElement).catch((error)=>message(error.message));});
document.querySelector('#verification-form')?.addEventListener('submit',(event)=>{event.preventDefault();void submitVerification(event.currentTarget as HTMLFormElement).catch((error)=>message(error.message));});

await requireStaff(); await Promise.all([loadDashboard(),loadProperties(),loadEnquiries()]);
