import type { GuestbookConfig } from "@shared/types/api";
import { DrawingCanvas, createToolbar } from "./drawing/canvas";
import { submitEntry } from "./api";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT_DESKTOP = 250;
const CANVAS_HEIGHT_MOBILE = 300;

export function openModal(
  shadowRoot: ShadowRoot,
  guestbookId: string,
  config: GuestbookConfig,
  onSuccess: () => void
) {
  const settings = config.settings;

  // Backdrop
  const backdrop = document.createElement("div");
  backdrop.className = "sb-modal-backdrop";
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  backdrop.setAttribute("aria-label", "Sign the guestbook");

  // Modal panel
  const modal = document.createElement("div");
  modal.className = "sb-modal";

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "sb-modal-close";
  closeBtn.textContent = "×";
  closeBtn.setAttribute("aria-label", "Close");
  modal.appendChild(closeBtn);

  // Title
  const title = document.createElement("h2");
  title.className = "sb-modal-title";
  title.textContent = settings.cta_text;
  modal.appendChild(title);

  // Canvas area
  const canvasArea = document.createElement("div");
  canvasArea.className = "sb-canvas-area";
  canvasArea.style.backgroundColor = settings.canvas_background_color;
  modal.appendChild(canvasArea);

  const canvasHeight = window.innerWidth < 768 ? CANVAS_HEIGHT_MOBILE : CANVAS_HEIGHT_DESKTOP;
  const canvas = new DrawingCanvas(canvasArea, CANVAS_WIDTH, canvasHeight, () => {
    updateSubmitState();
  });

  // Toolbar
  createToolbar(modal, canvas);

  // Form fields
  const form = document.createElement("div");
  form.className = "sb-form";

  // Name
  const nameInput = createInput("Your name *", "name", true, 100);
  form.appendChild(nameInput.wrapper);

  // Message (conditional)
  let messageInput: ReturnType<typeof createInput> | null = null;
  if (settings.show_message_field) {
    messageInput = createInput("Message (optional)", "message", false, 200);
    form.appendChild(messageInput.wrapper);
  }

  // Link (conditional)
  let linkInput: ReturnType<typeof createInput> | null = null;
  if (settings.show_link_field) {
    linkInput = createInput("Link (optional)", "link", false, 500, "url");
    linkInput.input.placeholder = "https://...";
    form.appendChild(linkInput.wrapper);
  }

  // Honeypot
  const hpInput = document.createElement("input");
  hpInput.type = "text";
  hpInput.name = "_hp";
  hpInput.tabIndex = -1;
  hpInput.autocomplete = "off";
  hpInput.style.cssText =
    "position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden";
  form.appendChild(hpInput);

  // Error message
  const errorEl = document.createElement("p");
  errorEl.className = "sb-error";
  errorEl.style.display = "none";
  form.appendChild(errorEl);

  // Submit button
  const submitBtn = document.createElement("button");
  submitBtn.className = "sb-submit";
  submitBtn.textContent = "Submit";
  submitBtn.disabled = true;
  form.appendChild(submitBtn);

  modal.appendChild(form);
  backdrop.appendChild(modal);
  shadowRoot.appendChild(backdrop);

  // Lock body scroll
  document.body.style.overflow = "hidden";

  // Focus management
  requestAnimationFrame(() => nameInput.input.focus());

  // State
  let submitting = false;

  function updateSubmitState() {
    submitBtn.disabled =
      canvas.isEmpty() || !nameInput.input.value.trim() || submitting;
  }

  nameInput.input.addEventListener("input", updateSubmitState);

  // Keyboard shortcut: Ctrl/Cmd+Z for undo
  function onKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      canvas.undo();
    }
    if (e.key === "Escape") {
      close();
    }
  }
  backdrop.addEventListener("keydown", onKeydown);

  // Close handlers
  function close() {
    canvas.destroy();
    document.body.style.overflow = "";
    backdrop.remove();
  }

  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  // Submit handler
  submitBtn.addEventListener("click", async () => {
    if (submitting || canvas.isEmpty() || !nameInput.input.value.trim()) return;

    submitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    errorEl.style.display = "none";

    const result = await submitEntry(guestbookId, {
      name: nameInput.input.value.trim(),
      message: messageInput?.input.value.trim() || undefined,
      link: linkInput?.input.value.trim() || undefined,
      stroke_data: canvas.getDrawingData(),
      _hp: hpInput.value || undefined,
    });

    if (result.ok) {
      // Store deletion token in localStorage
      try {
        const key = `sb_del_${result.data.id}`;
        localStorage.setItem(key, result.data.deletion_token);
      } catch {
        // localStorage not available
      }

      // Show success
      modal.innerHTML = `
        <div class="sb-success">
          <p class="sb-success-text">Thanks for signing!</p>
        </div>
      `;

      setTimeout(() => {
        close();
        onSuccess();
      }, 1500);
    } else {
      submitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
      errorEl.textContent = result.error.error || "Something went wrong";
      errorEl.style.display = "block";
    }
  });

  // Focus trap
  const focusableSelector =
    'button, input, [tabindex]:not([tabindex="-1"])';
  backdrop.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const focusable = Array.from(
      modal.querySelectorAll<HTMLElement>(focusableSelector)
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

function createInput(
  label: string,
  name: string,
  required: boolean,
  maxLength: number,
  type = "text"
) {
  const wrapper = document.createElement("div");
  wrapper.className = "sb-field";

  const labelEl = document.createElement("label");
  labelEl.className = "sb-label";
  labelEl.textContent = label;

  const input = document.createElement("input");
  input.type = type;
  input.name = name;
  input.required = required;
  input.maxLength = maxLength;
  input.className = "sb-input";
  input.autocomplete = "off";

  labelEl.appendChild(input);
  wrapper.appendChild(labelEl);

  return { wrapper, input };
}
