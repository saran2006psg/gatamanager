export type OrnamentType =
  | 'Ring'
  | 'Necklace'
  | 'Bracelet'
  | 'Earrings'
  | 'Pendant'
  | 'Chain'
  | 'Anklet'
  | 'Other';

export type FailureCondition =
  | 'normal'
  | 'bad_lighting'
  | 'bright_lighting'
  | 'odd_angle'
  | 'occlusion'
  | 'clutter'
  | 'motion_blur'
  | 'reflection'
  | 'hand_wrist'
  | 'distance';

export type Product = {
  id?: string;
  product_id: string;
  product_name?: string | null;
  ornament_type: OrnamentType;
  original_image_path: string;
  created_at?: string;
};

export type TestImage = {
  id?: string;
  product_id: string;
  image_path: string;
  failure_condition: FailureCondition;
  notes?: string | null;
  created_at?: string;
};

export type ProductRecord = Product & {
  test_images_count?: number;
  completed_conditions?: number;
};

export const FAILURE_CONDITION_OPTIONS = [
  { value: 'normal', label: 'Normal', description: 'Clear photo with good lighting' },
  { value: 'bad_lighting', label: 'Bad Lighting', description: 'Dark room / low light' },
  { value: 'bright_lighting', label: 'Bright Lighting', description: 'Strong light / overexposure' },
  { value: 'odd_angle', label: 'Odd Angle', description: 'Jewellery viewed from an unusual/side angle' },
  { value: 'occlusion', label: 'Occlusion', description: 'Part of the jewellery is covered' },
  { value: 'clutter', label: 'Clutter', description: 'Jewellery surrounded by unrelated objects' },
  { value: 'motion_blur', label: 'Motion Blur', description: 'Slight camera or subject movement' },
  { value: 'reflection', label: 'Reflection', description: 'Strong reflection from glass/metal/light' },
  { value: 'hand_wrist', label: 'Hand/Wrist', description: 'Jewellery being held or worn' },
  { value: 'distance', label: 'Distance', description: 'Jewellery photographed from farther away' },
] as const;

export const ORNAMENT_TYPES: OrnamentType[] = ['Ring', 'Necklace', 'Bracelet', 'Earrings', 'Pendant', 'Chain', 'Anklet', 'Other'];
