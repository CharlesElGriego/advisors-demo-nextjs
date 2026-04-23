import {
  AVAILABILITY_ENDPOINT,
  DEFAULT_AVAILABILITY,
  ENABLE_API_FALLBACK,
  FALLBACK_ADVISORS,
  LISTINGS_ENDPOINT
} from '@/constants/advisors';
import type {
  Advisor,
  Availability,
  AvailabilityMap,
  AvailabilityStatus
} from '@/types/advisor';

interface FetchOptions {
  signal?: AbortSignal;
  fallbackOnError?: boolean;
  fallbackAvailability?: Availability;
}

interface RecordValue {
  [key: string]: unknown;
}

interface AdvisorCandidate extends Omit<Advisor, 'id'> {
  rawId: number;
}

const availabilityKeywords: Record<string, AvailabilityStatus> = {
  available: 'online',
  callnow: 'online',
  chatnow: 'online',
  later: 'offline',
  offline: 'offline',
  online: 'online',
  unavailable: 'offline'
};

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const getValue = (record: RecordValue, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
};

const getString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (isNonEmptyString(value)) {
      return value.trim();
    }
  }

  return null;
};

const getNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const normalizedValue = Number.parseFloat(value.replace(/[^\d.]+/g, ''));

      if (Number.isFinite(normalizedValue)) {
        return normalizedValue;
      }
    }
  }

  return null;
};

const normalizeAvailabilityStatus = (
  value: unknown
): AvailabilityStatus | null => {
  if (typeof value === 'boolean') {
    return value ? 'online' : 'offline';
  }

  if (typeof value === 'number') {
    return value > 0 ? 'online' : 'offline';
  }

  if (typeof value === 'string') {
    const normalizedValue = value.replace(/\s+/g, '').toLowerCase();

    if (normalizedValue in availabilityKeywords) {
      return availabilityKeywords[normalizedValue];
    }

    if (
      normalizedValue.includes('online') ||
      normalizedValue.includes('available')
    ) {
      return 'online';
    }

    if (
      normalizedValue.includes('offline') ||
      normalizedValue.includes('later')
    ) {
      return 'offline';
    }
  }

  return null;
};

const normalizeAvailability = (value: unknown): Availability | null => {
  if (!isRecord(value)) {
    return null;
  }

  const callStatus = normalizeAvailabilityStatus(
    getValue(
      value,
      'callAvailability',
      'call-availability',
      'call',
      'callStatus',
      'canCall',
      'isCallAvailable'
    )
  );
  const chatStatus = normalizeAvailabilityStatus(
    getValue(
      value,
      'chatAvailability',
      'chat-availability',
      'chat',
      'chatStatus',
      'canChat',
      'isChatAvailable'
    )
  );

  if (!callStatus || !chatStatus) {
    return null;
  }

  return {
    call: callStatus,
    chat: chatStatus
  };
};

const getAdvisorCollection = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [
    payload.data,
    payload.advisors,
    payload.results,
    payload.items
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const normalizeAdvisor = (value: unknown): AdvisorCandidate | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getNumber(getValue(value, 'id', 'advisorId', 'identifier'));
  const name = getString(getValue(value, 'name', 'displayName', 'fullName'));
  const pricePerMinute = getNumber(
    getValue(value, 'pricePerMinute', 'price', 'pricePerMin', 'ratePerMinute')
  );

  if (id === null || !name || pricePerMinute === null) {
    return null;
  }

  return {
    rawId: id,
    availabilityId: id,
    name,
    pricePerMinute,
    specialty:
      getString(
        getValue(value, 'specialty', 'headline', 'category', 'topic')
      ) ?? 'Trusted advisor',
    bio:
      getString(getValue(value, 'bio', 'description', 'summary', 'about')) ??
      'Professional guidance with a thoughtful, supportive approach.',
    experienceYears: getNumber(
      getValue(value, 'experienceYears', 'yearsOfExperience', 'experience')
    ),
    avatarUrl: getString(
      getValue(
        value,
        'avatarUrl',
        'avatar',
        'imageUrl',
        'photo',
        'profilePictureUrl'
      )
    ),
    availability:
      normalizeAvailability(
        getValue(value, 'availability', 'status') ?? value
      ) ?? DEFAULT_AVAILABILITY
  };
};

const normalizeAdvisorCollection = (payload: unknown): Advisor[] => {
  const usedIds = new Set<number>();

  return getAdvisorCollection(payload)
    .map((entry) => normalizeAdvisor(entry))
    .filter((entry): entry is AdvisorCandidate => entry !== null)
    .map(({ rawId, ...advisor }) => {
      let uniqueId = rawId;

      while (usedIds.has(uniqueId)) {
        uniqueId += 1;
      }

      usedIds.add(uniqueId);

      return {
        id: uniqueId,
        ...advisor
      };
    });
};

const normalizeAvailabilityPayload = (
  payload: unknown
): Availability | null => {
  if (Array.isArray(payload)) {
    return (
      payload
        .map((entry) => normalizeAvailability(entry))
        .find((entry): entry is Availability => entry !== null) ?? null
    );
  }

  return normalizeAvailability(payload);
};

const createServiceError = (message: string): Error => new Error(message);

/**
 * Creates an availability lookup keyed by the UI-safe advisor id so list items
 * can be updated without reshaping the advisor collection.
 */
export const createAvailabilityMap = (advisors: Advisor[]): AvailabilityMap =>
  advisors.reduce<AvailabilityMap>((availabilityMap, advisor) => {
    availabilityMap[advisor.id] = advisor.availability;

    return availabilityMap;
  }, {});

export const isAvailabilityEqual = (
  previous: Availability,
  next: Availability
): boolean => previous.call === next.call && previous.chat === next.chat;
/**
 * Fetches and normalizes the advisor listings payload into the UI contract.
 *
 * The returned advisors always have a unique `id` for rendering. When the
 * upstream payload repeats ids, the original remote identifier is preserved in
 * `availabilityId` so live polling still targets the correct endpoint.
 */

export const fetchAdvisors = async ({
  signal,
  fallbackOnError = ENABLE_API_FALLBACK
}: FetchOptions = {}): Promise<Advisor[]> => {
  try {
    const response = await fetch(LISTINGS_ENDPOINT, {
      cache: 'no-store',
      signal
    });

    if (!response.ok) {
      throw createServiceError('Advisor listings request failed.');
    }

    const payload: unknown = await response.json();
    const advisors = normalizeAdvisorCollection(payload);

    if (advisors.length === 0) {
      throw createServiceError('Advisor listings payload was empty.');
    }

    return advisors;
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    if (fallbackOnError) {
      return FALLBACK_ADVISORS;
    }

    throw createServiceError('Unable to load advisor listings.');
  }
};
/**
 * Fetches the latest call/chat availability for a single upstream advisor id.
 *
 * When fallback handling is enabled, invalid or unavailable API responses fall
 * back to the last known availability for that advisor instead of breaking the
 * polling loop.
 */

export const fetchAdvisorAvailability = async (
  advisorId: number,
  {
    signal,
    fallbackOnError = ENABLE_API_FALLBACK,
    fallbackAvailability
  }: FetchOptions = {}
): Promise<Availability> => {
  try {
    const availabilityUrl = new URL(AVAILABILITY_ENDPOINT);
    availabilityUrl.searchParams.set('id', String(advisorId));

    const response = await fetch(availabilityUrl.toString(), {
      cache: 'no-store',
      signal
    });

    if (!response.ok) {
      throw createServiceError('Advisor availability request failed.');
    }

    const payload: unknown = await response.json();
    const availability = normalizeAvailabilityPayload(payload);

    if (!availability) {
      throw createServiceError('Advisor availability payload was invalid.');
    }

    return availability;
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    if (fallbackOnError) {
      return fallbackAvailability ?? DEFAULT_AVAILABILITY;
    }

    throw createServiceError('Unable to load advisor availability.');
  }
};
