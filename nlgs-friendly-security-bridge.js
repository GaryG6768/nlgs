/* NLGS Friendly Game security bridge
   Routes existing Friendly Game RPC calls through
   authenticated versions without changing the scoring UI.
*/
(function () {
  'use strict';

  function credentials() {
    try {
      const c = window.nlgsLoginCredentials || {};
      return {
        name: String(c.name || '').trim(),
        pin: String(c.pin || '').trim()
      };
    } catch (e) {
      return { name: '', pin: '' };
    }
  }

  function install() {
    if (typeof sb === 'undefined' || !sb || typeof sb.rpc !== 'function') {
      setTimeout(install, 250);
      return;
    }

    if (sb.__nlgsFriendlySecurityBridge) return;

    const originalRpc = sb.rpc.bind(sb);

    sb.rpc = function (fn, args) {
      const c = credentials();
      let name = fn;
      let params = args || {};

      switch (fn) {

        case 'create_friendly_game':
          name = 'create_friendly_game_secure';
          params = {
            p_game: params.p_game,
            p_member_name: c.name,
            p_member_pin: c.pin
          };
          break;

        case 'get_friendly_game':
          name = 'get_friendly_game_secure';
          params = {
            p_id: params.p_id,
            p_member_name: c.name,
            p_member_pin: c.pin
          };
          break;

        case 'start_friendly_game':
          name = 'start_friendly_game_secure';
          params = {
            p_id: params.p_id,
            p_member_name: c.name,
            p_member_pin: c.pin
          };
          break;

        case 'save_friendly_game_state':
          name = 'save_friendly_game_state_secure';
          params = {
            p_id: params.p_id,
            p_state: params.p_state,
            p_member_name: c.name,
            p_member_pin: c.pin
          };
          break;

        case 'complete_friendly_game':
          name = 'complete_friendly_game_secure';
          params = {
            p_id: params.p_id,
            p_member_name: c.name,
            p_member_pin: c.pin
          };
          break;

        case 'delete_friendly_game':
          name = 'delete_friendly_game_secure';
          params = {
            p_id: params.p_id,
            p_member_name: c.name,
            p_member_pin: c.pin
          };
          break;

        default:
          break;
      }

      return originalRpc(name, params);
    };

    sb.__nlgsFriendlySecurityBridge = true;

    console.log(
      'NLGS Friendly Game security bridge installed.'
    );
  }

  install();

})();
