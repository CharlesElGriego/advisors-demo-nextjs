export type AvailabilityStatus = 'online' | 'offline';
export type AdvisorAction = 'call' | 'chat';

export interface Availability {
  call: AvailabilityStatus;
  chat: AvailabilityStatus;
}
/**
 * Normalized advisor model consumed by the UI.
 *
 * The external listings source may repeat advisor ids, so `id` is always kept
 * unique for React rendering while `availabilityId` preserves the upstream id
 * used to poll live availability.
 */

export interface Advisor {
  id: number;
  /** Upstream identifier used when requesting live availability updates. */
  availabilityId: number;
  name: string;
  pricePerMinute: number;
  specialty: string;
  bio: string;
  experienceYears: number | null;
  avatarUrl: string | null;
  availability: Availability;
}

export type AvailabilityMap = Record<number, Availability>;
