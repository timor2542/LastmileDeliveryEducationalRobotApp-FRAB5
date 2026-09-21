// @vitest-environment node
import { expect, test, vi } from 'vitest';

const { reference } = vi.hoisted(() => ({
  reference: { on: vi.fn(), off: vi.fn() },
}));
vi.mock('../Firebase/Firebase', () => ({ db: { ref: () => reference } }));

import subscribe from './get';

test('detaches the exact Firebase listener when a room is left', () => {
  const setResponse = vi.fn();
  const onSuccess = vi.fn();
  const stop = subscribe(setResponse, 'gameSessions/1234', vi.fn(), onSuccess);
  const onValue = reference.on.mock.calls[0][1];

  onValue({ val: () => ({ hostOnline: true }) });
  expect(onSuccess).toHaveBeenCalledOnce();
  expect(setResponse).toHaveBeenLastCalledWith({
    data: { hostOnline: true }, loading: false, error: null,
  });

  stop();
  expect(reference.off).toHaveBeenCalledWith('value', onValue);
});
