import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { Advisor, AdvisorAction, Availability } from '@/types/advisor';

import styles from './AdvisorCard.module.scss';

interface AdvisorCardProps {
  advisor: Advisor;
  availability: Availability;
  onAction: (advisorName: string, action: AdvisorAction) => void;
}

interface ActionButtonConfiguration {
  action: AdvisorAction;
  label: string;
  ariaLabel: string;
  disabled: boolean;
  modifierClassName: string;
}

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .map((segment) => segment[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

const getPriceLabel = (pricePerMinute: number): string =>
  `${priceFormatter.format(pricePerMinute)}/min`;

const getExperienceLabel = (experienceYears: number | null): string =>
  experienceYears
    ? `${experienceYears}+ years experience`
    : 'New advisor profile';

const createActionButtonConfigurations = (
  advisorName: string,
  availability: Availability
): ActionButtonConfiguration[] => [
  {
    action: 'call',
    label: availability.call === 'online' ? 'CALL NOW' : 'CALL LATER',
    ariaLabel:
      availability.call === 'online'
        ? `Call ${advisorName} now`
        : `Call ${advisorName} later`,
    disabled: availability.call !== 'online',
    modifierClassName: styles['advisor-card__button--call']
  },
  {
    action: 'chat',
    label: availability.chat === 'online' ? 'CHAT NOW' : 'CHAT LATER',
    ariaLabel:
      availability.chat === 'online'
        ? `Chat with ${advisorName} now`
        : `Chat with ${advisorName} later`,
    disabled: availability.chat !== 'online',
    modifierClassName: styles['advisor-card__button--chat']
  }
];

const getButtonClassName = (
  modifierClassName: string,
  disabled: boolean
): string =>
  [
    styles['advisor-card__button'],
    modifierClassName,
    disabled ? styles['advisor-card__button--disabled'] : ''
  ]
    .filter(Boolean)
    .join(' ');

export default function AdvisorCard({
  advisor,
  availability,
  onAction
}: Readonly<AdvisorCardProps>) {
  const [hasImageError, setHasImageError] = useState<boolean>(false);

  useEffect(() => {
    setHasImageError(false);
  }, [advisor.avatarUrl]);
  const actionButtons = createActionButtonConfigurations(
    advisor.name,
    availability
  );
  const availabilitySummary = [
    `Call ${availability.call === 'online' ? 'available now' : 'available later'}`,
    `Chat ${availability.chat === 'online' ? 'available now' : 'available later'}`
  ];

  return (
    <li
      className={styles['advisor-card']}
      data-testid={`advisor-card-${advisor.id}`}
    >
      <div className={styles['advisor-card__header']}>
        <div className={styles['advisor-card__avatar']}>
          {advisor.avatarUrl && !hasImageError ? (
            <Image
              src={advisor.avatarUrl}
              alt={`Photo of ${advisor.name}`}
              width={64}
              height={64}
              unoptimized
              className={styles['advisor-card__avatar-image']}
              referrerPolicy="no-referrer"
              onError={() => setHasImageError(true)}
            />
          ) : (
            getInitials(advisor.name)
          )}
        </div>

        <div className={styles['advisor-card__identity']}>
          <div className={styles['advisor-card__identity-group']}>
            <h3 className={styles['advisor-card__name']}>{advisor.name}</h3>
            <p className={styles['advisor-card__specialty']}>
              {advisor.specialty}
            </p>
          </div>

          <span className={styles['advisor-card__price']}>
            {getPriceLabel(advisor.pricePerMinute)}
          </span>
        </div>
      </div>

      <div className={styles['advisor-card__body']}>
        <ul className={styles['advisor-card__metadata']} role="list">
          <li className={styles['advisor-card__metadata-item']}>
            {getExperienceLabel(advisor.experienceYears)}
          </li>
          {availabilitySummary.map((statusLabel) => (
            <li
              key={statusLabel}
              className={styles['advisor-card__metadata-item']}
            >
              {statusLabel}
            </li>
          ))}
        </ul>

        <p className={styles['advisor-card__description']}>{advisor.bio}</p>
      </div>

      <footer className={styles['advisor-card__footer']}>
        <div className={styles['advisor-card__actions']}>
          {actionButtons.map((button) => (
            <button
              key={button.action}
              type="button"
              className={getButtonClassName(
                button.modifierClassName,
                button.disabled
              )}
              disabled={button.disabled}
              aria-label={button.ariaLabel}
              onClick={
                button.disabled
                  ? undefined
                  : () => onAction(advisor.name, button.action)
              }
            >
              {button.label}
            </button>
          ))}
        </div>
      </footer>
    </li>
  );
}
