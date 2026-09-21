// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import {
  FirebaseUnavailableError,
  createRoom,
  joinRoom,
  leaveRoom,
  validPin,
  validPlayerName,
  waitForConnection,
  withServerAck,
} from './sessionStore';

afterEach(() => vi.useRealTimers());

function connectedDatabase(references) {
  const connection = {
    on: vi.fn((_event, callback) => callback({ val: () => true })),
    off: vi.fn(),
  };
  return {
    ref: vi.fn((path) => path === '.info/connected' ? connection : references[path]),
    connection,
  };
}

test('an offline Firebase request times out and removes its listener', async () => {
  vi.useFakeTimers();
  const connection = { on: vi.fn(), off: vi.fn() };
  const database = { ref: () => connection };
  const result = waitForConnection(database, 50);
  const rejected = expect(result).rejects.toBeInstanceOf(FirebaseUnavailableError);
  await vi.advanceTimersByTimeAsync(50);
  await rejected;
  expect(connection.off).toHaveBeenCalledOnce();
});

test('validates database path segments before joining', () => {
  expect(validPin('1234')).toBe(true);
  expect(validPin('123/4')).toBe(false);
  expect(validPlayerName('Team A')).toBe(true);
  expect(validPlayerName('Team/A')).toBe(false);
  expect(validPlayerName('Team.A')).toBe(false);
});

test('creates a room only after server cleanup is registered and the room is online', async () => {
  const order = [];
  const disconnect = {
    remove: vi.fn(async () => { order.push('register cleanup'); }),
    cancel: vi.fn(async () => { order.push('cancel cleanup'); }),
  };
  const reference = {
    transaction: vi.fn(async (change) => {
      expect(change(null).hostOnline).toBe(false);
      order.push('reserve room');
      return { committed: true };
    }),
    onDisconnect: () => disconnect,
    update: vi.fn(async (value) => {
      expect(value).toEqual({ hostOnline: true });
      order.push('mark online');
    }),
    remove: vi.fn(async () => { order.push('remove room'); }),
  };
  const database = connectedDatabase({ 'gameSessions/1234': reference });

  const session = await createRoom(database, 'Classroom', () => '1234');
  expect(session.pin).toBe('1234');
  expect(order).toEqual(['reserve room', 'register cleanup', 'mark online']);

  await leaveRoom(session);
  expect(order.slice(-2)).toEqual(['remove room', 'cancel cleanup']);
});

test('does not replace an existing room when a PIN collides', async () => {
  const existing = { transaction: vi.fn(async (change) => {
    expect(change({ roomName: 'Existing' })).toBeUndefined();
    return { committed: false };
  }) };
  const created = {
    transaction: vi.fn(async () => ({ committed: true })),
    onDisconnect: () => ({ remove: vi.fn(async () => {}) }),
    update: vi.fn(async () => {}),
  };
  const database = connectedDatabase({
    'gameSessions/1234': existing,
    'gameSessions/5678': created,
  });
  const pins = ['1234', '5678'];
  const session = await createRoom(database, 'New', () => pins.shift());
  expect(session.pin).toBe('5678');
  expect(created.update).toHaveBeenCalledWith({ hostOnline: true });
});

test('removes a reserved room if disconnect cleanup cannot be registered', async () => {
  const reference = {
    transaction: vi.fn(async () => ({ committed: true })),
    onDisconnect: () => ({ remove: vi.fn(async () => { throw new Error('permission denied'); }) }),
    update: vi.fn(),
    remove: vi.fn(async () => {}),
  };
  const database = connectedDatabase({ 'gameSessions/1234': reference });
  await expect(createRoom(database, 'Classroom', () => '1234')).rejects.toThrow('permission denied');
  expect(reference.remove).toHaveBeenCalledOnce();
  expect(reference.update).not.toHaveBeenCalled();
});

test('rejects an unconfirmed write when the Firebase connection drops', async () => {
  const database = connectedDatabase({});
  const pending = withServerAck(database, () => new Promise(() => {}));
  const rejected = expect(pending).rejects.toBeInstanceOf(FirebaseUnavailableError);
  await vi.waitFor(() => expect(database.connection.on).toHaveBeenCalledTimes(2));
  database.connection.on.mock.calls[1][1]({ val: () => false });
  await rejected;
  expect(database.connection.off).toHaveBeenCalledTimes(2);
});

test('keeps disconnect cleanup armed if explicit removal fails', async () => {
  const cancel = vi.fn();
  const session = { reference: {
    remove: vi.fn(async () => { throw new Error('offline'); }),
    onDisconnect: () => ({ cancel }),
  } };
  await expect(leaveRoom(session)).rejects.toThrow('offline');
  expect(cancel).not.toHaveBeenCalled();
});

test('joins only after claiming a unique player name and registering cleanup', async () => {
  const steps = [];
  const player = {
    onDisconnect: () => ({ remove: vi.fn(async () => { steps.push('register cleanup'); }) }),
  };
  const room = {
    on: vi.fn((_event, callback) => callback({ val: () => ({ hostOnline: true }) })),
    off: vi.fn(),
    transaction: vi.fn(async (change) => {
      expect(change(null)).toBeUndefined();
      expect(change({ hostOnline: true }).players['Team A'].groupName).toBe('Team A');
      steps.push('claim player');
      return { committed: true };
    }),
    once: vi.fn(async () => ({ val: () => ({ hostOnline: true }) })),
    child: () => ({ child: () => player }),
  };
  const database = connectedDatabase({ 'gameSessions/1234': room });
  const result = await joinRoom(database, '1234', 'Team A');
  expect(result.status).toBe('joined');
  expect(steps).toEqual(['claim player', 'register cleanup']);
  expect(room.once).toHaveBeenCalledOnce();
  expect(room.off).toHaveBeenCalledOnce();
});

test('does not create an orphan player when its host has already left', async () => {
  const player = { onDisconnect: vi.fn() };
  const room = {
    on: vi.fn((_event, callback) => callback({ val: () => ({ hostOnline: true }) })),
    off: vi.fn(),
    transaction: vi.fn(async (change) => {
      expect(change(null)).toBeUndefined();
      return { committed: false, snapshot: { val: () => null } };
    }),
    child: () => ({ child: () => player }),
  };
  const database = connectedDatabase({ 'gameSessions/1234': room });
  expect(await joinRoom(database, '1234', 'Team A')).toEqual({ status: 'room-not-found' });
  expect(player.onDisconnect).not.toHaveBeenCalled();
});
