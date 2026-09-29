/* NLGS CENTRAL HANDICAP RECOVERY V3 — Gareth Joshlyn
   CLEAN REBUILD
   Keeps Barnham + Friendly Game.
   Removes the unwanted 27-Sep manual round.
*/
(function () {
  'use strict';

  const MEMBER_ID = '6b34da97-82cd-4343-b31d-d7d84260e861';
  const DONE_KEY = 'nlgsGarethRecoveryV3';

  const HISTORICAL_ROUNDS = [
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
    {date:'2026-09-19T12:00:00', diff:23.1, source:'manual'}
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

    const member = getMember();
    if (!member) return false;

    const id = String(
      member.id || member.member_id || ''
    ).trim();

    if (id !== MEMBER_ID) return false;

    const all = getAll();
    const current = Array.isArray(all[MEMBER_ID])
      ? all[MEMBER_ID]
      : [];

    const barnham = current.find(r =>
      String(r.date || '').startsWith('2026-09-14') &&
      String(r.course || r.name || r.label || '')
        .toLowerCase()
        .includes('barnham')
    );

    const friendly = current.find(r =>
      String(r.date || '').startsWith('2026-09-28') &&
      String(r.course || r.name || r.label || '')
        .toLowerCase()
        .includes('royal cromer')
    );

    if (!barnham || !friendly) {
      console.log(
        'NLGS Gareth V3: Barnham or Friendly Game not found — nothing changed.'
      );
      return false;
    }

    const rebuilt = HISTORICAL_ROUNDS.slice();

    rebuilt.push(barnham);
    rebuilt.push(friendly);

    all[MEMBER_ID] = rebuilt;

    localStorage.setItem(
      'nlgsHandicapTrackerV3',
      JSON.stringify(all)
    );

    localStorage.setItem(DONE_KEY, '1');

    console.log(
      'NLGS Gareth V3: CLEAN REBUILD COMPLETE — 20 rounds.'
    );

    return true;
  }

  function waitForGareth() {
    if (restore()) return;
    if (localStorage.getItem(DONE_KEY) === '1') return;
    setTimeout(waitForGareth, 500);
  }

  window.nlgsCentralGarethRecoveryV3 = restore;

  waitForGareth();
})();
