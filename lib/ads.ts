let searchCount = 0;
let adShownThisSession = false;
const listeners: Array<(count: number) => void> = [];

export function incrementSearchCount(): number {
  searchCount += 1;
  const current = searchCount;
  for (const fn of listeners) fn(current);
  return current;
}

export function getSearchCount(): number {
  return searchCount;
}

export function subscribeSearchCount(fn: (count: number) => void): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function shouldShowAd(frequency: string, count: number): boolean {
  if (count === 0) return false;
  switch (frequency) {
    case "every_search":
      return true;
    case "every_2":
      return count % 2 === 0;
    case "every_5":
      return count % 5 === 0;
    case "once_per_session":
      if (adShownThisSession) return false;
      adShownThisSession = true;
      return true;
    default:
      return true;
  }
}
