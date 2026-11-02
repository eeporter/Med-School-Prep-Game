// The How to play box stays open until she hides it, and remembers that per
// device. Its text is plain HTML in index.html, so nothing here renders content.

export const HOWTO_KEY = 'med-prep-howto';

// Anything other than a saved "closed" (first visit, storage blocked or
// cleared) shows the box open.
export const howToStartsOpen = (stored) => stored !== 'closed';

export const howToValue = (open) => (open ? 'open' : 'closed');
