/* NLGS CENTRAL HANDICAP RECOVERY — James Boagey
   One-time recovery of James's 20 existing rounds.
   No new round is added by this script.
   Sync will handle any future/completed NLGS rounds.
*/
(function () {
  'use strict';

  const DONE_KEY = 'nlgsJamesRecoveryV1';

  const ROUNDS = [
    {date:'2025-05-08T12:00:00', diff:31.1, source:'manual'},
    {date:'2025-05-09T12:00:00', diff:21.2, source:'manual'},
    {date:'2025-05-15T12:00:00', diff:25.7, source:'manual'},
    {date:'2025-07-09T12:00:00', diff:22.1, source:'manual'},
    {date:'2025-08-14T12:00:00', diff:25.7, source:'manual'},
    {date:'2025-09-04T12:00:00', diff:19.3, source:'manual'},
    {date:'2025-10-02T12:00:00', diff:23.0, source:'manual'},
    {date:'2025-11-13T12:00:00', diff:28.1, source:'manual'},
    {date:'2025-11-27T12:00:00', diff:21.5, source:'manual'},
    {date:'2026-01-22T12:00:00', diff:25.2, source:'manual'},
    {date:'2026-02-03T12:00:00', diff:27.1, source:'manual'},
    {date:'2026-03-19T12:00:00', diff:24.3, source:'manual'},
    {date:'2026-04-16T12:00:00', diff:23.9, source:'manual'},
    {date:'2026-06-22T12:00:00', diff:34.4, source:'manual'},
    {date:'2026-07-08T12:00:00', diff:23.0, source:'manual'},
    {date:'2026-07-23T12:00:00', diff:26.6, source:'manual'},
    {date:'2026-08-18T12:00:00', diff:27.5, source:'manual'},
    {date:'2026-09-03T12:00:00', diff:21.2, source:'manual'},
    {date:'2026-09-15T12:00:00', diff:21.2, source:'manual'},
    {date:'2026-09-25T12:00:00', diff:25.7, source:'manual'}
  ];

  function getMember() {
    try {
      return JSON.parse(
        sessionStorage.getItem('nlgsMember') || 'null'
      );
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

    const name = String(
      m.full_name || m.fullName || m.name || ''
    ).trim().toLowerCase();

    if (name !== 'james boagey') return false;

    const memberId = String(
      m.id || m.member_id || ''
    ).trim();

    if (!memberId) return false;

    const all = getAll();

    all[memberId] = ROUNDS.slice();

    localStorage.setItem(
      'nlgsHandicapTrackerV3',
      JSON.stringify(all)
    );

    localStorage.setItem(DONE_KEY, '1');

    console.log(
      'NLGS: James Boagey recovery complete - 20 rounds restored.'
    );

    return true;
  }

  function waitForJames() {
    if (restore()) return;
    if (localStorage.getItem(DONE_KEY) === '1') return;
    setTimeout(waitForJames, 500);
  }

  window.nlgsCentralJamesRecovery = restore;

  waitForJames();
})();
