/* NLGS CENTRAL HANDICAP RECOVERY — Gareth Joshlyn
   One-time recovery of Gareth's 19 existing rounds.
   Barnham is deliberately NOT included here.
   After these 19 are restored, SYNC COMPLETED ROUNDS will add Barnham.
*/
(function () {
  'use strict';

  const MEMBER_ID = '6b34da97-82cd-4343-b31d-d7d84260e861';
  const DONE_KEY = 'nlgsGarethRecoveryV1';

  const ROUNDS = [
    {date:'2026-05-27T12:00:00', diff:25.0, source:'manual'},
    {date:'2026-05-29T12:00:00', diff:26.5, source:'manual'},
    {date:'2026-06-04T12:00:00', diff:25.6, source:'manual'},
    {date:'2026-06-10T12:00:00', diff:27.4, source:'manual'},
    {date:'2026-06-19T12:00:00', diff:21.2, source:'manual'},
    {date:'2026-06-20T12:00:00', diff:24.7, source:'manual'},
    {date:'2026-06-25T12:00:00', diff:21.2, source:'manual'},
    {date:'2026-07-01T12:00:00', diff:33.1, source:'manual'},
    {date:'2026-07-10T12:00:00', diff:21.2, source:'manual'},
    {date:'2026-07-22T12:00:00', diff:23.1, source:'manual'},
    {date:'2026-08-01T12:00:00', diff:23.0, source:'manual'},
    {date:'2026-08-03T12:00:00', diff:30.1, source:'manual'},
    {date:'2026-08-04T12:00:00', diff:19.5, source:'manual'},
    {date:'2026-08-06T12:00:00', diff:23.9, source:'manual'},
    {date:'2026-08-12T12:00:00', diff:32.4, source:'manual'},
    {date:'2026-08-21T12:00:00', diff:22.1, source:'manual'},
    {date:'2026-08-22T12:00:00', diff:26.5, source:'manual'},
    {date:'2026-09-19T12:00:00', diff:23.1, source:'manual'},
    {date:'2026-09-27T12:00:00', diff:19.4, source:'manual'}
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
      'NLGS: Gareth Joshlyn recovery complete - 19 rounds restored. Barnham not included.'
    );

    return true;
  }

  function waitForGareth() {
    if (restore()) return;

    if (localStorage.getItem(DONE_KEY) === '1') return;

    setTimeout(waitForGareth, 500);
  }

  window.nlgsCentralGarethRecovery = restore;

  waitForGareth();

})();
