import { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { createFeedback } from "../../api/feedback";

// Bouton flottant "mode inspection" : survol pour cibler un élément, clic pour
// l'annoter, double-clic pour passer en multi-sélection. Concept porté de
// MineCelph (src/feedback.js) — voir memoire projet_minecelph.md.

const POS_KEY = "cleanstore_fb_pos";
const STYLE_ID = "cs-feedback-style";
const DOUBLE_CLICK_MS = 240;
const DRAG_THRESHOLD_PX = 5;

const SECTIONS = ["Magasins", "Tâches", "Marketplace", "Paiements", "Inspection", "Mobile", "Admin", "Autre"];

const STYLE = `
.cs-fb-toggle-btn{position:fixed;z-index:2147483000;bottom:20px;right:20px;padding:9px 14px;border-radius:999px;border:none;background:#1f2430;color:#fff;font:600 13px/1.2 system-ui,sans-serif;cursor:grab;box-shadow:0 4px 14px rgba(0,0,0,.25);user-select:none;touch-action:none;}
.cs-fb-toggle-btn.cs-fb-active{background:#c0392b;}
.cs-fb-toggle-btn.cs-fb-mode-multi{background:#8e44ad;}
.cs-fb-hover{outline:2px solid #3b82f6 !important;outline-offset:2px;cursor:pointer !important;}
.cs-fb-hover-multi{outline:2px solid #8e44ad !important;outline-offset:2px;cursor:pointer !important;}
.cs-fb-selected{outline:2px solid #8e44ad !important;outline-offset:2px;background:rgba(142,68,173,.08) !important;}
.cs-fb-popover{position:fixed;z-index:2147483001;width:320px;background:#fff;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.25);padding:12px;font:13px/1.4 system-ui,sans-serif;color:#1f2430;}
.cs-fb-popover-multi{width:360px;}
.cs-fb-pop-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;}
.cs-fb-pop-target{font-size:11px;color:#6b7280;background:#f3f4f6;border-radius:6px;padding:2px 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px;}
.cs-fb-pop-close{border:none;background:none;cursor:pointer;color:#6b7280;font-size:14px;line-height:1;}
.cs-fb-pop-section{width:100%;margin-bottom:8px;padding:6px 8px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;}
.cs-fb-pop-ta{width:100%;min-height:80px;padding:8px;border:1px solid #d1d5db;border-radius:8px;font:13px/1.4 system-ui,sans-serif;resize:vertical;margin-bottom:8px;box-sizing:border-box;}
.cs-fb-pop-actions{display:flex;justify-content:flex-end;gap:8px;}
.cs-fb-pop-save{background:#1f2430;color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:600;cursor:pointer;}
.cs-fb-pop-cancel{background:none;border:none;color:#6b7280;padding:7px 10px;font-size:13px;cursor:pointer;}
.cs-fb-multi-bar{position:fixed;z-index:2147483000;bottom:20px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;background:#1f2430;color:#fff;border-radius:999px;padding:8px 14px;box-shadow:0 4px 14px rgba(0,0,0,.25);font:13px/1.2 system-ui,sans-serif;}
.cs-fb-multi-comment,.cs-fb-multi-quit{border:none;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;}
.cs-fb-multi-comment{background:#8e44ad;color:#fff;}
.cs-fb-multi-quit{background:rgba(255,255,255,.14);color:#fff;}
.cs-fb-multi-selectors{max-height:80px;overflow-y:auto;margin-bottom:8px;display:flex;flex-direction:column;gap:4px;}
.cs-fb-multi-sel-item{font-size:11px;color:#6b7280;background:#f3f4f6;border-radius:6px;padding:2px 6px;}
.cs-fb-mini-toast{position:fixed;z-index:2147483001;bottom:70px;right:20px;background:#1f2430;color:#fff;padding:8px 14px;border-radius:8px;font:13px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);}
body.cs-fb-mode{cursor:crosshair;}
`;

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = STYLE;
  document.head.appendChild(el);
}

function describeElement(el: Element): string {
  let d = el.tagName.toLowerCase();
  if ((el as HTMLElement).id) d += `#${(el as HTMLElement).id}`;
  const cls = [...el.classList].filter((c) => !c.startsWith("cs-fb-")).slice(0, 2).join(".");
  if (cls) d += `.${cls}`;
  if (!(el as HTMLElement).id && !cls) {
    const txt = el.textContent?.trim().slice(0, 24);
    if (txt) d += ` "${txt}"`;
  }
  return d;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function createFeedbackController() {
  let active = false;
  let mode: "single" | "multi" = "single";
  let hovered: Element | null = null;
  let selected: Element[] = [];
  let clickTimer: ReturnType<typeof setTimeout> | null = null;
  let popover: HTMLElement | null = null;
  let multiBar: HTMLElement | null = null;

  const btn = document.createElement("button");
  btn.className = "cs-fb-toggle-btn";
  btn.textContent = "✎ Feedback";
  btn.title = "Activer le mode feedback";
  document.body.appendChild(btn);

  // ── Drag (glisser le bouton) ──────────────────────────────────────────────
  let dragging = false;
  let dragStart = { x: 0, y: 0 };
  let dragMoved = false;

  try {
    const saved = JSON.parse(localStorage.getItem(POS_KEY) ?? "null");
    if (saved && typeof saved.left === "number" && typeof saved.top === "number") {
      // Clamp to the current viewport — a position saved on a bigger screen (or
      // dragged off-screen) would otherwise leave the button invisible.
      const rect = btn.getBoundingClientRect();
      const w = rect.width || 110;
      const h = rect.height || 36;
      const left = Math.max(4, Math.min(window.innerWidth - w - 4, saved.left));
      const top = Math.max(4, Math.min(window.innerHeight - h - 4, saved.top));
      btn.style.left = `${left}px`;
      btn.style.top = `${top}px`;
      btn.style.right = "auto";
      btn.style.bottom = "auto";
    }
  } catch {
    // ignore
  }

  function onPointerDown(e: PointerEvent) {
    dragging = true;
    dragMoved = false;
    dragStart = { x: e.clientX, y: e.clientY };
    btn.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (!dragMoved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    dragMoved = true;
    const rect = btn.getBoundingClientRect();
    const left = Math.max(4, Math.min(window.innerWidth - rect.width - 4, rect.left + dx));
    const top = Math.max(4, Math.min(window.innerHeight - rect.height - 4, rect.top + dy));
    btn.style.left = `${left}px`;
    btn.style.top = `${top}px`;
    btn.style.right = "auto";
    btn.style.bottom = "auto";
    dragStart = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp() {
    dragging = false;
    if (dragMoved) {
      const rect = btn.getBoundingClientRect();
      localStorage.setItem(POS_KEY, JSON.stringify({ left: rect.left, top: rect.top }));
    } else {
      toggle();
    }
  }

  btn.addEventListener("pointerdown", onPointerDown);
  btn.addEventListener("pointermove", onPointerMove);
  btn.addEventListener("pointerup", onPointerUp);

  // ── Toggle mode feedback ──────────────────────────────────────────────────

  function toggle() {
    active = !active;
    btn.classList.toggle("cs-fb-active", active);
    btn.textContent = active ? "✕ Feedback" : "✎ Feedback";
    btn.title = active ? "Désactiver (double-clic = multi-sélection)" : "Activer le mode feedback";
    document.body.classList.toggle("cs-fb-mode", active);

    if (active) {
      document.addEventListener("click", onClick, true);
      document.addEventListener("mouseover", onHover, true);
      document.addEventListener("mouseout", onUnhover, true);
    } else {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mouseover", onHover, true);
      document.removeEventListener("mouseout", onUnhover, true);
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = null;
      clearHover();
      closePopover();
      exitMulti();
    }
  }

  function isUI(el: Element | null): boolean {
    if (!el) return false;
    return btn.contains(el) || !!(popover && popover.contains(el)) || !!(multiBar && multiBar.contains(el));
  }

  // ── Survol ────────────────────────────────────────────────────────────────

  function onHover(e: MouseEvent) {
    const target = e.target as Element;
    if (isUI(target)) return;
    clearHover();
    target.classList.add(mode === "multi" ? "cs-fb-hover-multi" : "cs-fb-hover");
    hovered = target;
  }

  function onUnhover(e: MouseEvent) {
    (e.target as Element).classList.remove("cs-fb-hover", "cs-fb-hover-multi");
    if (hovered === e.target) hovered = null;
  }

  function clearHover() {
    hovered?.classList.remove("cs-fb-hover", "cs-fb-hover-multi");
    hovered = null;
  }

  // ── Clic (timer pour distinguer simple / double clic) ────────────────────

  function onClick(e: MouseEvent) {
    const target = e.target as Element;
    if (isUI(target)) return;
    e.preventDefault();
    e.stopPropagation();
    clearHover();

    if (mode === "multi") {
      toggleSelection(target);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      closePopover();
      enterMulti(target);
    } else {
      clickTimer = setTimeout(() => {
        clickTimer = null;
        showPopover(target, x, y);
      }, DOUBLE_CLICK_MS);
    }
  }

  // ── Mode multi-sélection ──────────────────────────────────────────────────

  function enterMulti(firstTarget: Element | null) {
    mode = "multi";
    btn.classList.add("cs-fb-mode-multi");
    btn.title = "Multi-sélection active — double-clic pour quitter";
    showMultiBar();
    if (firstTarget) toggleSelection(firstTarget);
  }

  function exitMulti() {
    selected.forEach((el) => el.classList.remove("cs-fb-selected"));
    selected = [];
    multiBar?.remove();
    multiBar = null;
    mode = "single";
    btn.classList.remove("cs-fb-mode-multi");
    btn.title = active ? "Désactiver (double-clic = multi-sélection)" : "Activer le mode feedback";
  }

  function toggleSelection(el: Element) {
    const idx = selected.indexOf(el);
    if (idx === -1) {
      selected.push(el);
      el.classList.add("cs-fb-selected");
    } else {
      selected.splice(idx, 1);
      el.classList.remove("cs-fb-selected");
    }
    updateMultiBar();
  }

  function showMultiBar() {
    multiBar = document.createElement("div");
    multiBar.className = "cs-fb-multi-bar";
    multiBar.innerHTML = `
      <span class="cs-fb-multi-count">Aucun élément</span>
      <button class="cs-fb-multi-comment">✎ Commenter</button>
      <button class="cs-fb-multi-quit">✕ Quitter</button>
    `;
    document.body.appendChild(multiBar);
    multiBar.querySelector(".cs-fb-multi-comment")!.addEventListener("click", () => {
      if (selected.length) showMultiPopover();
    });
    multiBar.querySelector(".cs-fb-multi-quit")!.addEventListener("click", exitMulti);
  }

  function updateMultiBar() {
    if (!multiBar) return;
    const n = selected.length;
    multiBar.querySelector(".cs-fb-multi-count")!.textContent =
      n === 0 ? "Aucun élément" : `${n} élément${n > 1 ? "s" : ""} sélectionné${n > 1 ? "s" : ""}`;
  }

  // ── Popovers ──────────────────────────────────────────────────────────────

  function closePopover() {
    popover?.remove();
    popover = null;
  }

  function showPopover(target: Element, x: number, y: number) {
    closePopover();
    const selector = describeElement(target);
    const context = window.location.pathname;

    popover = document.createElement("div");
    popover.className = "cs-fb-popover";
    popover.innerHTML = `
      <div class="cs-fb-pop-header">
        <code class="cs-fb-pop-target">${esc(selector)}</code>
        <button class="cs-fb-pop-close">✕</button>
      </div>
      <select class="cs-fb-pop-section">${SECTIONS.map((s) => `<option>${s}</option>`).join("")}</select>
      <textarea class="cs-fb-pop-ta" placeholder="Bug observé, suggestion, note…"></textarea>
      <div class="cs-fb-pop-actions">
        <button class="cs-fb-pop-save">✓ Sauvegarder</button>
        <button class="cs-fb-pop-cancel">Annuler</button>
      </div>
    `;
    document.body.appendChild(popover);

    const pw = 320;
    const ph = 244;
    popover.style.left = `${Math.max(8, Math.min(x + 14, window.innerWidth - pw - 8))}px`;
    popover.style.top = `${Math.max(8, Math.min(y + 14, window.innerHeight - ph - 8))}px`;

    popover.querySelector(".cs-fb-pop-close")!.addEventListener("click", closePopover);
    popover.querySelector(".cs-fb-pop-cancel")!.addEventListener("click", closePopover);
    popover.querySelector(".cs-fb-pop-save")!.addEventListener("click", () => {
      const note = (popover!.querySelector(".cs-fb-pop-ta") as HTMLTextAreaElement).value.trim();
      const section = (popover!.querySelector(".cs-fb-pop-section") as HTMLSelectElement).value;
      if (!note) return;
      void save({ selector, context, section, note, isMulti: false });
      closePopover();
      miniToast("✓ Note envoyée");
    });
    setTimeout(() => (popover?.querySelector(".cs-fb-pop-ta") as HTMLTextAreaElement)?.focus(), 40);
  }

  function showMultiPopover() {
    closePopover();
    const selectors = selected.map(describeElement);
    const context = window.location.pathname;

    popover = document.createElement("div");
    popover.className = "cs-fb-popover cs-fb-popover-multi";
    popover.innerHTML = `
      <div class="cs-fb-pop-header">
        <span class="cs-fb-pop-target">⊞ ${selectors.length} éléments</span>
        <button class="cs-fb-pop-close">✕</button>
      </div>
      <div class="cs-fb-multi-selectors">${selectors.map((s) => `<code class="cs-fb-multi-sel-item">${esc(s)}</code>`).join("")}</div>
      <select class="cs-fb-pop-section">${SECTIONS.map((s) => `<option>${s}</option>`).join("")}</select>
      <textarea class="cs-fb-pop-ta" placeholder="Note sur ces ${selectors.length} éléments…"></textarea>
      <div class="cs-fb-pop-actions">
        <button class="cs-fb-pop-save">✓ Sauvegarder</button>
        <button class="cs-fb-pop-cancel">Annuler</button>
      </div>
    `;
    document.body.appendChild(popover);

    const pw = 360;
    popover.style.width = `${pw}px`;
    popover.style.left = `${Math.max(8, (window.innerWidth - pw) / 2)}px`;
    popover.style.top = `${Math.max(8, Math.floor(window.innerHeight * 0.2))}px`;

    popover.querySelector(".cs-fb-pop-close")!.addEventListener("click", closePopover);
    popover.querySelector(".cs-fb-pop-cancel")!.addEventListener("click", closePopover);
    popover.querySelector(".cs-fb-pop-save")!.addEventListener("click", () => {
      const note = (popover!.querySelector(".cs-fb-pop-ta") as HTMLTextAreaElement).value.trim();
      const section = (popover!.querySelector(".cs-fb-pop-section") as HTMLSelectElement).value;
      if (!note) return;
      void save({ selector: selectors.join(" · "), context, section, note, isMulti: true });
      closePopover();
      const n = selectors.length;
      exitMulti();
      miniToast(`✓ Note envoyée (${n} éléments)`);
    });
    setTimeout(() => (popover?.querySelector(".cs-fb-pop-ta") as HTMLTextAreaElement)?.focus(), 40);
  }

  async function save(entry: { selector: string; context: string; section: string; note: string; isMulti: boolean }) {
    try {
      await createFeedback(entry);
    } catch {
      miniToast("✕ Échec de l'envoi — réessaie plus tard");
    }
  }

  function miniToast(msg: string) {
    const t = document.createElement("div");
    t.className = "cs-fb-mini-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  return {
    destroy() {
      if (active) toggle();
      btn.removeEventListener("pointerdown", onPointerDown);
      btn.removeEventListener("pointermove", onPointerMove);
      btn.removeEventListener("pointerup", onPointerUp);
      btn.remove();
      popover?.remove();
      multiBar?.remove();
    },
  };
}

export function FeedbackButton() {
  const { user } = useAuth();
  const controllerRef = useRef<ReturnType<typeof createFeedbackController> | null>(null);

  useEffect(() => {
    if (!user) return;
    ensureStyle();
    controllerRef.current = createFeedbackController();
    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [user]);

  return null;
}
