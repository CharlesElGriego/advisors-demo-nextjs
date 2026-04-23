import type { Metadata } from 'next';

import AdvisorList from '@/components/advisors/AdvisorList';

import styles from './page.module.scss';
const PAGE_TITLE = 'Advisor Availability';
const PAGE_DESCRIPTION = 'View advisors and current call/chat availability.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION
};

export default function AdvisorsPage() {
  return (
    <main className={styles['advisor-page']}>
      <div className={styles['advisor-page__container']}>
        <header className={styles['advisor-page__hero']}>
          <span className={styles['advisor-page__eyebrow']}>Advisor list</span>
          <h1 className={styles['advisor-page__title']}>{PAGE_TITLE}</h1>
          <p className={styles['advisor-page__description']}>
            {PAGE_DESCRIPTION}
          </p>
        </header>

        <AdvisorList />
      </div>
    </main>
  );
}
