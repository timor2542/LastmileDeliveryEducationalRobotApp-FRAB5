import assert from 'node:assert/strict';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { createRoom, joinRoom } from '../src/Firebase/sessionStore.js';

function databaseFor(name) {
  const app = firebase.initializeApp({
    databaseURL: 'https://demo-frab5-default-rtdb.firebaseio.com',
    projectId: 'demo-frab5',
  }, name);
  const database = app.database();
  database.useEmulator('127.0.0.1', 9000);
  return database;
}

function waitForValue(reference, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reference.off('value', onValue);
      reject(new Error(`Timed out waiting for ${reference.toString()}`));
    }, 5000);
    const onValue = (snapshot) => {
      if (!predicate(snapshot.val())) return;
      clearTimeout(timer);
      reference.off('value', onValue);
      resolve(snapshot.val());
    };
    reference.on('value', onValue, reject);
  });
}

const host = databaseFor('host');
const player = databaseFor('player');
const observer = databaseFor('observer');
const duplicate = databaseFor('duplicate');

try {
  const room = await createRoom(host, 'Emulator test', () => '1234');
  const roomReference = observer.ref('gameSessions/1234');
  const liveRoom = await waitForValue(roomReference, (value) => value?.hostOnline === true);
  assert.equal(liveRoom.roomName, 'Emulator test');

  const joined = await joinRoom(player, room.pin, 'Team A');
  assert.equal(joined.status, 'joined');
  const playerReference = roomReference.child('players').child('Team A');
  await waitForValue(playerReference, (value) => value?.groupName === 'Team A');
  assert.equal((await joinRoom(duplicate, room.pin, 'Team A')).status, 'name-taken');

  player.goOffline();
  await waitForValue(playerReference, (value) => value === null);
  host.goOffline();
  await waitForValue(roomReference, (value) => value === null);
  process.stdout.write('Firebase emulator session cleanup passed.\n');
} finally {
  observer.goOffline();
  duplicate.goOffline();
  await Promise.all(firebase.apps.map((app) => app.delete()));
}
