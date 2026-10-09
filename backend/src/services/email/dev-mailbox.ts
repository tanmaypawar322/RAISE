export interface DevMailboxItem {
  id: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  sentAt: Date;
}

const MAX_ITEMS = 20;
const mailbox: DevMailboxItem[] = [];

export function recordDevEmail(item: Omit<DevMailboxItem, 'id' | 'sentAt'>): DevMailboxItem {
  const entry: DevMailboxItem = {
    ...item,
    id: `email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sentAt: new Date(),
  };

  mailbox.unshift(entry);
  if (mailbox.length > MAX_ITEMS) {
    mailbox.pop();
  }

  return entry;
}

export function getDevMailbox(): DevMailboxItem[] {
  return [...mailbox];
}

export function clearDevMailbox(): void {
  mailbox.length = 0;
}
