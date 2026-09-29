NLGS GARETH FINAL FIX

FILE NAME:
nlgs-central-gareth-final-fix.js

COPY EVERYTHING BELOW INTO A NEW FILE WITH THAT NAME:

/* NLGS — Gareth FINAL LOCAL CLEANUP
   Removes only the known unwanted manual 27/09/2026 round (19.4)
   and leaves Gareth with the correct order:
   18 historical rounds, Barnham, Friendly Game.
*/
(function () {
  'use strict';

  const ID = '6b34da97-82cd-4343-b31d-d7d84260e861';
  const KEY = 'nlgsGarethFinalCleanupV1';

  function getMember() {
    try {
      return JSON.parse(sessionStorage.getItem('nlgsMember') || 'null');
    } catch (e) {
      return null;
    }
  }

  function run() {
    if (localStorage.getItem(KEY) === '1') return;

    const m = getMember();
    if (!m) {
      setTimeout(run, 500);
      return;
    }

    const id = String(m.id || m.member_id || '').trim();
    if (id !== ID) return;

    let all = {};
    try {
      all = JSON.parse(localStorage.getItem('nlgsHandicapTrackerV3') || '{}') || {};
    } catch (e) {}

    const current = Array.isArray(all[ID]) ? all[ID] : [];
    if (!current.length) {
      setTimeout(run, 1000);
      return;
    }

    // Remove ONLY the unwanted Gareth manual round:
    // 27/09/2026, differential 19.4, manual entry.
    const cleaned = current.filter(r => {
      const date = String(r.date || '');
      const diff = Number(r.diff ?? r.differential ?? r.scoreDifferential);
      const source = String(r.source || '').toLowerCase();
      const course = String(r.course || r.name || r.label || '').toLowerCase();

      return !(date.startsWith('2026-09-27') &&
               Math.abs(diff - 19.4) < 0.001 &&
               source === 'manual' &&
               !course.includes('friendly'));
    });

    const barnham = cleaned.find(r =>
      String(r.date || '').startsWith('2026-09-14') &&
      String(r.course || r.name || r.label || '')
        .toLowerCase()
        .includes('barnham')
    );

    const friendly = cleaned.find(r =>
      String(r.date || '').startsWith('2026-09-28') &&
      String(r.course || r.name || r.label || '')
        .toLowerCase()
        .includes('royal cromer')
    );

    // Put Barnham and Friendly at the end, after the historical rounds.
    // Do not alter any other round data.
    let finalRounds = cleaned;

    if (barnham && friendly) {
      const others = cleaned.filter(r => r !== barnham && r !== friendly);
      finalRounds = others.concat([barnham, friendly]);
    }

    if (JSON.stringify(finalRounds) !== JSON.stringify(current)) {
      all[ID] = finalRounds;
      localStorage.setItem(
        'nlgsHandicapTrackerV3',
        JSON.stringify(all)
      );
      console.log(
        'Gareth final cleanup: unwanted 27/09 manual round removed; order corrected.'
      );
    }

    localStorage.setItem(KEY, '1');
  }

  run();
})();


INDEX.HTML CHANGE

After this existing line:

<script src="nlgs-central-gareth-clean.js?v=2"></script>

ADD:

<script src="nlgs-central-gareth-final-fix.js?v=1"></script>


IMPORTANT:
Do NOT remove the two old Gareth scripts yet.

First:
1. Add the new JS file.
2. Add the new script line to index.html.
3. Commit both changes.
4. Open NLGS on Gareth's phone.
5. Check that it shows exactly 20 rounds.
6. Check the last two are:
   Round 19 — Barnham 2 — 14/09/2026
   Round 20 — Friendly Game — Royal Cromer — 28/09/2026

Only after that should the old Gareth recovery files be removed.
