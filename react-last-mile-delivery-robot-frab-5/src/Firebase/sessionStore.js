const CONNECTION_TIMEOUT_MS = 8000;

export class FirebaseUnavailableError extends Error {
  constructor(message = 'Firebase is unavailable. Please reconnect and try again.') {
    super(message);
    this.name = 'FirebaseUnavailableError';
  }
}

export function observeConnection(database, onChange) {
  const connection = database.ref('.info/connected');
  const onValue = (snapshot) => onChange(snapshot.val() === true);
  connection.on('value', onValue, () => onChange(false));
  return () => connection.off('value', onValue);
}

export function waitForConnection(database, timeoutMs = CONNECTION_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const connection = database.ref('.info/connected');
    let finished = false;
    const finish = (callback, value) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      connection.off('value', onValue);
      callback(value);
    };
    const onValue = (snapshot) => {
      if (snapshot.val() === true) finish(resolve);
    };
    const timer = setTimeout(
      () => finish(reject, new FirebaseUnavailableError()),
      timeoutMs
    );
    connection.on('value', onValue, (error) => finish(reject, error));
  });
}

// A Firebase write may otherwise stay pending offline while the UI claims success.
export async function withServerAck(database, operation, timeoutMs = CONNECTION_TIMEOUT_MS) {
  await waitForConnection(database, timeoutMs);
  return new Promise((resolve, reject) => {
    const connection = database.ref('.info/connected');
    let finished = false;
    const finish = (callback, value) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      connection.off('value', onValue);
      callback(value);
    };
    const onValue = (snapshot) => {
      if (snapshot.val() !== true) {
        finish(reject, new FirebaseUnavailableError());
      }
    };
    const timer = setTimeout(
      () => finish(reject, new FirebaseUnavailableError('Firebase did not confirm the operation in time.')),
      timeoutMs
    );
    connection.on('value', onValue, (error) => finish(reject, error));
    if (!finished) {
      Promise.resolve().then(operation).then(
        (result) => finish(resolve, result),
        (error) => finish(reject, error)
      );
    }
  });
}

function randomPin() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100 + (bytes[0] % 9900));
}

export function validPin(pin) {
  return /^[1-9][0-9]{2,3}$/.test(pin);
}

export function validPlayerName(name) {
  return name.trim().length > 0 && name.length <= 40 && !/[.#$\[\]/\u0000-\u001f\u007f]/.test(name);
}

export async function readRoom(database, pin) {
  await waitForConnection(database);
  const snapshot = await withServerAck(database, () => database.ref(`gameSessions/${pin}`).once('value'));
  return snapshot.val();
}

export async function createRoom(database, roomName, nextPin = randomPin) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const pin = nextPin();
    const reference = database.ref(`gameSessions/${pin}`);
    const result = await withServerAck(database, () => reference.transaction((current) => {
      if (current !== null) return undefined;
      return {
        gameStarted: false,
        timeIsActived: false,
        timeIsPaused: false,
        roomName,
        hostOnline: false,
        timeHours: '0',
        timeMinutes: '00',
        timeSeconds: '00',
      };
    }, undefined, false));
    if (!result.committed) continue;

    try {
      await withServerAck(database, () => reference.onDisconnect().remove());
      await withServerAck(database, () => reference.update({ hostOnline: true }));
      return { pin, reference, role: 'host' };
    } catch (error) {
      // Keep the server-side disconnect cleanup if the connection was lost.
      if (!(error instanceof FirebaseUnavailableError)) {
        await reference.remove().catch(() => {});
      }
      throw error;
    }
  }
  throw new Error('Could not allocate a game PIN. Please try again.');
}

export async function joinRoom(database, pin, playerName) {
  if (!validPin(pin) || !validPlayerName(playerName)) {
    throw new Error('Enter a valid PIN and group name.');
  }
  const sessionReference = database.ref(`gameSessions/${pin}`);
  let stopRoomListener = () => {};
  try {
    // Keep a live room listener while claiming a name. Firebase can otherwise
    // evict the one-shot read from its cache and call the updater with null.
    const session = await withServerAck(database, () => new Promise((resolve, reject) => {
      const onValue = (snapshot) => resolve(snapshot.val());
      sessionReference.on('value', onValue, reject);
      stopRoomListener = () => sessionReference.off('value', onValue);
    }));
    if (!session || !session.hostOnline) return { status: 'room-not-found' };

    const reference = sessionReference.child('players').child(playerName);
    // Claim the player inside the room transaction so a late join cannot
    // recreate a room that the host removed between lookup and write.
    const result = await withServerAck(database, () => sessionReference.transaction((current) => {
      if (!current || !current.hostOnline || current.players?.[playerName]) return undefined;
      return {
        ...current,
        players: {
          ...current.players,
          [playerName]: {
            groupName: playerName,
            deviceName: 'Not connected',
            parcelCorrectCount: 0,
            distanceSensorValue: 0,
            timeFinishedRecord: '0 : 00 : 00',
            isFinishedMission: 'Not yet',
          },
        },
      };
    }, undefined, false));
    if (!result.committed) {
      const room = result.snapshot.val();
      return { status: room?.hostOnline ? 'name-taken' : 'room-not-found' };
    }

    try {
      await withServerAck(database, () => reference.onDisconnect().remove());
      const currentSession = await readRoom(database, pin);
      if (!currentSession || !currentSession.hostOnline) {
        await withServerAck(database, () => reference.remove());
        return { status: 'room-not-found' };
      }
      return { status: 'joined', reference, role: 'player', pin };
    } catch (error) {
      if (!(error instanceof FirebaseUnavailableError)) {
        await reference.remove().catch(() => {});
      }
      throw error;
    }
  } finally {
    stopRoomListener();
  }
}

export async function leaveRoom(session) {
  if (!session) return;
  await session.reference.remove();
  await session.reference.onDisconnect().cancel();
}
