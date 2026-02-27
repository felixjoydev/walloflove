import type { GuestbookConfig, EntryResponse } from "@shared/types/api";
import type { DrawingData } from "@shared/types/drawing";
import { setBaseUrl, fetchConfig, fetchEntries, deleteEntry } from "./api";
import { strokeDataToDataUri } from "./drawing/stroke-to-svg";
import { layoutMasonry, createMasonryObserver } from "./masonry";
import styles from "./styles.css?inline";

const MAX_RENDERED_ENTRIES = 100;
const POLL_INTERVAL = 30_000;

class GuestbookWidget {
  #host: HTMLElement;
  #shadow: ShadowRoot;
  #root: HTMLElement;
  #guestbookId: string;
  #config: GuestbookConfig | null = null;
  #entries: EntryResponse[] = [];
  #cursor: string | null = null;
  #hasMore = true;
  #loading = false;
  #pollTimer: ReturnType<typeof setInterval> | null = null;
  #resizeObserver: ResizeObserver | null = null;
  #wallContainer: HTMLElement | null = null;
  #sentinelObserver: IntersectionObserver | null = null;

  constructor(host: HTMLElement, guestbookId: string) {
    this.#host = host;
    this.#guestbookId = guestbookId;
    this.#shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = styles;
    this.#shadow.appendChild(style);

    this.#root = document.createElement("div");
    this.#root.className = "sb-root";
    this.#root.setAttribute("role", "region");
    this.#root.setAttribute("aria-label", "Guestbook");
    this.#shadow.appendChild(this.#root);

    this.#renderSkeleton();
    this.#init();
  }

  async #init() {
    const [configResult, entriesResult] = await Promise.all([
      fetchConfig(this.#guestbookId),
      fetchEntries(this.#guestbookId),
    ]);

    if (!configResult.ok) {
      this.#renderError();
      return;
    }

    this.#config = configResult.data;

    if (entriesResult.ok && entriesResult.data) {
      this.#entries = entriesResult.data.entries;
      this.#cursor = entriesResult.data.cursor;
      this.#hasMore = this.#cursor !== null;
    }

    this.#render();
    this.#startPolling();
  }

  #renderSkeleton() {
    this.#root.innerHTML = `
      <div class="sb-skeleton">
        <div class="sb-skeleton-card"></div>
        <div class="sb-skeleton-card"></div>
        <div class="sb-skeleton-card"></div>
      </div>
    `;
    this.#root.style.minHeight = "200px";
  }

  #renderError() {
    this.#root.innerHTML = "";
    this.#root.style.minHeight = "0";
  }

  #render() {
    if (!this.#config) return;

    const settings = this.#config.settings;
    this.#root.innerHTML = "";

    // Apply theme
    this.#root.style.setProperty("--sb-bg", settings.background_color);
    this.#root.style.setProperty("--sb-card-bg", settings.card_background_color);
    this.#root.style.setProperty("--sb-text", settings.text_color);
    this.#root.style.setProperty("--sb-accent", settings.accent_color);
    this.#root.style.setProperty(
      "--sb-card-radius",
      `${settings.card_border_radius}px`
    );
    this.#root.style.setProperty(
      "--sb-font",
      settings.font === "handwriting"
        ? '"Caveat", cursive'
        : settings.font === "mono"
        ? "monospace"
        : "system-ui, sans-serif"
    );
    this.#root.style.backgroundColor = settings.widget_transparent_bg
      ? "transparent"
      : settings.background_color;

    // Wall container
    this.#wallContainer = document.createElement("div");
    this.#wallContainer.className = "sb-wall";
    this.#wallContainer.setAttribute("role", "list");
    this.#wallContainer.setAttribute("aria-label", "Guestbook entries");
    this.#root.appendChild(this.#wallContainer);

    if (this.#entries.length === 0) {
      this.#renderEmptyState();
    } else {
      this.#renderEntries();
    }

    // CTA button
    const cta = document.createElement("button");
    cta.className = "sb-cta";
    cta.textContent = settings.cta_text;
    cta.setAttribute("aria-label", settings.cta_text);
    cta.addEventListener("click", () => this.#openDrawingModal());
    this.#root.appendChild(cta);

    // Branding (free tier)
    if (this.#config.branding) {
      const branding = document.createElement("a");
      branding.className = "sb-branding";
      branding.href = "https://guestbook.cv";
      branding.target = "_blank";
      branding.rel = "noopener noreferrer";
      branding.textContent = "Powered by Guestbook";
      this.#root.appendChild(branding);
    }
  }

  #renderEmptyState() {
    if (!this.#wallContainer) return;
    this.#wallContainer.innerHTML = `
      <div class="sb-empty">
        <p class="sb-empty-text">Be the first to sign!</p>
      </div>
    `;
  }

  #renderEntries() {
    if (!this.#wallContainer) return;
    this.#wallContainer.innerHTML = "";

    const limit = Math.min(this.#entries.length, MAX_RENDERED_ENTRIES);
    const cards: HTMLElement[] = [];

    for (let i = 0; i < limit; i++) {
      const entry = this.#entries[i];
      const card = this.#createEntryCard(entry);
      this.#wallContainer.appendChild(card);
      cards.push(card);
    }

    if (this.#entries.length > MAX_RENDERED_ENTRIES) {
      const overflow = document.createElement("div");
      overflow.className = "sb-overflow";
      overflow.textContent = `+ ${this.#entries.length - MAX_RENDERED_ENTRIES} more entries`;
      this.#wallContainer.appendChild(overflow);
    }

    // Set up masonry after cards are in DOM
    requestAnimationFrame(() => {
      if (!this.#wallContainer) return;
      layoutMasonry(this.#wallContainer, cards);
      this.#resizeObserver?.disconnect();
      this.#resizeObserver = createMasonryObserver(
        this.#wallContainer,
        () =>
          Array.from(
            this.#wallContainer!.querySelectorAll<HTMLElement>(".sb-card")
          )
      );
    });

    // Lazy load sentinel
    if (this.#hasMore && limit < MAX_RENDERED_ENTRIES) {
      this.#setupLazyLoadSentinel();
    }
  }

  #createEntryCard(entry: EntryResponse): HTMLElement {
    const card = document.createElement("div");
    card.className = "sb-card";
    card.setAttribute("role", "listitem");

    const strokeData = entry.stroke_data as unknown as DrawingData;
    const imgSrc = strokeDataToDataUri(strokeData);

    const img = document.createElement("img");
    img.src = imgSrc;
    img.width = strokeData.width;
    img.height = strokeData.height;
    img.alt = `Drawing by ${entry.name}`;
    img.className = "sb-card-img";
    img.loading = "lazy";
    card.appendChild(img);

    const nameEl = document.createElement("p");
    nameEl.className = "sb-card-name";
    nameEl.textContent = entry.name;
    card.appendChild(nameEl);

    if (entry.message) {
      const msgEl = document.createElement("p");
      msgEl.className = "sb-card-message";
      msgEl.textContent = entry.message;
      card.appendChild(msgEl);
    }

    if (entry.link) {
      const wrapper = document.createElement("a");
      wrapper.href = entry.link;
      wrapper.target = "_blank";
      wrapper.rel = "noopener noreferrer";
      wrapper.className = "sb-card-link";
      wrapper.setAttribute("aria-label", `Visit ${entry.name}'s link`);

      const linkIcon = document.createElement("span");
      linkIcon.className = "sb-link-icon";
      linkIcon.textContent = "↗";
      wrapper.appendChild(linkIcon);

      card.appendChild(wrapper);
    }

    // Self-deletion (if visitor owns this entry)
    try {
      const token = localStorage.getItem(`sb_del_${entry.id}`);
      if (token) {
        const removeBtn = document.createElement("button");
        removeBtn.className = "sb-remove-btn";
        removeBtn.textContent = "Remove";
        removeBtn.setAttribute("aria-label", "Remove your entry");
        removeBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          removeBtn.disabled = true;
          removeBtn.textContent = "Removing...";
          const result = await deleteEntry(this.#guestbookId, entry.id, token);
          if (result.ok) {
            localStorage.removeItem(`sb_del_${entry.id}`);
            this.#refreshEntries();
          } else {
            removeBtn.disabled = false;
            removeBtn.textContent = "Remove";
          }
        });
        card.appendChild(removeBtn);
      }
    } catch {
      // localStorage not available
    }

    return card;
  }

  #setupLazyLoadSentinel() {
    const sentinel = document.createElement("div");
    sentinel.className = "sb-sentinel";
    this.#wallContainer?.appendChild(sentinel);

    this.#sentinelObserver?.disconnect();
    this.#sentinelObserver = new IntersectionObserver(
      async (entries) => {
        if (entries[0]?.isIntersecting && this.#hasMore && !this.#loading) {
          await this.#loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    this.#sentinelObserver.observe(sentinel);
  }

  async #loadMore() {
    if (this.#loading || !this.#hasMore || !this.#cursor) return;
    this.#loading = true;

    const result = await fetchEntries(this.#guestbookId, this.#cursor);
    if (result.ok && result.data) {
      this.#entries.push(...result.data.entries);
      this.#cursor = result.data.cursor;
      this.#hasMore = this.#cursor !== null;
      this.#renderEntries();
    }

    this.#loading = false;
  }

  #startPolling() {
    this.#pollTimer = setInterval(async () => {
      if (document.hidden) return;

      const result = await fetchEntries(this.#guestbookId);
      if (result.ok && result.data && result.data.entries.length > 0) {
        const currentFirst = this.#entries[0]?.id;
        const newFirst = result.data.entries[0]?.id;

        if (currentFirst !== newFirst) {
          this.#entries = result.data.entries;
          this.#cursor = result.data.cursor;
          this.#hasMore = this.#cursor !== null;
          this.#renderEntries();
        }
      }
    }, POLL_INTERVAL);
  }

  async #openDrawingModal() {
    const { openModal } = await import("./modal");
    openModal(this.#shadow, this.#guestbookId, this.#config!, () => {
      // On successful submission, refetch entries
      this.#refreshEntries();
    });
  }

  async #refreshEntries() {
    const result = await fetchEntries(this.#guestbookId);
    if (result.ok && result.data) {
      this.#entries = result.data.entries;
      this.#cursor = result.data.cursor;
      this.#hasMore = this.#cursor !== null;
      this.#renderEntries();
    }
  }

  destroy() {
    if (this.#pollTimer) clearInterval(this.#pollTimer);
    this.#resizeObserver?.disconnect();
    this.#sentinelObserver?.disconnect();
    this.#shadow.innerHTML = "";
  }
}

// Auto-discover and initialize widgets
function initWidgets() {
  // Determine API base URL from script src
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[src*="widget.js"]'
  );
  const lastScript = scripts[scripts.length - 1];
  if (lastScript?.src) {
    const url = new URL(lastScript.src);
    setBaseUrl(url.origin);
  }

  const hosts = document.querySelectorAll<HTMLElement>("[data-sb-id]");
  hosts.forEach((host) => {
    const id = host.getAttribute("data-sb-id");
    if (id && !host.shadowRoot) {
      new GuestbookWidget(host, id);
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWidgets);
} else {
  initWidgets();
}

// Observe for dynamically added widgets
const mutationObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (
        node instanceof HTMLElement &&
        node.hasAttribute("data-sb-id") &&
        !node.shadowRoot
      ) {
        const id = node.getAttribute("data-sb-id");
        if (id) new GuestbookWidget(node, id);
      }
    }
  }
});

let mutationObserverStarted = false;
function startMutationObserver() {
  if (mutationObserverStarted || !document.body) return;
  mutationObserverStarted = true;
  mutationObserver.observe(document.body, { childList: true, subtree: true });
}

if (document.body) {
  startMutationObserver();
} else {
  document.addEventListener("DOMContentLoaded", startMutationObserver, {
    once: true,
  });
}
