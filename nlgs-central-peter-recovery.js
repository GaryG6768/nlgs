/* NLGS CENTRAL HANDICAP RECOVERY — Peter Francis
   One-time recovery of Peter's 20 existing rounds.
   Barnham deliberately NOT included.
*/
(function () {
  'use strict';

  const MEMBER_ID = '6d70fc11-2319-4df1-8999-c6b43a0ac6a3';
  const DONE_KEY = 'nlgsPeterRecoveryV1';

  const ROUNDS = [
    {date:'2026-05-21T12:00:00', diff:25.7, source:'manual'},
    {date:'2026-05-27T12:00:00', diff:34.6, source:'manual'},
    {date:'2026-05-28T12:00:00', diff:27.5, source:'manual'},
    {date:'2026-06-05T12:00:00', diff:27.5, source:'manual'},
    {date:'2026-06-10T12:00:00', diff:28.4, source:'manual'},
    {date:'2026-06-22T12:00:00', diff:29.6, source:'manual'},
    {date:'2026-06-29T12:00:00', diff:26.6, source:'manual'},
    {date:'2026-07-03T12:00:00', diff:26.2, source:'manual'},
    {date:'2026-07-08T12:00:00', diff:18.4, source:'manual'},
    {date:'2026-07-16T12:00:00', diff:20.2, source:'manual'},
    {date:'2026-07-23T12:00:00', diff:28.4, source:'manual'},
    {date:'2026-07-29T12:00:00', diff:25.7, source:'manual'},
    {date:'2026-08-05T12:00:00', diff:23.9, source:'manual'},
    {date:'2026-08-06T12:00:00', diff:34.4, source:'manual'},
    {date:'2026-08-13T12:00:00', diff:19.3, source:'manual'},
    {date:'2026-08-20T12:00:00', diff:17.5, source:'manual'},
    {date:'2026-08-26T12:00:00', diff:27.5, source:'manual'},
    {date:'2026-09-03T12:00:00', diff:26.6, source:'manual'},
    {date:'2026-09-09T12:00:00', diff:30.2, source:'manual'},
    {date:'2026-09-16T12:00:00', diff:32.0, source:'manual'}
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
      'NLGS: Peter Francis recovery complete - 20 rounds restored.'
    );

    return true;
  }

  function waitForPeter() {
    if (restore()) return;
    if (localStorage.getItem(DONE_KEY) === '1') return;
    setTimeout(waitForPeter, 500);
  }

  window.nlgsCentralPeterRecovery = restore;

  waitForPeter();
})();
