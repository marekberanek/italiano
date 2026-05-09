type Listener = () => void;

const listeners: Listener[] = [];

export function subscribeVocabExternalChange(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function emitVocabExternalChange(): void {
  for (const l of [...listeners]) l();
}
