import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Advisor } from '@/types/advisor';

import AdvisorCard from './AdvisorCard';

const advisorFixture: Advisor = {
  id: 100,
  availabilityId: 100,
  name: 'Advisor Laura',
  pricePerMinute: 4.99,
  specialty: 'Love & relationships',
  bio: 'Empathetic readings with practical next steps for relationships, family, and emotional clarity.',
  experienceYears: 8,
  avatarUrl: null,
  availability: {
    call: 'online',
    chat: 'offline'
  }
};

describe('AdvisorCard', () => {
  it('renders advisor content and triggers enabled call actions', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <ul>
        <AdvisorCard
          advisor={advisorFixture}
          availability={{ call: 'online', chat: 'offline' }}
          onAction={onAction}
        />
      </ul>
    );

    expect(
      screen.getByRole('heading', { name: advisorFixture.name })
    ).toBeInTheDocument();
    expect(screen.getByText('$4.99/min')).toBeInTheDocument();
    expect(screen.getByText('Love & relationships')).toBeInTheDocument();
    expect(screen.getByText('8+ years experience')).toBeInTheDocument();
    expect(screen.getByText('Call available now')).toBeInTheDocument();
    expect(screen.getByText('Chat available later')).toBeInTheDocument();

    const callButton = screen.getByRole('button', {
      name: 'Call Advisor Laura now'
    });
    const chatButton = screen.getByRole('button', {
      name: 'Chat with Advisor Laura later'
    });

    expect(callButton).toBeEnabled();
    expect(chatButton).toBeDisabled();

    await user.click(callButton);

    expect(onAction).toHaveBeenCalledWith('Advisor Laura', 'call');
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('shows chat availability and keeps offline call actions disabled', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <ul>
        <AdvisorCard
          advisor={advisorFixture}
          availability={{ call: 'offline', chat: 'online' }}
          onAction={onAction}
        />
      </ul>
    );

    const callLaterButton = screen.getByRole('button', {
      name: 'Call Advisor Laura later'
    });
    const chatNowButton = screen.getByRole('button', {
      name: 'Chat with Advisor Laura now'
    });

    expect(callLaterButton).toBeDisabled();
    expect(chatNowButton).toBeEnabled();
    expect(screen.getByText('Call available later')).toBeInTheDocument();
    expect(screen.getByText('Chat available now')).toBeInTheDocument();

    await user.click(chatNowButton);

    expect(onAction).toHaveBeenCalledWith('Advisor Laura', 'chat');
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders the advisor profile photo when avatarUrl is available', () => {
    render(
      <ul>
        <AdvisorCard
          advisor={{
            ...advisorFixture,
            avatarUrl: 'https://si.keen.com/memberphotos/example.jpg'
          }}
          availability={{ call: 'online', chat: 'offline' }}
          onAction={vi.fn()}
        />
      </ul>
    );

    expect(
      screen.getByRole('img', { name: 'Photo of Advisor Laura' })
    ).toBeInTheDocument();
  });
});
