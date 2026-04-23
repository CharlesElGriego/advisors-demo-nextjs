import { expect, test, type Page } from '@playwright/test';

import type { AvailabilityStatus } from '../types/advisor';

interface ListingsAdvisorPayload {
  id: number;
  name: string;
  profilePictureUrl: string;
  price: string;
  'call-availability': 0 | 1;
  'chat-availability': 0 | 1;
}

interface AvailabilityPayload {
  id: number;
  'call-availability': 0 | 1;
  'chat-availability': 0 | 1;
}

interface AvailabilityFixture {
  call: AvailabilityStatus;
  chat: AvailabilityStatus;
}

const BEECEPTOR_PLACEHOLDER_RESPONSE =
  'Hey ya! Great to see you here. Btw, nothing is configured for this request path. Create a rule and start building a mock API.';

const advisorsFixture: ListingsAdvisorPayload[] = [
  {
    id: 1,
    name: 'Advisor Laura',
    profilePictureUrl:
      'https://si.keen.com/memberphotos/-5253289-1156765229Primary.jpg',
    price: '$4.99/min',
    'call-availability': 1,
    'chat-availability': 0
  },
  {
    id: 2,
    name: 'Miss Elisabeth',
    profilePictureUrl:
      'https://si.keen.com/memberphotos/-54149795-980884913Primary.jpg',
    price: '$7.99/min',
    'call-availability': 1,
    'chat-availability': 0
  },
  {
    id: 3,
    name: 'Advisor Jada',
    profilePictureUrl:
      'https://si.keen.com/memberphotos/-24651289-1547364832Primary.jpg',
    price: '$2.49/min',
    'call-availability': 1,
    'chat-availability': 0
  },
  {
    id: 3,
    name: 'RexFrederick',
    profilePictureUrl:
      'https://si.keen.com/memberphotos/-24651289-1547364832Primary.jpg',
    price: '$4.25/min',
    'call-availability': 1,
    'chat-availability': 1
  }
];

const toAvailabilityPayload = (
  advisorId: number,
  availability: AvailabilityFixture
): AvailabilityPayload => ({
  id: advisorId,
  'call-availability': availability.call === 'online' ? 1 : 0,
  'chat-availability': availability.chat === 'online' ? 1 : 0
});

const getAdvisorCard = (page: Page, advisorId: number) =>
  page.getByTestId(`advisor-card-${advisorId}`);

const mockAdvisorEndpoints = async (
  page: Page,
  options?: {
    listingsBody?: ListingsAdvisorPayload[];
    availabilityResolver?: (
      advisorId: number,
      requestCount: number
    ) => AvailabilityFixture | null | undefined;
  }
): Promise<void> => {
  const availabilityRequestCounts = new Map<number, number>();

  await page.route(
    'https://mp30dcc6efca114e1b21.free.beeceptor.com/advisor-listings',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: options?.listingsBody ?? advisorsFixture
        })
      });
    }
  );

  await page.route(
    /https:\/\/mp30dcc6efca114e1b21\.free\.beeceptor\.com\/advisor-availability\?id=\d+/,
    async (route) => {
      const url = new URL(route.request().url());
      const advisorId = Number(url.searchParams.get('id'));
      const requestCount = (availabilityRequestCounts.get(advisorId) ?? 0) + 1;
      const resolvedAvailability =
        options?.availabilityResolver?.(advisorId, requestCount) ??
        (advisorId === 1
          ? {
              call: 'online',
              chat: 'offline'
            }
          : null);

      availabilityRequestCounts.set(advisorId, requestCount);

      if (!resolvedAvailability) {
        await route.fulfill({
          status: 200,
          contentType: 'text/plain',
          body: BEECEPTOR_PLACEHOLDER_RESPONSE
        });

        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          toAvailabilityPayload(advisorId, resolvedAvailability)
        )
      });
    }
  );
};

test('renders the advisor list with the correct availability labels', async ({
  page
}) => {
  await mockAdvisorEndpoints(page);

  await page.goto('/advisors');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Advisor Availability' })
  ).toBeVisible();
  await expect(page.getByTestId('advisor-grid')).toBeVisible();

  const lauraCard = getAdvisorCard(page, 1);
  const rexCard = getAdvisorCard(page, 4);

  await expect(
    lauraCard.getByRole('heading', { name: 'Advisor Laura' })
  ).toBeVisible();
  await expect(lauraCard).toContainText('$4.99/min');
  await expect(lauraCard).toContainText('CALL NOW');
  await expect(lauraCard).toContainText('CHAT LATER');
  await expect(rexCard).toContainText('CHAT NOW');
});

test('uses real disabled buttons and supports enabled user interactions', async ({
  page
}) => {
  await mockAdvisorEndpoints(page);

  await page.goto('/advisors');

  const lauraCallButton = page.getByRole('button', {
    name: 'Call Advisor Laura now'
  });
  const lauraChatLaterButton = page.getByRole('button', {
    name: 'Chat with Advisor Laura later'
  });
  const rexChatButton = page.getByRole('button', {
    name: 'Chat with RexFrederick now'
  });

  await expect(lauraCallButton).toBeEnabled();
  await expect(lauraChatLaterButton).toBeDisabled();

  await lauraCallButton.click();
  await expect(page.getByTestId('advisor-feedback')).toHaveText(
    'Started a call with Advisor Laura.'
  );

  await rexChatButton.click();
  await expect(page.getByTestId('advisor-feedback')).toHaveText(
    'Started a chat with RexFrederick.'
  );
});

test('updates only advisor availability when polling returns new data', async ({
  page
}) => {
  await mockAdvisorEndpoints(page, {
    availabilityResolver: (advisorId, requestCount) => {
      if (advisorId === 1 && requestCount >= 2) {
        return {
          call: 'offline',
          chat: 'online'
        };
      }

      return advisorId === 1
        ? {
            call: 'online',
            chat: 'offline'
          }
        : null;
    }
  });

  await page.goto('/advisors');

  const lauraCard = getAdvisorCard(page, 1);

  await expect(lauraCard).toContainText('CALL NOW');
  await expect(lauraCard).toContainText('CHAT LATER');
  await expect(lauraCard).toContainText('CALL LATER', {
    timeout: 5000
  });
  await expect(lauraCard).toContainText('CHAT NOW', {
    timeout: 5000
  });

  await expect(
    page.getByRole('button', { name: 'Call Advisor Laura later' })
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Chat with Advisor Laura now' })
  ).toBeEnabled();
});
