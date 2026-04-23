import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FALLBACK_ADVISORS } from '@/constants/advisors';

import {
  createAvailabilityMap,
  fetchAdvisorAvailability,
  fetchAdvisors,
  isAvailabilityEqual
} from './advisors.service';

const createJsonResponse = (
  payload: unknown,
  init: ResponseInit = {}
): Response =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    ...init
  });

describe('advisors.service', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('normalizes advisor listings from Beeceptor field names', async () => {
    fetchMock.mockResolvedValue(
      createJsonResponse({
        data: [
          {
            id: 200,
            displayName: 'Reader Ray',
            price: '$6.50/min',
            headline: 'Career guidance',
            about: 'Helps with transitions.',
            yearsOfExperience: '7',
            profilePictureUrl: 'https://example.com/ray.png',
            'call-availability': 1,
            'chat-availability': 0
          }
        ]
      })
    );

    await expect(fetchAdvisors({ fallbackOnError: false })).resolves.toEqual([
      {
        id: 200,
        availabilityId: 200,
        name: 'Reader Ray',
        pricePerMinute: 6.5,
        specialty: 'Career guidance',
        bio: 'Helps with transitions.',
        experienceYears: 7,
        avatarUrl: 'https://example.com/ray.png',
        availability: {
          call: 'online',
          chat: 'offline'
        }
      }
    ]);
  });

  it('deduplicates repeated listing ids while preserving the polling id', async () => {
    fetchMock.mockResolvedValue(
      createJsonResponse({
        data: [
          {
            id: 3,
            name: 'Advisor Jada',
            price: '$2.49/min',
            'call-availability': 1,
            'chat-availability': 0
          },
          {
            id: 3,
            name: 'RexFrederick',
            price: '$4.25/min',
            'call-availability': 1,
            'chat-availability': 1
          }
        ]
      })
    );

    await expect(fetchAdvisors({ fallbackOnError: false })).resolves.toEqual([
      {
        id: 3,
        availabilityId: 3,
        name: 'Advisor Jada',
        pricePerMinute: 2.49,
        specialty: 'Trusted advisor',
        bio: 'Professional guidance with a thoughtful, supportive approach.',
        experienceYears: null,
        avatarUrl: null,
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
        specialty: 'Trusted advisor',
        bio: 'Professional guidance with a thoughtful, supportive approach.',
        experienceYears: null,
        avatarUrl: null,
        availability: {
          call: 'online',
          chat: 'online'
        }
      }
    ]);
  });

  it('returns fallback advisors when listings fetch fails and fallback is enabled', async () => {
    fetchMock.mockRejectedValue(new Error('Network unavailable'));

    await expect(fetchAdvisors()).resolves.toEqual(FALLBACK_ADVISORS);
  });

  it('throws a user-friendly listings error when fallback is disabled', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    await expect(
      fetchAdvisors({ fallbackOnError: false })
    ).rejects.toThrowError('Unable to load advisor listings.');
  });

  it('normalizes advisor availability from Beeceptor payloads', async () => {
    fetchMock.mockResolvedValue(
      createJsonResponse({
        id: 100,
        'call-availability': 0,
        'chat-availability': 1
      })
    );

    await expect(
      fetchAdvisorAvailability(100, { fallbackOnError: false })
    ).resolves.toEqual({
      call: 'offline',
      chat: 'online'
    });
  });

  it('keeps the advisor fallback availability when Beeceptor returns placeholder text', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        'Hey ya! Great to see you here. Btw, nothing is configured for this request path. Create a rule and start building a mock API.',
        {
          status: 200,
          headers: {
            'Content-Type': 'text/plain'
          }
        }
      )
    );

    await expect(
      fetchAdvisorAvailability(3, {
        fallbackAvailability: {
          call: 'online',
          chat: 'offline'
        }
      })
    ).resolves.toEqual({
      call: 'online',
      chat: 'offline'
    });
  });

  it('creates availability maps and compares availability objects efficiently', () => {
    const availabilityMap = createAvailabilityMap(
      FALLBACK_ADVISORS.slice(0, 2)
    );

    expect(availabilityMap[1]).toEqual(FALLBACK_ADVISORS[0].availability);
    expect(availabilityMap[2]).toEqual(FALLBACK_ADVISORS[1].availability);
    expect(
      isAvailabilityEqual(
        { call: 'online', chat: 'offline' },
        { call: 'online', chat: 'offline' }
      )
    ).toBe(true);
    expect(
      isAvailabilityEqual(
        { call: 'online', chat: 'offline' },
        { call: 'offline', chat: 'offline' }
      )
    ).toBe(false);
  });
});
