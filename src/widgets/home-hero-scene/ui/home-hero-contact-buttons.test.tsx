// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import React from 'react';

import {
  CONTACT_EMAIL_ADDRESS,
  CONTACT_GITHUB_URL,
  CONTACT_LINKEDIN_URL,
} from '@/shared/config/contact-links';
import { HomeHeroContactButtons } from '@/widgets/home-hero-scene/ui/home-hero-contact-buttons';

import '@testing-library/jest-dom/vitest';

describe('HomeHeroContactButtons', () => {
  it('모바일 contact 버튼은 email, GitHub, LinkedIn 링크를 아이콘 버튼으로 노출해야 한다', () => {
    render(<HomeHeroContactButtons />);

    expect(screen.getByRole('link', { name: 'Email' })).toHaveAttribute(
      'href',
      `mailto:${CONTACT_EMAIL_ADDRESS}`,
    );
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      CONTACT_GITHUB_URL,
    );
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      CONTACT_LINKEDIN_URL,
    );
  });
});
