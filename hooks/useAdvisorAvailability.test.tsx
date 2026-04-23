import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAdvisorAvailability } from './useAdvisorAvailability';

const fetchAdvisorAvailabilityMock = vi.fn();

vi.mock('@/constants/advisors', () => ({
  AVAILABILITY_POLLING_INTERVAL_MS: 30000
}));

vi.mock('@/services/advisors.service', () => ({
  fetchAdvisorAvailability: (...args: unknown[]) =>
    fetchAdvisorAvailabilityMock(...args),
  isAvailabilityEqual: (
    previous: { call: string; chat: string },
    next: { call: string; chat: string }
  ) => previous.call === next.call && previous.chat === next.chat
}));

describe('useAdvisorAvailability', () => {
  afterEach(() => {
    cleanup();
    fetchAdvisorAvailabilityMock.mockReset();
  });

  it('deduplicates polling requests for advisors that share the same availability id', async () => {
    fetchAdvisorAvailabilityMock.mockResolvedValue({
      call: 'online',
      chat: 'offline'
    });

    renderHook(
      () =>
        useAdvisorAvailability(
          [
            {
              id: 3,
              availabilityId: 3,
              availability: {
                call: 'online',
                chat: 'offline'
              }
            },
            {
              id: 4,
              availabilityId: 3,
              availability: {
                call: 'online',
                chat: 'online'
              }
            }
          ],
          {
            3: {
              call: 'online',
              chat: 'offline'
            },
            4: {
              call: 'online',
              chat: 'online'
            }
          }
        ),
      {
        reactStrictMode: false
      }
    );

    await waitFor(() => {
      expect(fetchAdvisorAvailabilityMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchAdvisorAvailabilityMock).toHaveBeenCalledWith(3, {
      fallbackOnError: false,
      signal: expect.any(AbortSignal)
    });
  });

  it('keeps each advisor previous availability when a shared request fails', async () => {
    fetchAdvisorAvailabilityMock.mockRejectedValue(new Error('429'));

    const { result } = renderHook(
      () =>
        useAdvisorAvailability(
          [
            {
              id: 3,
              availabilityId: 3,
              availability: {
                call: 'online',
                chat: 'offline'
              }
            },
            {
              id: 4,
              availabilityId: 3,
              availability: {
                call: 'online',
                chat: 'online'
              }
            }
          ],
          {
            3: {
              call: 'online',
              chat: 'offline'
            },
            4: {
              call: 'online',
              chat: 'online'
            }
          }
        ),
      {
        reactStrictMode: false
      }
    );

    await waitFor(() => {
      expect(fetchAdvisorAvailabilityMock).toHaveBeenCalledTimes(1);
    });

    expect(result.current).toEqual({
      3: {
        call: 'online',
        chat: 'offline'
      },
      4: {
        call: 'online',
        chat: 'online'
      }
    });
  });
});
