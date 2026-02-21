export type Urgency = 'low' | 'medium' | 'high' | 'cannot_proceed';
export type VariationStatus = 'pending' | 'approved' | 'declined' | 'edited';

export interface Variation {
  id: string;
  shortcode: string;
  supervisor_name: string;
  site_name: string;
  site_address: string;
  client_email: string;
  description: string;
  urgency: Urgency;
  status: VariationStatus;
  submitted_at: string;
  submitted_ip: string | null;
  approval_ip: string | null;
  approval_timestamp: string | null;
  edit_timestamp: string | null;
  edit_notes: string | null;
  edit_ip: string | null;
}

export interface VariationImage {
  id: string;
  variation_id: string;
  image_path: string;
  created_at: string;
}
