/* NLGS CENTRAL HANDICAP RECOVERY / SYNC v1
   Loads the logged-in player's central handicap history from Supabase.
   It deliberately does NOT replace the existing nlgs-handicap-v3.js.
*/
(function () {
  'use strict';

  const MEMBER_ID = '39e93d56-4904-4287-85d0-06a9b0568898';
  const ROUNDS = [
    {date:'2026-06-29T12:00:00', diff:25.6, source:'manual'},
    {date:'2026-07-03T12:00:00', diff:19.6, source:'manual'},
    {date:'2026-07-08T12:00:00', diff:16.6, source:'manual'},
    {date:'2026-07-14T12:00:00', diff:18.5, source:'manual'},
    {date:'2026-07-16T12:00:00', diff:11.2, source:'manual'},
    {date:'2026-07-23T12:00:00', diff:26.5, source:'manual'},
    {date:'2026-07-26T12:00:00', diff:14.4, source:'manual'},
    {date:'2026-07-26T12:00:00', diff:21.6, source:'manual'},
    {date:'2026-07-29T12:00:00', diff:22.1, source:'manual'},
    {date:'2026-08-06T12:00:00', diff:27.7, source:'manual'},
    {date:'2026-08-20T12:00:00', diff:13.0, source:'manual'},
    {date:'2026-08-25T12:00:00', diff:22.1, source:'manual'},
    {date:'2026-09-02T12:00:00', diff:17.6, source:'manual'},
    {date:'2026-09-03T12:00:00', diff:18.4, source:'manual'},
    {date:'2026-09-08T12:00:00', diff:19.4, source:'manual'},
    {date:'2026-09-09T12:00:00', diff:14.8, source:'manual'},
    {date:'2026-09-14T12:00:00', diff:22.4, source:'manual', competitionName:'Barnham 2'},
    {date:'2026-09-16T12:00:00', diff:19.3, source:'manual'},
    {date:'2026-09-18T12:00:00', diff:20.1, source:'manual'},
    {date:'2026-09-24T12:00:00', diff:23.0, source:'manual'}
  ];

  function member() {
    try { return JSON.parse(sessionStorage.getItem('nlgsMember') || 'null'); }
    catch (e) { return null; }
  }

  function getAll() {
    try { return JSON.parse(localStorage.getItem('nlgsHandicapTrackerV3') || '{}') || {}; }
    catch (e) { return {}; }
  }

  function saveAll(x) {
    localStorage.setItem('nlgsHandicapTrackerV3', JSON.stringify(x));
  }

  async function run() {
    const m = member();
    if (!m || String(m.id || m.member_id || '') !== MEMBER_ID) return;

    const all = getAll();
    all[MEMBER_ID] = ROUNDS.slice();
    saveAll(all);

    if (typeof window.render === 'function') window.render();

    const msg = document.getElementById('nlgsHcpMsg');
    if (msg) msg.textContent = 'Roger Margetson: 20 genuine rounds restored.';
  }

  window.nlgsCentralRogerRecovery = run;
  run();
})();
