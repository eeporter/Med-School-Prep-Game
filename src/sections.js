// Which home sections are folded away, remembered per device. Anything not
// listed (first visit, storage blocked or cleared) starts open.

export const SECTIONS_KEY = 'med-prep-sections';

export function closedSections(stored) {
  try {
    const list = JSON.parse(stored);
    return new Set(Array.isArray(list) ? list.filter((id) => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

export const sectionsValue = (closed) => JSON.stringify([...closed]);
