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
      return JSON.parse(
        sessionStorage.getItem('nlgsMember') || 'null'
      );
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

    const id = String(
      m.id || m.member_id || ''
    ).trim();

    if (id !== ID) return;

    let all = {};

    try {
      all = JSON.parse(
        localStorage.getItem('nlgsHandicapTrackerV3') || '{}'
      ) || {};
    } catch (e) {}

    const current = Array.isArray(all[ID])
      ? all[ID]
      : [];

    if (!current.length) {
      setTimeout(run, 1000);
      return;
    }

    /*
      Remove ONLY the unwanted Gareth manual round:

      Date: 27/09/2026
      Differential: 19.4
      Source: manual

      Nothing else is removed.
    */
    const cleaned = current.filter(r => {

      const date = String(r.date || '');

      const diff = Number(
        r.diff ??
        r.differential ??
        r.scoreDifferential
      );

      const source = String(
        r.source || ''
      ).toLowerCase();

      const course = String(
        r.course ||
        r.name ||
        r.label ||
        ''
      ).toLowerCase();

      return !(
        date.startsWith('2026-09-27') &&
        Math.abs(diff - 19.4) < 0.001 &&
        source === 'manual' &&
        !course.includes('friendly')
      );
    });

    /*
      Find Gareth's genuine Barnham round.
    */
    const barnham = cleaned.find(r =>
      String(r.date || '').startsWith('2026-09-14') &&
      String(
        r.course ||
        r.name ||
        r.label ||
        ''
      )
        .toLowerCase()
        .includes('barnham')
    );

    /*
      Find Gareth's genuine Friendly Game.
    */
    const friendly = cleaned.find(r =>
      String(r.date || '').startsWith('2026-09-28') &&
      String(
        r.course ||
        r.name ||
        r.label ||
        ''
      )
        .toLowerCase()
        .includes('royal cromer')
    );

    /*
      Put Barnham and Friendly at the end.

      Result should therefore be:

      Rounds 1-18 = Gareth's historical rounds
      Round 19    = Barnham
      Round 20    = Friendly Game
    */
    let finalRounds = cleaned;

    if (barnham && friendly) {

      const others = cleaned.filter(
        r => r !== barnham && r !== friendly
      );

      finalRounds = others.concat([
        barnham,
        friendly
      ]);
    }

    /*
      Save only if something actually changed.
    */
    if (
      JSON.stringify(finalRounds) !==
      JSON.stringify(current)
    ) {

      all[ID] = finalRounds;

      localStorage.setItem(
        'nlgsHandicapTrackerV3',
        JSON.stringify(all)
      );

      console.log(
        'Gareth final cleanup complete: unwanted 27/09 manual round removed and round order corrected.'
      );
    }

    /*
      Mark this fix as completed so it does not
      repeatedly modify Gareth's rounds.
    */
    localStorage.setItem(
      KEY,
      '1'
    );
  }

  run();

})();
