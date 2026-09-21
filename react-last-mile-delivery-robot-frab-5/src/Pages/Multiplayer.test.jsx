import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import Multiplayer from './Multiplayer';

vi.mock('../Firebase/sessionStore', async (importOriginal) => ({
  ...(await importOriginal()),
  observeConnection: () => () => {},
  createRoom: async () => ({
    pin: '1234',
    reference: { remove: async () => {}, onDisconnect: () => ({ cancel: async () => {} }) },
    role: 'host',
  }),
}));
vi.mock('../universalHTTPRequests/get', () => ({ default: () => () => {} }));

test('renders the host leaderboard after creating a room', async () => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  render(<MemoryRouter><Multiplayer /></MemoryRouter>);
  fireEvent.click(screen.getByText('Create Session'));
  fireEvent.change(screen.getByPlaceholderText('Enter your host room name.'), {
    target: { value: 'Classroom' },
  });
  fireEvent.click(screen.getByText('OK, go!'));

  expect(await screen.findByText('Leaderboard')).toBeTruthy();
  expect(document.querySelector('.dx-datagrid')).toBeTruthy();
});
