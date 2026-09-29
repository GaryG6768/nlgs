/* NLGS — Gareth Joshlyn CLEAN RECOVERY
   Final list: 18 historical + Barnham + Friendly = 20
*/
(function () {
  'use strict';

  const ID = '6b34da97-82cd-4343-b31d-d7d84260e861';
  const KEY = 'nlgsGarethCleanRecoveryV1';

  const historical = [
    {date:'2026-05-27T12:00:00',diff:25.0,source:'manual'},
    {date:'2026-05-29T12:00:00',diff:26.5,source:'manual'},
    {date:'2026-06-04T12:00:00',diff:25.6,source:'manual'},
    {date:'2026-06-10T12:00:00',diff:27.4,source:'manual'},
    {date:'2026-06-19T12:00:00',diff:21.2,source:'manual'},
    {date:'2026-06-20T12:00:00',diff:24.7,source:'manual'},
    {date:'2026-06-25T12:00:00',diff:21.2,source:'manual'},
    {date:'2026-07-01T12:00:00',diff:33.1,source:'manual'},
    {date:'2026-07-10T12:00:00',diff:21.2,source:'manual'},
    {date:'2026-07-22T12:00:00',diff:23.1,source:'manual'},
    {date:'2026-08-01T12:00:00',diff:23.0,source:'manual'},
    {date:'2026-08-03T12:00:00',diff:30.1,source:'manual'},
    {date:'2026-08-04T12:00:00',diff:19.5,source:'manual'},
    {date:'2026-08-06T12:00:00',diff:23.9,source:'manual'},
    {date:'2026-08-12T12:00:00',diff:32.4,source:'manual'},
    {date:'2026-08-21T12:00:00',diff:22.1,source:'manual'},
    {date:'2026-08-22T12:00:00',diff:26.5,source:'manual'},
    {date:'2026-09-19T12:00:00',diff:23.1,source:'manual'}
  ];

  function getMember() {
    try {
      return JSON.parse(sessionStorage.getItem('nlgsMember') || 'null');
    } catch(e) {
      return null;
    }
  }

  function run() {
    if (localStorage.getItem(KEY) === '1') return;

    const m = getMember();
    if (!m) {
      setTimeout(run,500);
      return;
    }

    const id = String(m.id || m.member_id || '').trim();
    if (id !== ID) {
      setTimeout(run,500);
      return;
    }

    let all = {};
    try {
      all = JSON.parse(
        localStorage.getItem('nlgsHandicapTrackerV3') || '{}'
      ) || {};
    } catch(e) {}

    const current = Array.isArray(all[ID]) ? all[ID] : [];

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
      console.log('Gareth clean recovery waiting for Barnham/Friendly');
      setTimeout(run,1000);
      return;
    }

    all[ID] = historical.concat([barnham, friendly]);

    localStorage.setItem(
      'nlgsHandicapTrackerV3',
      JSON.stringify(all)
    );

    localStorage.setItem(KEY,'1');

    console.log('Gareth clean recovery COMPLETE: 20 rounds');
  }

  run();
})();
