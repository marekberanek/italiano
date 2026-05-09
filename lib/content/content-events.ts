type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeContentUpdated(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitContentUpdated(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // Ignore listener failures.
    }
  }
}
