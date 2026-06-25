export type BookingType = 'record_hourly' | 'record_forfait' | 'location' | 'mix_mastering';
export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export interface Booking {
  _id: string;
  artist: any;
  validatedBy?: any;
  type: BookingType;
  date: string;
  startTime: string;
  endTime?: string;
  duration: number;
  pricePerUnit: number;
  totalPrice: number;
  unit: string;
  status: BookingStatus;
  rejectionReason?: string;
  participants: number;
  musicalGenre?: string;
  notes?: string;
  project?: any;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingPayload {
  type: BookingType;
  date: string;
  startTime: string;
  duration: number;
  participants?: number;
  musicalGenre?: string;
  notes?: string;
}

export interface PricingInfo {
  label: string;
  unit: string;
  price: number;
}
