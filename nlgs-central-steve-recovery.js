/* NLGS CENTRAL HANDICAP RECOVERY — Steve Henning
   One-time recovery of Steve's 19 existing rounds.
   Barnham deliberately NOT included.
   Barnham must be added by SYNC COMPLETED ROUNDS.
*/
(function () {
  'use strict';

  const DONE_KEY = 'nlgsSteveRecoveryV1';

  const ROUNDS = [
    {date:'2026-04-02T12:00:00', diff:28.4, source:'manual'},
    {date:'2026-04-10T12:00:00', diff:24.0, source:'manual'},
    {date:'2026-04-16T12:00:00', diff:17.5, source:'manual'},
    {date:'2026-04-23T12:00:00', diff:15.7, source:'manual'},
    {date:'2026-04-30T12:00:00', diff:16.6, source:'manual'},
    {date:'2026-05-07T12:00:00', diff:23.0, source:'manual'},
    {date:'2026-05-27T12:00:00', diff:24.0, source:'manual'},
    {date:'2026-06-01T12:00:00', diff:21.2, source:'manual'},
    {date:'2026-07-03T12:00:00', diff:19.6, source:'manual'},
    {date:'2026-07-08T12:00:00', diff:18.4, source:'manual'},
    {date:'2026-07-16T12:00:00', diff:20.2, source:'manual'},
    {date:'2026-07-23T12:00:00', diff:17.5, source:'manual'},
    {date:'2026-07-29T12:00:00', diff:14.8, source:'manual'},
    {date:'2026-08-06T12:00:00', diff:12.5, source:'manual'},
    {date:'2026-08-13T12:00:00', diff:20.2, source:'manual'},
    {date:'2026-08-20T12:00:00', diff:25.7, source:'manual'},
    {date:'2026-09-03T12:00:00', diff:16.6, source:'manual'},
    {date:'2026-09-09T12:00:00', diff:23.9, source:'manual'},
    {date:'2026-09-16T12:00:00', diff:20.2, source:'manual'}
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

    if (name !== 'steve henning') return false;

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
      'NLGS: Steve Henning recovery complete - 19 rounds restored. Barnham not included.'
    );

    return true;
  }

  function waitForSteve() {
    if (restore()) return;
    if (localStorage.getItem(DONE_KEY) === '1') return;
    setTimeout(waitForSteve, 500);
  }

  window.nlgsCentralSteveRecovery = restore;

  waitForSteve();
})();
