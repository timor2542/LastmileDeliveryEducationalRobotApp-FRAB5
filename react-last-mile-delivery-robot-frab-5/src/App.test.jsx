import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from './App';

test('shows both play modes on the homepage', () => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  window.history.replaceState({}, '', '/homepage');
  render(<App />);

  expect(screen.getByText('Multiplayer Mode')).toBeTruthy();
  expect(screen.getByText('Singleplayer Mode')).toBeTruthy();
});
