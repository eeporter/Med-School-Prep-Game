import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firebaseSettings, loadFirebaseSettings, readHandoverCode, signInProblem, INIT_URL } from '../src/account.js';
import { OLD_HOST, MOVED_TO } from '../src/sync-config.js';

const init = { apiKey: 'k', projectId: 'medschool-sync', authDomain: 'medschool-sync.firebaseapp.com', appId: 'a' };

test('on Firebase domains, sign-in runs from the game\'s own address', () => {
  assert.equal(firebaseSettings(init, 'medschool-sync.web.app').authDomain, 'medschool-sync.web.app');
  assert.equal(firebaseSettings(init, 'medschool-sync.firebaseapp.com').authDomain, 'medschool-sync.firebaseapp.com');
  assert.equal(firebaseSettings(init, 'example.org').authDomain, 'medschool-sync.firebaseapp.com');
  assert.equal(firebaseSettings({ projectId: 'p' }, 'x.web.app'), null);
  assert.equal(firebaseSettings(null, 'x.web.app'), null);
});

test('no Firebase settings (a local copy or the old address) means no sign-in', async () => {
  const missing = async () => ({ ok: false, status: 404, json: async () => ({}) });
  assert.equal(await loadFirebaseSettings(missing, 'localhost'), null);
  const offline = async () => { throw new Error('offline'); };
  assert.equal(await loadFirebaseSettings(offline, 'localhost'), null);
  let asked = null;
  const ok = async (url) => { asked = url; return { ok: true, status: 200, json: async () => init }; };
  assert.equal((await loadFirebaseSettings(ok, 'medschool-sync.web.app')).authDomain, 'medschool-sync.web.app');
  assert.equal(asked, INIT_URL);
});

test('the hand-over code is read from the address and checked', () => {
  assert.equal(readHandoverCode('#move=ABCDEFGHJKMNPQRSTVWX'), 'ABCDEFGHJKMNPQRSTVWX');
  assert.equal(readHandoverCode('#x=1&move=abcdefghjkmnpqrstvwx'), 'ABCDEFGHJKMNPQRSTVWX');
  assert.equal(readHandoverCode('#move=short'), null);
  assert.equal(readHandoverCode('#move=%3Cscript%3E'), null);
  assert.equal(readHandoverCode(''), null);
});

test('sign-in errors read plainly, and a closed pop-up is not an error', () => {
  assert.equal(signInProblem('auth/popup-closed-by-user'), null);
  assert.match(signInProblem('auth/network-request-failed'), /internet/);
  assert.match(signInProblem('auth/whatever'), /try again/);
});

test('the old address only moves people once the new one is set', () => {
  assert.equal(OLD_HOST, 'eeporter.github.io');
  assert.ok(MOVED_TO === null || /^https:\/\/[a-z0-9.-]+\/$/.test(MOVED_TO));
});
