/*
 * LMS personal passcode add-on.
 * Keeps the existing player-code and passkey flow intact.
 * Players set a private 6-digit passcode after verifying their passkey.
 * The passcode is stored by Supabase Auth, never in localStorage.
 */
(function () {
  "use strict";

  const CODE_KEY = "lms_player_code";
  const INTERNAL_EMAIL_SUFFIX = "@lms-player.internal";
  let client = null;
  let securityPanelAdded = false;

  const byId = id => document.getElementById(id);

  function message(text, isError) {
    const el = byId("lms-login-error");
    if (!el) return;
    el.textContent = text || "";
    el.style.color = isError ? "#dc2626" : "#374151";
  }

  async function getIdentity() {
    const { data, error } = await client.rpc("get_lms_my_identity");
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    if (!result || result.success !== true || !result.player_code) {
      throw new Error("The signed-in account could not be linked to a player.");
    }
    return result;
  }

  function insertLoginControls() {
    const codeInput = byId("lms-login-code");
    const setupButton = byId("lms-login-button");
    if (!codeInput || !setupButton || byId("lms-passcode-input")) return;

    const pin = document.createElement("input");
    pin.id = "lms-passcode-input";
    pin.type = "password";
    pin.inputMode = "numeric";
    pin.autocomplete = "current-password";
    pin.maxLength = 6;
    pin.pattern = "[0-9]{6}";
    pin.placeholder = "Your personal 6-digit passcode";
    pin.setAttribute("aria-label", "Your personal 6-digit passcode");
    pin.style.cssText = "width:100%;box-sizing:border-box;padding:15px;margin-top:10px;font-size:20px;font-weight:700;text-align:center;letter-spacing:5px;border:2px solid #d1d5db;border-radius:12px;outline:none";

    const loginButton = document.createElement("button");
    loginButton.id = "lms-passcode-login-button";
    loginButton.type = "button";
    loginButton.textContent = "SIGN IN WITH MY PASSCODE";
    loginButton.style.cssText = "width:100%;margin-top:10px;padding:15px;border:0;border-radius:12px;background:#2563eb;color:white;font-size:16px;font-weight:900;cursor:pointer";
    loginButton.addEventListener("click", signInWithPasscode);
    pin.addEventListener("keydown", event => {
      if (event.key === "Enter") signInWithPasscode();
    });

    setupButton.parentNode.insertBefore(pin, setupButton);
    setupButton.parentNode.insertBefore(loginButton, setupButton);

    const instructions = codeInput.parentElement?.querySelector("div");
    if (instructions && /Enter your player code to set up secure login/i.test(instructions.textContent || "")) {
      instructions.textContent = "Enter your player code and personal passcode to sign in. For first-time setup, use the setup button below.";
    }
  }

  async function signInWithPasscode() {
    const code = String(byId("lms-login-code")?.value || "").trim().toUpperCase();
    const pin = String(byId("lms-passcode-input")?.value || "");
    const button = byId("lms-passcode-login-button");

    if (!/^LMS\d{3}$/.test(code)) {
      message("Enter your player code, for example LMS001.", true);
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      message("Enter your 6-digit personal passcode.", true);
      return;
    }

    button.disabled = true;
    button.textContent = "SIGNING IN...";
    message("Checking your player code and passcode...", false);

    try {
      const { error } = await client.auth.signInWithPassword({
        email: code.toLowerCase() + INTERNAL_EMAIL_SUFFIX,
        password: pin
      });
      if (error) throw new Error("Player code or passcode is incorrect.");

      const identity = await getIdentity();
      if (String(identity.player_code).toUpperCase() !== code) {
        await client.auth.signOut({ scope: "local" });
        throw new Error("The passcode does not match that player code.");
      }

      localStorage.setItem(CODE_KEY, identity.player_code);
      message("Signed in. Opening your game...");
      const overlay = byId("lms-login-overlay");
      if (overlay) overlay.style.display = "none";

      if (typeof window.lmsSwitchPlayer === "function") {
        await window.lmsSwitchPlayer(identity.player_code);
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("LMS passcode sign-in failed:", error);
      message(error?.message || "Passcode sign-in failed. Please try again.", true);
    } finally {
      button.disabled = false;
      button.textContent = "SIGN IN WITH MY PASSCODE";
    }
  }

  function addSecurityPasscodePanel() {
    const overlay = byId("lms-security-overlay");
    const anchor = byId("lms-security-message");
    if (!overlay || !anchor || byId("lms-personal-passcode-panel")) return;

    const panel = document.createElement("section");
    panel.id = "lms-personal-passcode-panel";
    panel.style.cssText = "margin-top:16px;padding:14px;border:1px solid #d1d5db;border-radius:12px;background:#f9fafb";
    panel.innerHTML = `
      <div style="font-weight:900;color:#111827">My personal passcode</div>
      <div style="margin-top:5px;color:#6b7280;font-size:13px;line-height:1.4">Set a private 6-digit passcode to use with your player code on another device. First verify your identity with Face ID, fingerprint or your device passkey.</div>
      <button id="lms-passcode-verify" type="button" style="width:100%;margin-top:10px;padding:12px;border:0;border-radius:10px;background:#111827;color:white;font-weight:800">VERIFY TO SET PASSCODE</button>
      <div id="lms-passcode-fields" style="display:none;margin-top:10px">
        <input id="lms-passcode-new" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" placeholder="Choose 6-digit passcode" style="width:100%;box-sizing:border-box;padding:13px;margin-top:5px;font-size:20px;text-align:center;letter-spacing:5px;border:2px solid #d1d5db;border-radius:10px" />
        <input id="lms-passcode-confirm" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" placeholder="Confirm passcode" style="width:100%;box-sizing:border-box;padding:13px;margin-top:8px;font-size:20px;text-align:center;letter-spacing:5px;border:2px solid #d1d5db;border-radius:10px" />
        <button id="lms-passcode-save" type="button" style="width:100%;margin-top:10px;padding:12px;border:0;border-radius:10px;background:#16a34a;color:white;font-weight:900">SAVE MY PASSCODE</button>
      </div>
      <div id="lms-passcode-status" role="status" style="margin-top:8px;font-size:13px;font-weight:700"></div>
    `;
    anchor.parentNode.insertBefore(panel, anchor);

    byId("lms-passcode-verify").addEventListener("click", verifyForPasscode);
    byId("lms-passcode-save").addEventListener("click", savePasscode);
  }

  async function verifyForPasscode() {
    const button = byId("lms-passcode-verify");
    const status = byId("lms-passcode-status");
    button.disabled = true;
    button.textContent = "VERIFYING...";
    status.style.color = "#374151";
    status.textContent = "Use Face ID, fingerprint or your device passkey...";

    try {
      const { error } = await client.auth.signInWithPasskey();
      if (error) throw error;
      const identity = await getIdentity();
      localStorage.setItem(CODE_KEY, identity.player_code);
      byId("lms-passcode-fields").style.display = "block";
      button.textContent = "IDENTITY VERIFIED";
      button.style.background = "#16a34a";
      status.style.color = "#166534";
      status.textContent = "Verified. Choose your passcode below.";
    } catch (error) {
      console.error("Passcode identity verification failed:", error);
      button.disabled = false;
      button.textContent = "VERIFY TO SET PASSCODE";
      status.style.color = "#dc2626";
      status.textContent = error?.message || "Verification failed.";
    }
  }

  async function savePasscode() {
    const pin = String(byId("lms-passcode-new")?.value || "");
    const confirmPin = String(byId("lms-passcode-confirm")?.value || "");
    const button = byId("lms-passcode-save");
    const status = byId("lms-passcode-status");

    if (!/^\d{6}$/.test(pin)) {
      status.style.color = "#dc2626";
      status.textContent = "Choose exactly 6 digits.";
      return;
    }
    if (pin !== confirmPin) {
      status.style.color = "#dc2626";
      status.textContent = "The passcodes do not match.";
      return;
    }

    button.disabled = true;
    button.textContent = "SAVING...";
    try {
      const { error } = await client.auth.updateUser({ password: pin });
      if (error) throw error;
      byId("lms-passcode-new").value = "";
      byId("lms-passcode-confirm").value = "";
      status.style.color = "#166534";
      status.textContent = "Passcode saved. Next time, enter your player code and this passcode to sign in.";
      button.textContent = "PASSCODE SAVED";
    } catch (error) {
      console.error("Saving personal passcode failed:", error);
      status.style.color = "#dc2626";
      status.textContent = error?.message || "Passcode could not be saved.";
      button.disabled = false;
      button.textContent = "SAVE MY PASSCODE";
    }
  }

  function watchSecurityOverlay() {
    document.addEventListener("click", event => {
      if (event.target?.closest?.("#lms-security-button")) {
        window.setTimeout(addSecurityPasscodePanel, 100);
      }
    });
    const observer = new MutationObserver(() => {
      if (byId("lms-security-overlay")) addSecurityPasscodePanel();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function initialise() {
    try {
      await window.lmsAuthReady;
      client = window.lmsSupabase || null;
      if (!client) return;
      insertLoginControls();
      watchSecurityOverlay();
    } catch (error) {
      console.error("LMS personal passcode add-on failed to start:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();
