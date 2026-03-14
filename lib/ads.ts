let searchCount = 0;
let adShownThisSession = false;

export function incrementSearchCount(): number {
  searchCount += 1;
  return searchCount;
}

export function getSearchCount(): number {
  return searchCount;
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
