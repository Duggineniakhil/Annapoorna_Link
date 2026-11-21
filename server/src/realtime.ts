import type { Response } from "express";

export interface LiveEvent {
  type: "listing_status" | "offer" | "task";
  listing_id: string;
  status: string;
  at: string;
}

export const MAX_STREAMS_PER_USER = 5;

// Per-user SSE connection registry. Events carry ids and status only: never codes or personal data.
export class Hub {
  private readonly conns = new Map<string, Set<Response>>();

  add(userId: string, res: Response): () => void {
    const set = this.conns.get(userId) ?? new Set<Response>();
    // Cap open streams per user so one account can't pin unlimited sockets; the oldest is dropped.
    while (set.size >= MAX_STREAMS_PER_USER) {
      const oldest = set.values().next().value as Response;
      set.delete(oldest);
      oldest.end();
    }
    set.add(res);
    this.conns.set(userId, set);
    return () => {
      set.delete(res);
      if (set.size === 0) this.conns.delete(userId);
    };
  }

  publish(userIds: Iterable<string>, ev: LiveEvent): void {
    const line = `data: ${JSON.stringify(ev)}\n\n`;
    for (const id of new Set(userIds)) {
      for (const res of this.conns.get(id) ?? []) res.write(line);
    }
  }

  closeAll(): void {
    for (const set of this.conns.values()) for (const res of set) res.end();
    this.conns.clear();
  }
}
