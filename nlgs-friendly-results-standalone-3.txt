/* NLGS FRIENDLY RESULTS - STANDALONE
   This patch has NO dependency on V15, V16, V17 or V18.
   It only handles the Home Friendly Game Results tile and completed
   Friendly Game results stored in Supabase.
*/
(function () {
  'use strict';

  console.log('NLGS FRIENDLY RESULTS STANDALONE ACTIVE');

  function esc(v) {
    return String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseJson(v, fallback) {
    if (Array.isArray(v) || (v && typeof v === 'object')) return v;
    try { return JSON.parse(v); } catch (e) { return fallback; }
  }

  function dateText(v) {
    try {
      return new Date(String(v) + 'T12:00:00').toLocaleDateString('en-GB');
    } catch (e) {
      return String(v || '');
    }
  }

  function players(row) {
    const p = parseJson(row?.players, []);
    return Array.isArray(p) ? p : [];
  }

  function scores(row) {
    const s = parseJson(row?.scores, {});
    return s && typeof s === 'object' && !Array.isArray(s) ? s : {};
  }

  function makeScreen() {
    if (document.getElementById('friendlyResults')) return true;

    const main = document.querySelector('main');
    if (!main) return false;

    const section = document.createElement('section');
    section.id = 'friendlyResults';
    section.className = 'screen';
    section.innerHTML =
      '<div class="label">NLGS FRIENDLY GAMES</div>' +
      '<h2 style="margin:4px 0">Friendly Game Results</h2>' +
      '<div class="small" style="margin-bottom:12px">' +
        'Completed Friendly Games only. Final scores are locked.' +
      '</div>' +
      '<div id="friendlyResultsList">' +
        '<div class="card"><div class="small">Loading Friendly Game results…</div></div>' +
      '</div>' +
      '<button class="btn secondary" style="margin-top:12px" ' +
        'onclick="show(\'home\')">← BACK TO HOME</button>';

    const nav = main.querySelector('nav');
    if (nav) main.insertBefore(section, nav);
    else main.appendChild(section);

    return true;
  }

  function showScreen() {
    if (typeof show === 'function') {
      show('friendlyResults');
    } else {
      document.querySelectorAll('.screen').forEach(x => x.classList.remove('active'));
      document.getElementById('friendlyResults')?.classList.add('active');
    }
  }

  let showingDetails = false;

  function renderGameDetails(row) {
    const list = document.getElementById('friendlyResultsList');
    if (!list) return;

    showingDetails = true;

    const p = players(row);
    const pd = parseJson(row?.player_data, []);
    const hd = parseJson(row?.hole_data, []);
    const s = scores(row);
    const format = String(row?.format || 'Stableford');

    function holeData(h) {
      if (Array.isArray(hd)) return hd[h - 1] || {};
      if (hd && typeof hd === 'object') return hd[h] || hd[String(h)] || {};
      return {};
    }

    function shotsOnHole(playingHcp, strokeIndex) {
      const hcp = Number(playingHcp) || 0;
      const si = Number(strokeIndex) || 0;
      if (hcp <= 0 || si <= 0) return 0;
      const base = Math.floor(hcp / 18);
      const remainder = hcp % 18;
      return base + (si <= remainder ? 1 : 0);
    }

    function stablefordPoints(strokes, par, shots) {
      const s = Number(strokes);
      const p0 = Number(par);
      if (!Number.isFinite(s) || s <= 0 || !Number.isFinite(p0)) return 0;
      const netScore = s - (Number(shots) || 0);
      const diff = p0 - netScore;
      return Math.max(0, diff + 2);
    }

    const results = p.map(function (name, pi) {
      const player = Array.isArray(pd) ? (pd[pi] || {}) : {};
      const sc = s[name] || {};
      let gross = 0, net = 0, pts = 0, holesPlayed = 0;

      for (let h = 1; h <= 18; h++) {
        const strokes = Number(sc[h] ?? sc[String(h)]);
        if (!Number.isFinite(strokes) || strokes <= 0) continue;

        holesPlayed++;
        const hole = holeData(h);
        const shots = shotsOnHole(player.playingHandicap, hole.stroke_index);
        gross += strokes;
        net += strokes - shots;
        pts += stablefordPoints(strokes, hole.par, shots);
      }

      return {
        name: name,
        gross: gross,
        net: net,
        pts: pts,
        holesPlayed: holesPlayed,
        handicapIndex: player.handicapIndex,
        courseHandicap: player.courseHandicap,
        playingHandicap: player.playingHandicap
      };
    }).filter(function (x) {
      return x.holesPlayed > 0;
    });

    results.sort(function (a, b) {
      return format === 'Stableford'
        ? (b.pts - a.pts || a.net - b.net)
        : (a.net - b.net || b.pts - a.pts);
    });

    const winner = results[0];
    const listTitle =
      format === 'Stableford'
        ? (winner ? winner.pts + ' Stableford points' : '—')
        : (winner ? winner.net + ' net' : '—');

    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '14px';

    let html =
      '<div class="row" style="align-items:flex-start">' +
        '<div style="min-width:0;flex:1">' +
          '<h3 style="margin:0">' + esc(row.course_name || 'Friendly Game') + '</h3>' +
          '<div class="small" style="margin-top:5px">' +
            esc(dateText(row.game_date)) + ' • ' +
            esc(format) + ' • ' +
            esc(row.tee_name || 'Yellow') +
          '</div>' +
        '</div>' +
        '<span class="pill">🔒 COMPLETE</span>' +
      '</div>' +
      '<div class="small" style="margin-top:8px">' +
        (p.length ? p.map(esc).join(' • ') : 'Players not listed') +
      '</div>' +

      (winner
        ? '<div class="card" style="margin:14px 0 4px;background:#f8faf7;border:1px solid var(--line);text-align:center">' +
            '<div style="font-size:30px">🏆</div>' +
            '<h2 style="margin:4px 0">' + esc(winner.name) + '</h2>' +
            '<b>' + esc(listTitle) + '</b>' +
          '</div>'
        : '') +

      '<div style="overflow-x:auto;margin-top:12px">' +
        '<table style="width:100%;border-collapse:collapse">' +
          '<thead><tr>' +
            '<th style="padding:7px 4px">Pos</th>' +
            '<th style="text-align:left;padding:7px 4px">Player</th>' +
            '<th style="padding:7px 4px">Gross</th>' +
            '<th style="padding:7px 4px">Net</th>' +
            '<th style="padding:7px 4px">Pts</th>' +
          '</tr></thead><tbody>';

    results.forEach(function (x, i) {
      html +=
        '<tr>' +
          '<td style="padding:8px 4px;text-align:center"><b>' + (i + 1) + '</b></td>' +
          '<td style="text-align:left;padding:8px 4px">' +
            '<b>' + (i === 0 ? '🏆 ' : '') + esc(x.name) + '</b>' +
            '<div class="small">PH ' + esc(x.playingHandicap ?? '—') +
              ' • ' + x.holesPlayed + '/18 holes</div>' +
          '</td>' +
          '<td style="padding:8px 4px;text-align:center">' + x.gross + '</td>' +
          '<td style="padding:8px 4px;text-align:center"><b>' + x.net + '</b></td>' +
          '<td style="padding:8px 4px;text-align:center"><b>' + x.pts + '</b></td>' +
        '</tr>';
    });

    html +=
          '</tbody></table></div>' +
      '<button class="btn secondary" style="margin-top:12px" id="friendlyResultsBackBtn">' +
        '← BACK TO FRIENDLY RESULTS' +
      '</button>';

    card.innerHTML = html;
    list.innerHTML = '';
    list.appendChild(card);

    const back = document.getElementById('friendlyResultsBackBtn');
    if (back) {
      back.onclick = function () {
        showingDetails = false;
        loadResults();
      };
    }
  }

  async function loadResults() {
    if (showingDetails) return;

    makeScreen();

    const list = document.getElementById('friendlyResultsList');
    if (!list) return;

    list.innerHTML =
      '<div class="card"><div class="small">Loading Friendly Game results…</div></div>';

    try {
      if (typeof sb === 'undefined' || !sb?.rpc) {
        throw new Error('Supabase connection is not available.');
      }

      const r = await sb.rpc('list_completed_friendly_games');
      if (r.error) throw r.error;

      const rows = Array.isArray(r.data) ? r.data : [];

      if (!rows.length) {
        list.innerHTML =
          '<div class="card">' +
            '<div style="font-size:34px;text-align:center">⛳</div>' +
            '<h3 style="text-align:center;margin:8px 0">No completed Friendly Games yet</h3>' +
            '<div class="small" style="text-align:center">' +
              'Completed Friendly Games will appear here.' +
            '</div>' +
          '</div>';
        return;
      }

      list.innerHTML = '';

      rows.forEach(function (row) {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '12px';

        const p = players(row);

        card.innerHTML =
          '<div class="row" style="align-items:flex-start">' +
            '<div style="min-width:0;flex:1">' +
              '<h3 style="margin:0">' + esc(row.course_name || 'Friendly Game') + '</h3>' +
              '<div class="small" style="margin-top:5px">' +
                esc(dateText(row.game_date)) + ' • ' +
                esc(row.format || 'Stableford') + ' • ' +
                esc(row.tee_name || 'Yellow') +
              '</div>' +
              '<div class="small" style="margin-top:5px">' +
                (p.length ? p.map(esc).join(' • ') : 'Players not listed') +
              '</div>' +
            '</div>' +
            '<span class="pill">🔒 COMPLETE</span>' +
          '</div>' +
          '<button class="btn secondary" style="margin-top:12px">VIEW FINAL RESULTS</button>';

        card.querySelector('button').onclick = function (event) {
          if (event) {
            event.preventDefault();
            event.stopPropagation();
          }

          renderGameDetails(row);

          const resultScreen = document.getElementById('friendlyResults');
          if (resultScreen) {
            document.querySelectorAll('.screen').forEach(function (screen) {
              screen.classList.remove('active');
            });
            resultScreen.classList.add('active');
          }

          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        };

        list.appendChild(card);
      });
    } catch (e) {
      console.error('Could not load Friendly Game results', e);
      list.innerHTML =
        '<div class="card">' +
          '<div class="small">Could not load Friendly Game results. Please try again.</div>' +
        '</div>';
    }
  }

  function wire() {
    makeScreen();

    const tile = document.getElementById('friendlyResultsTile');
    if (tile && !tile.dataset.standaloneFriendlyResults) {
      tile.dataset.standaloneFriendlyResults = '1';
      tile.onclick = function () {
        showingDetails = false;
        showScreen();
        loadResults();
      };
    }
  }

  const originalShow = window.show;
  if (typeof originalShow === 'function' && !window.NLGSStandaloneFriendlyShowWrapped) {
    window.NLGSStandaloneFriendlyShowWrapped = true;

    window.show = function (id) {
      originalShow.apply(this, arguments);
      if (id === 'friendlyResults') {
        setTimeout(loadResults, 50);
      }
    };
  }

  window.NLGSStandaloneFriendlyResults = {
    load: loadResults
  };

  wire();
  window.addEventListener('load', function () {
    setTimeout(wire, 300);
  });
  setTimeout(wire, 500);
})();
