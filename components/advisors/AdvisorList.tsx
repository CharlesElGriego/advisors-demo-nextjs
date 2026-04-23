'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAdvisorAvailability } from '@/hooks/useAdvisorAvailability';
import {
  createAvailabilityMap,
  fetchAdvisors
} from '@/services/advisors.service';
import type { Advisor, AdvisorAction } from '@/types/advisor';

import AdvisorCard from './AdvisorCard';
import AdvisorCardSkeleton from './AdvisorCardSkeleton';
import styles from './AdvisorList.module.scss';
const SKELETON_CARD_COUNT = 6;
const LIST_LOADING_LABEL = 'Loading advisors';
const LIST_EMPTY_TITLE = 'No advisors available';
const LIST_EMPTY_DESCRIPTION = 'Please check again later.';
const LIST_ERROR_TITLE = 'Unable to load advisors';
const LIST_ERROR_DESCRIPTION = 'Please try again.';
const RETRY_BUTTON_LABEL = 'Try again';

const getActionFeedbackMessage = (
  advisorName: string,
  action: AdvisorAction
): string =>
  action === 'call'
    ? `Started a call with ${advisorName}.`
    : `Started a chat with ${advisorName}.`;
const getErrorMessage = (): string => LIST_ERROR_DESCRIPTION;

export default function AdvisorList() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestKey, setRequestKey] = useState<number>(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadAdvisors = async (): Promise<void> => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextAdvisors = await fetchAdvisors({
          signal: controller.signal
        });

        if (!isMounted) {
          return;
        }

        setAdvisors(nextAdvisors);
      } catch {
        if (!isMounted || controller.signal.aborted) {
          return;
        }

        setAdvisors([]);
        setErrorMessage(getErrorMessage());
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadAdvisors();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [requestKey]);

  const advisorAvailabilityDescriptors = useMemo(
    () =>
      advisors.map(({ id, availabilityId, availability }) => ({
        id,
        availabilityId,
        availability
      })),
    [advisors]
  );
  const initialAvailabilityMap = useMemo(
    () => createAvailabilityMap(advisors),
    [advisors]
  );
  const availabilityMap = useAdvisorAvailability(
    advisorAvailabilityDescriptors,
    initialAvailabilityMap
  );
  const skeletonCardKeys = useMemo(
    () => Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => index),
    []
  );

  const handleRetry = useCallback(() => {
    setRequestKey((currentKey) => currentKey + 1);
  }, []);

  const handleAction = useCallback(
    (advisorName: string, action: AdvisorAction) => {
      setFeedbackMessage(getActionFeedbackMessage(advisorName, action));
    },
    []
  );

  return (
    <section
      className={styles['advisor-list']}
      aria-labelledby="advisor-list-heading"
    >
      <h2 id="advisor-list-heading" className={styles['advisor-list__sr-only']}>
        Advisor listings
      </h2>

      {feedbackMessage ? (
        <div
          className={styles['advisor-list__feedback']}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-testid="advisor-feedback"
        >
          {feedbackMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div
          className={styles['advisor-list__grid']}
          aria-label={LIST_LOADING_LABEL}
          aria-busy="true"
          data-testid="advisor-skeleton-grid"
        >
          {skeletonCardKeys.map((key) => (
            <AdvisorCardSkeleton key={key} />
          ))}
        </div>
      ) : null}

      {!isLoading && errorMessage ? (
        <div className={styles['advisor-list__state']} role="alert">
          <h3 className={styles['advisor-list__state-title']}>
            {LIST_ERROR_TITLE}
          </h3>
          <p className={styles['advisor-list__state-description']}>
            {errorMessage || LIST_ERROR_DESCRIPTION}
          </p>
          <button
            type="button"
            className={styles['advisor-list__retry-button']}
            onClick={handleRetry}
          >
            {RETRY_BUTTON_LABEL}
          </button>
        </div>
      ) : null}

      {!isLoading && !errorMessage && advisors.length === 0 ? (
        <div className={styles['advisor-list__state']}>
          <h3 className={styles['advisor-list__state-title']}>
            {LIST_EMPTY_TITLE}
          </h3>
          <p className={styles['advisor-list__state-description']}>
            {LIST_EMPTY_DESCRIPTION}
          </p>
        </div>
      ) : null}

      {!isLoading && !errorMessage && advisors.length > 0 ? (
        <ul
          className={styles['advisor-list__grid']}
          role="list"
          data-testid="advisor-grid"
        >
          {advisors.map((advisor) => (
            <AdvisorCard
              key={advisor.id}
              advisor={advisor}
              availability={availabilityMap[advisor.id] ?? advisor.availability}
              onAction={handleAction}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
