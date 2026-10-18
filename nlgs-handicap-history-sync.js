/* NLGS Handicap History Sync — merge-safe fix
   Replaces the old history-sync script that overwrote local rounds.
   Keeps imported competition/friendly rounds and avoids duplicate history
   records when the server history is refreshed.
*/
(function () {
  'use strict';

  const KEY = 'nlgsHandicapTrackerV3';
  let syncing = false;

  function getMember() {
    try {
      return JSON.parse(sessionStorage.getItem('nlgsMember') || 'null');
    } catch (e) {
      return null;
    }
  }

  function getMemberId(member) {
    return String(member && (member.id || member.member_id) || '').trim();
  }

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function normaliseRound(round) {
    if (typeof round === 'number') {
      return { diff: round, source: 'manual' };
    }
    if (!round || !Number.isFinite(Number(round.diff))) return null;

    const result = Object.assign({}, round, { diff: Number(round.diff) });
    if (result.date) {
      const dateText = String(result.date);
      result.date = dateText.length === 10 ? dateText + 'T12:00:00' : dateText;
    }
    return result;
  }

  function roundKey(round) {
    const date = String(round.date || '').slice(0, 10);
    const diff = Number(round.diff).toFixed(1);
    const source = String(round.source || 'manual');

    // Preserve rounds with a known unique game/competition ID.
    if (source === 'competition') {
      const id = round.competitionId || round.competition_id || round.roundId || round.round_id;
      if (id) return 'competition:' + id;
    }
    if (source === 'friendly') {
      const id = round.friendlyGameId || round.game_id || round.friendly_game_id;
      if (id) return 'friendly:' + id;
    }

    // The secure history endpoint returns historical rounds without IDs.
    // Date + differential prevents those rows being added again on each sync.
    if (date) return 'date-diff:' + date + ':' + diff;
    return 'no-date:' + source + ':' + diff;
  }

  function mergeRounds(existing, serverRounds) {
    const merged = [];
    const seen = new Set();

    // Keep the local records first so richer source/course/game metadata wins.
    [existing, serverRounds].forEach(function (list) {
      (Array.isArray(list) ? list : []).forEach(function (raw) {
        const round = normaliseRound(raw);
        if (!round) return;
        const key = roundKey(round);
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(round);
      });
    });

    merged.sort(function (a, b) {
      return String(a.date || '').localeCompare(String(b.date || ''));
    });
    return merged;
  }

  async function syncHistory() {
    if (syncing) return false;
    const member = getMember();
    const credentials = window.nlgsLoginCredentials || {};
    const memberId = getMemberId(member);

    if (!member || !memberId || !credentials.name || !credentials.pin ||
        typeof sb === 'undefined' || !sb || typeof sb.rpc !== 'function') {
      return false;
    }

    syncing = true;
    try {
      const response = await sb.rpc('get_nlgs_handicap_history_secure', {
        p_member_name: credentials.name,
        p_member_pin: credentials.pin
      });

      if (response.error) {
        console.warn('NLGS handicap history sync:', response.error);
        return false;
      }

      let data = response.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { data = null; }
      }
      if (!Array.isArray(data)) {
        console.warn('NLGS handicap history sync: unexpected response');
        return false;
      }

      const serverRounds = data.map(function (item) {
        return {
          date: item && item.date ? String(item.date).slice(0, 10) + 'T12:00:00' : '',
          diff: Number(item && item.diff),
          source: 'manual'
        };
      }).filter(function (round) {
        return round.date && Number.isFinite(round.diff);
      });

      const all = getAll();
      const existing = Array.isArray(all[memberId]) ? all[memberId] : [];
      const merged = mergeRounds(existing, serverRounds);

      // Save only if the merged history actually changed.
      if (JSON.stringify(existing) !== JSON.stringify(merged)) {
        all[memberId] = merged;
        localStorage.setItem(KEY, JSON.stringify(all));
      }

      if (typeof window.nlgsHcpRender === 'function') {
        window.nlgsHcpRender();
      }

      console.log('NLGS: merged handicap history — ' + merged.length +
        ' rounds for ' + (member.full_name || member.name || memberId));
      return true;
    } catch (error) {
      console.warn('NLGS handicap history sync failed:', error);
      return false;
    } finally {
      syncing = false;
    }
  }

  function install() {
    // Do one sync after credentials are available. Do not poll indefinitely.
    let attempts = 0;
    const timer = setInterval(function () {
      attempts++;
      const member = getMember();
      const credentials = window.nlgsLoginCredentials || {};
      if (member && credentials.name && credentials.pin &&
          typeof sb !== 'undefined' && sb && typeof sb.rpc === 'function') {
        clearInterval(timer);
        syncHistory();
      } else if (attempts >= 40) {
        clearInterval(timer);
      }
    }, 500);

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') syncHistory();
    });
  }

  window.nlgsSyncHandicapHistory = syncHistory;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
