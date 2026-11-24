import { requireSupabase } from '../supabase';
import { enquirySchema } from '../validation';
import type { EnquiryInput } from '../types';

export async function submitEnquiry(input: EnquiryInput): Promise<{ id: string }> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid enquiry.');
  const { data, error } = await requireSupabase().functions.invoke('submit-enquiry', { body: parsed.data });
  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error(data?.error?.message ?? 'The enquiry could not be submitted.');
  return { id: data.id };
}
