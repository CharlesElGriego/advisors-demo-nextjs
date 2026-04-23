import styles from './AdvisorCard.module.scss';

export default function AdvisorCardSkeleton() {
  return (
    <div
      className={`${styles['advisor-card']} ${styles['advisor-card--skeleton']}`}
      aria-hidden="true"
    >
      <div className={styles['advisor-card__header']}>
        <div className={styles['advisor-card__avatar-skeleton']} />
        <div className={styles['advisor-card__identity']}>
          <div className={styles['advisor-card__identity-group']}>
            <span className={styles['advisor-card__skeleton-line']} />
            <span
              className={`${styles['advisor-card__skeleton-line']} ${styles['advisor-card__skeleton-line--short']}`}
            />
          </div>

          <span
            className={`${styles['advisor-card__skeleton-line']} ${styles['advisor-card__skeleton-line--price']}`}
          />
        </div>
      </div>

      <div className={styles['advisor-card__body']}>
        <div className={styles['advisor-card__metadata']}>
          <span className={styles['advisor-card__skeleton-chip']} />
          <span className={styles['advisor-card__skeleton-chip']} />
          <span className={styles['advisor-card__skeleton-chip']} />
        </div>

        <span className={styles['advisor-card__skeleton-line']} />
        <span className={styles['advisor-card__skeleton-line']} />
        <span
          className={`${styles['advisor-card__skeleton-line']} ${styles['advisor-card__skeleton-line--short']}`}
        />
      </div>

      <footer className={styles['advisor-card__footer']}>
        <div className={styles['advisor-card__actions']}>
          <span className={styles['advisor-card__skeleton-button']} />
          <span className={styles['advisor-card__skeleton-button']} />
        </div>
      </footer>
    </div>
  );
}
