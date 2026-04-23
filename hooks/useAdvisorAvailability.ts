'use client';

import { useEffect, useMemo, useState } from 'react';

import { AVAILABILITY_POLLING_INTERVAL_MS } from '@/constants/advisors';
import {
  fetchAdvisorAvailability,
  isAvailabilityEqual
} from '@/services/advisors.service';
import type { Advisor, Availability, AvailabilityMap } from '@/types/advisor';

type AvailabilityTrackedAdvisor = Pick<
  Advisor,
  'id' | 'availabilityId' | 'availability'
>;
/**
 * Polls live advisor availability and returns a map keyed by the UI-safe
 * advisor id.
 *
 * Requests are deduplicated by `availabilityId` so cards that share the same
 * upstream availability source do not trigger duplicate network calls. If a
 * polling request fails, the hook preserves the previous availability for the
 * affected advisor cards.
 */

export const useAdvisorAvailability = (
  advisors: AvailabilityTrackedAdvisor[],
  initialAvailabilityMap: AvailabilityMap
): AvailabilityMap => {
  const [availabilityMap, setAvailabilityMap] = useState<AvailabilityMap>(
    initialAvailabilityMap
  );
  const advisorsKey = useMemo(
    () =>
      advisors
        .map(
          (advisor) =>
            `${advisor.id}:${advisor.availabilityId}:${advisor.availability.call}:${advisor.availability.chat}`
        )
        .join(','),
    [advisors]
  );

  useEffect(() => {
    setAvailabilityMap(initialAvailabilityMap);
  }, [initialAvailabilityMap]);

  useEffect(() => {
    if (advisors.length === 0) {
      return undefined;
    }

    let isMounted = true;
    const activeControllers = new Set<AbortController>();

    const pollAvailability = async (): Promise<void> => {
      const uniqueAvailabilityIds = [
        ...new Set(advisors.map(({ availabilityId }) => availabilityId))
      ];
      const requestByAvailabilityId = new Map<number, Promise<Availability>>();

      uniqueAvailabilityIds.forEach((availabilityId) => {
        const controller = new AbortController();
        activeControllers.add(controller);

        requestByAvailabilityId.set(
          availabilityId,
          fetchAdvisorAvailability(availabilityId, {
            fallbackOnError: false,
            signal: controller.signal
          }).finally(() => {
            activeControllers.delete(controller);
          })
        );
      });

      const results = await Promise.allSettled(
        uniqueAvailabilityIds.map(
          (availabilityId) => requestByAvailabilityId.get(availabilityId)!
        )
      );
      const resultByAvailabilityId = new Map<
        number,
        PromiseSettledResult<Availability>
      >(
        uniqueAvailabilityIds.map((availabilityId, index) => [
          availabilityId,
          results[index]
        ])
      );

      if (!isMounted) {
        return;
      }

      setAvailabilityMap((previousAvailabilityMap) => {
        let hasChanges = false;
        const nextAvailabilityMap = { ...previousAvailabilityMap };

        advisors.forEach((advisor) => {
          const result = resultByAvailabilityId.get(advisor.availabilityId);
          const previousAvailability =
            previousAvailabilityMap[advisor.id] ?? advisor.availability;
          const nextAvailability =
            result?.status === 'fulfilled'
              ? result.value
              : previousAvailability;

          if (!isAvailabilityEqual(previousAvailability, nextAvailability)) {
            nextAvailabilityMap[advisor.id] = nextAvailability;
            hasChanges = true;
          }
        });

        return hasChanges ? nextAvailabilityMap : previousAvailabilityMap;
      });
    };

    void pollAvailability();
    const intervalId = globalThis.setInterval(
      () => void pollAvailability(),
      AVAILABILITY_POLLING_INTERVAL_MS
    );

    return () => {
      isMounted = false;
      globalThis.clearInterval(intervalId);
      activeControllers.forEach((controller) => controller.abort());
    };
  }, [advisors, advisorsKey]);

  return availabilityMap;
};
