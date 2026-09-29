/* NLGS CENTRAL HANDICAP RECOVERY — David Frances
   One-time recovery of David's 19 existing rounds.
   Barnham deliberately NOT included.
   Barnham must be added by SYNC COMPLETED ROUNDS.
*/
(function () {
  'use strict';

  const MEMBER_ID = '524655e6-ef40-42e3-a7bb-f5733c524828';
  const DONE_KEY = 'nlgsDavidRecoveryV1';

  const ROUNDS = [
    {date:'2026-05-21T12:00:00', diff:23.0, source:'manual'},
    {date:'2026-05-27T12:00:00', diff:29.8, source:'manual'},
    {date:'2026-05-28T12:00:00', diff:21.2, source:'manual'},
    {date:'2026-06-01T12:00:00', diff:27.5, source:'manual'},
    {date:'2026-06-10T12:00:00', diff:30.2, source:'manual'},
    {date:'2026-06-22T12:00:00', diff:25.8, source:'manual'},
    {date:'2026-07-03T12:00:00', diff:27.1, source:'manual'},
    {date:'2026-07-08T12:00:00', diff:15.7, source:'manual'},
    {date:'2026-07-16T12:00:00', diff:30.2, source:'manual'},
    {date:'2026-07-23T12:00:00', diff:25.7, source:'manual'},
    {date:'2026-07-29T12:00:00', diff:21.2, source:'manual'},
    {date:'2026-08-05T12:00:00', diff:24.8, source:'manual'},
    {date:'2026-08-06T12:00:00', diff:23.9, source:'manual'},
    {date:'2026-08-13T12:00:00', diff:18.4, source:'manual'},
    {date:'2026-08-20T12:00:00', diff:23.9, source:'manual'},
    {date:'2026-08-26T12:00:00', diff:16.6, source:'manual'},
    {date:'2026-09-03T12:00:00', diff:25.7, source:'manual'},
    {date:'2026-09-09T12:00:00', diff:25.7, source:'manual'},
    {date:'2026-09-16T12:00:00', diff:23.9, source:'manual'}
  ];

  function getMember() {
    try {
      return JSON.parse(sessionStorage.getItem('nlgsMember') || 'null');
    } catch (e) {
      return null;
    }
  }

  function getAll() {
    try {
      return JSON.parse(
        localStorage.getItem('nlgsHandicapTrackerV3') || '{}'
      ) || {};
    } catch (e) {
      return {};
    }
  }

  function restore() {
    if (localStorage.getItem(DONE_KEY) === '1') return false;

    const m = getMember();
    if (!m) return false;

    const id = String(m.id || m.member_id || '').trim();
    if (id !== MEMBER_ID) return false;

    const all = getAll();

    all[MEMBER_ID] = ROUNDS.slice();

    localStorage.setItem(
      'nlgsHandicapTrackerV3',
      JSON.stringify(all)
    );

    localStorage.setItem(DONE_KEY, '1');

    console.log(
      'NLGS: David Frances recovery complete - 19 rounds restored. Barnham not included.'
    );

    return true;
  }

  function waitForDavid() {
    if (restore()) return;
    if (localStorage.getItem(DONE_KEY) === '1') return;
    setTimeout(waitForDavid, 500);
  }

  window.nlgsCentralDavidRecovery = restore;

  waitForDavid();
})();
