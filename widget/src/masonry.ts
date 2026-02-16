const GAP = 12;

function getColumnCount(width: number): number {
  if (width < 480) return 1;
  if (width < 768) return 2;
  if (width < 1024) return 3;
  return 4;
}

export function layoutMasonry(
  container: HTMLElement,
  items: HTMLElement[]
): void {
  const width = container.offsetWidth;
  if (!width || items.length === 0) return;

  const cols = getColumnCount(width);
  const colWidth = (width - GAP * (cols - 1)) / cols;
  const heights = new Array(cols).fill(0);

  for (const item of items) {
    item.style.position = "absolute";
    item.style.width = `${colWidth}px`;

    // Find shortest column
    let shortest = 0;
    for (let i = 1; i < cols; i++) {
      if (heights[i] < heights[shortest]) shortest = i;
    }

    const x = shortest * (colWidth + GAP);
    const y = heights[shortest];

    item.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    heights[shortest] += item.offsetHeight + GAP;
  }

  container.style.height = `${Math.max(...heights)}px`;
}

export function createMasonryObserver(
  container: HTMLElement,
  getItems: () => HTMLElement[]
): ResizeObserver {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const observer = new ResizeObserver(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      layoutMasonry(container, getItems());
    }, 150);
  });

  observer.observe(container);
  return observer;
}
