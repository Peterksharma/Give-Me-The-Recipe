/**
 * Recent-recipe history, persisted in localStorage.
 *
 * Invariants of the stored list: most recent first, one entry per URL,
 * never more than MAX_RECENT entries. Every mutator maintains these,
 * persists the result, and returns the new list (entries themselves are
 * never mutated), so React state and storage stay in step.
 *
 * localStorage can be absent (SSR) or throw (private browsing, full
 * quota); every access is guarded, and failure degrades to "no history".
 */

const STORAGE_KEY = 'gmtr:recent-recipes';
const MAX_RECENT = 12;

const persist = (list) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
        // history is a convenience; losing it is not an error
    }
    return list;
};

/** Load the saved list, tolerating missing or corrupted storage. */
export const loadRecents = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        return Array.isArray(parsed)
            ? parsed.filter((e) => e && typeof e.url === 'string' && typeof e.title === 'string')
            : [];
    } catch {
        return [];
    }
};

/** Record a lookup: moves the URL to the front, capped at MAX_RECENT. */
export const addRecent = (list, { url, title }) =>
    persist([{ url, title }, ...list.filter((e) => e.url !== url)].slice(0, MAX_RECENT));

/** Remove one entry by URL. */
export const removeRecent = (list, url) => persist(list.filter((e) => e.url !== url));

/** Forget everything. */
export const clearRecents = () => persist([]);
