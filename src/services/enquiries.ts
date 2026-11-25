import { requireSupabase } from '../supabase';
import { enquirySchema, viewingRequestSchema } from '../validation';
import type { EnquiryInput, ViewingRequestInput } from '../types';

export async function submitEnquiry(input: EnquiryInput): Promise<{ id: string }> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid enquiry.');
  const { data, error } = await requireSupabase().functions.invoke('submit-enquiry', { body: parsed.data });
  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error(data?.error?.message ?? 'The enquiry could not be submitted.');
  return { id: data.id };
}

export async function submitViewingRequest(input: ViewingRequestInput): Promise<{ id: string; status: string }> {
  const parsed = viewingRequestSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid viewing request.');
  const { data, error } = await requireSupabase().functions.invoke('submit-viewing', { body: parsed.data });
  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error(data?.error?.message ?? 'The viewing request could not be submitted.');
  return { id: data.id, status: data.status };
}
