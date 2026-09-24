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

  function renderGameDetails(row) {
    const list = document.getElementById('friendlyResultsList');
    if (!list) return;

    const p = players(row);
    const s = scores(row);

    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '14px';

    let html =
      '<div class="row" style="align-items:flex-start">' +
        '<div style="min-width:0;flex:1">' +
          '<h3 style="margin:0">' + esc(row.course_name || 'Friendly Game') + '</h3>' +
          '<div class="small" style="margin-top:5px">' +
            esc(dateText(row.game_date)) + ' • ' +
            esc(row.format || 'Stableford') + ' • ' +
            esc(row.tee_name || 'Yellow') +
          '</div>' +
        '</div>' +
        '<span class="pill">🔒 COMPLETE</span>' +
      '</div>' +
      '<div class="small" style="margin-top:8px">' +
        (p.length ? p.map(esc).join(' • ') : 'Players not listed') +
      '</div>';

    const names = Object.keys(s);

    if (names.length) {
      html +=
        '<div style="overflow-x:auto;margin-top:12px">' +
          '<table style="width:100%;border-collapse:collapse">' +
            '<thead><tr>' +
              '<th style="text-align:left;padding:7px 4px">Player</th>' +
              '<th style="padding:7px 4px">Total</th>' +
            '</tr></thead><tbody>';

      names.forEach(function (name) {
        const holeScores = s[name] || {};
        let total = 0;
        let count = 0;

        for (let h = 1; h <= 18; h++) {
          const n = Number(holeScores[h] ?? holeScores[String(h)]);
          if (Number.isFinite(n)) {
            total += n;
            count++;
          }
        }

        html +=
          '<tr>' +
            '<td style="text-align:left;padding:7px 4px">' + esc(name) + '</td>' +
            '<td style="text-align:center;padding:7px 4px"><b>' +
              (count ? total : '—') +
            '</b></td>' +
          '</tr>';
      });

      html += '</tbody></table></div>';
    } else {
      html +=
        '<div class="small" style="margin-top:12px">' +
          'Final scores are stored, but no score table was returned.' +
        '</div>';
    }

    card.innerHTML = html;
    list.appendChild(card);
  }

  async function loadResults() {
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

        card.querySelector('button').onclick = function () {
          renderGameDetails(row);
          showScreen();
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
