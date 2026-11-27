export type StaffRole = 'agent' | 'editor' | 'admin';
export type ListingReviewStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'published';

const transitions: Record<StaffRole, Partial<Record<ListingReviewStatus, ListingReviewStatus[]>>> = {
  agent: {
    draft: ['submitted'],
    changes_requested: ['submitted'],
  },
  editor: {
    submitted: ['under_review'],
    changes_requested: ['under_review'],
  },
  admin: {
    submitted: ['under_review', 'approved', 'changes_requested', 'rejected'],
    under_review: ['approved', 'changes_requested', 'rejected'],
    changes_requested: ['under_review', 'rejected'],
    approved: ['published', 'changes_requested'],
    published: ['changes_requested'],
  },
};

export function canTransitionListing(
  role: StaffRole,
  current: ListingReviewStatus,
  next: ListingReviewStatus,
): boolean {
  return current === next || Boolean(transitions[role][current]?.includes(next));
}

export interface PropertyDraftInput {
  reference: string;
  title: string;
  slug: string;
  listingType: string;
  propertyTypeId: string;
  locationId: string;
  price: number | null;
  currency: string;
  description: string;
}

export function validatePropertyDraft(input: PropertyDraftInput): void {
  const complete = input.reference.trim().length >= 3
    && input.title.trim().length >= 5
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)
    && ['sale', 'rent', 'investment'].includes(input.listingType)
    && Boolean(input.propertyTypeId)
    && Boolean(input.locationId)
    && (input.price === null || Number.isFinite(input.price) && input.price >= 0)
    && /^[A-Z]{3}$/.test(input.currency)
    && input.description.trim().length >= 20;
  if (!complete) throw new Error('Complete the required property details before saving.');
}

export function normalizeImageOrder(images: Array<{ id: string; isPrimary: boolean }>) {
  const selectedPrimary = images.findIndex(image => image.isPrimary);
  const primaryIndex = selectedPrimary < 0 && images.length ? 0 : selectedPrimary;
  return images.map((image, position) => ({
    id: image.id,
    position,
    isPrimary: position === primaryIndex,
  }));
}
