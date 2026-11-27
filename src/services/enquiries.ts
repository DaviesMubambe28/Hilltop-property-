import { requireSupabase } from '../supabase';
import { enquirySchema, viewingRequestSchema } from '../validation';
import type { EnquiryInput, ViewingRequestInput } from '../types';
import { parseLeadResponse } from '../lead-submission';

export async function submitEnquiry(input: EnquiryInput): Promise<{ id: string }> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid enquiry.');
  const { data, error } = await requireSupabase().functions.invoke('submit-enquiry', { body: parsed.data });
  if (error && data?.error?.message) throw new Error(String(data.error.message));
  if (error) throw new Error(error.message.includes('non-2xx')
    ? 'The service could not confirm this submission. Please wait and retry, or contact Hilltop.'
    : error.message);
  return parseLeadResponse(data);
}

export async function submitViewingRequest(input: ViewingRequestInput): Promise<{ id: string; status: string }> {
  const parsed = viewingRequestSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid viewing request.');
  const { data, error } = await requireSupabase().functions.invoke('submit-viewing', { body: parsed.data });
  if (error && data?.error?.message) throw new Error(String(data.error.message));
  if (error) throw new Error(error.message.includes('non-2xx')
    ? 'The viewing service could not confirm this request. Please wait and retry, or contact Hilltop.'
    : error.message);
  const result = parseLeadResponse(data);
  return { id: result.id, status: result.status ?? 'requested' };
}
