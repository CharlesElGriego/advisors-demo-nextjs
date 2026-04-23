import type { Advisor, Availability } from '@/types/advisor';

const pollIntervalOverride = Number.parseInt(
  process.env.NEXT_PUBLIC_AVAILABILITY_POLLING_INTERVAL_MS ?? '30000',
  10
);

export const LISTINGS_ENDPOINT =
  'https://mp30dcc6efca114e1b21.free.beeceptor.com/advisor-listings';
export const AVAILABILITY_ENDPOINT =
  'https://mp30dcc6efca114e1b21.free.beeceptor.com/advisor-availability';
export const AVAILABILITY_POLLING_INTERVAL_MS = Number.isFinite(
  pollIntervalOverride
)
  ? Math.max(pollIntervalOverride, 100)
  : 30000;
export const ENABLE_API_FALLBACK =
  process.env.NEXT_PUBLIC_ENABLE_API_FALLBACK !== 'false';

export const DEFAULT_AVAILABILITY: Availability = {
  call: 'offline',
  chat: 'offline'
};

export const FALLBACK_ADVISORS: Advisor[] = [
  {
    id: 1,
    availabilityId: 1,
    name: 'Advisor Laura',
    pricePerMinute: 4.99,
    specialty: 'Love & relationships',
    bio: 'Empathetic readings with practical next steps for relationships, family, and emotional clarity.',
    experienceYears: 8,
    avatarUrl:
      'https://si.keen.com/memberphotos/-5253289-1156765229Primary.jpg',
    availability: {
      call: 'online',
      chat: 'offline'
    }
  },
  {
    id: 2,
    availabilityId: 2,
    name: 'Miss Elisabeth',
    pricePerMinute: 7.99,
    specialty: 'Career & purpose',
    bio: 'Straightforward guidance focused on confidence, decisions, and navigating major work transitions.',
    experienceYears: 12,
    avatarUrl:
      'https://si.keen.com/memberphotos/-54149795-980884913Primary.jpg',
    availability: {
      call: 'online',
      chat: 'offline'
    }
  },
  {
    id: 3,
    availabilityId: 3,
    name: 'Advisor Jada',
    pricePerMinute: 2.49,
    specialty: 'Energy & intuition',
    bio: 'Calm, supportive sessions designed to help you reconnect with intuition and reduce uncertainty.',
    experienceYears: 6,
    avatarUrl:
      'https://si.keen.com/memberphotos/-24651289-1547364832Primary.jpg',
    availability: {
      call: 'online',
      chat: 'offline'
    }
  },
  {
    id: 4,
    availabilityId: 3,
    name: 'RexFrederick',
    pricePerMinute: 4.25,
    specialty: 'Life path coaching',
    bio: 'Action-oriented advice blending reflection and accountability for personal growth and momentum.',
    experienceYears: 10,
    avatarUrl:
      'https://si.keen.com/memberphotos/-24651289-1547364832Primary.jpg',
    availability: {
      call: 'online',
      chat: 'online'
    }
  }
];
