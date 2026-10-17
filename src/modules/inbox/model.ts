export type Status = 'waiting_queue' | 'assigned' | 'waiting_customer' | 'resolved';
export type Message = { id: string; kind: 'contact' | 'agent' | 'bot' | 'note' | 'system'; body: string; time: string };
export type Ticket = { id: string; threadId: string; name: string; initials: string; color: string; channel: 'WhatsApp' | 'Webchat'; unit: string; department: string; status: Status; assignee?: string; botPaused: boolean; unread: number; priority: boolean; tags: string[]; messages: Message[]; transfer?: { destination: string; note: string }; version: number };
export type Action = { type: 'claim' | 'resolve' | 'reopen' | 'wait' | 'return'; id: string } | { type: 'message'; id: string; body: string; internal: boolean; time: string; messageId: string } | { type: 'transfer'; id: string; destination: string; note: string } | { type: 'tag'; id: string; tag: string };
export const statusLabels: Record<Status,string> = { waiting_queue: 'Na fila', assigned: 'Em atendimento', waiting_customer: 'Aguardando cliente', resolved: 'Concluído' };
// Local simulation only. This reducer is NOT an authorization boundary or a database transaction.
export function reduceTickets(tickets: Ticket[], action: Action): Ticket[] {
  return tickets.map(t => {
    if (t.id !== action.id) return t;
    const owned = t.assignee === 'Você' && t.status !== 'resolved';
    let patch: Partial<Ticket>;
    switch (action.type) {
      case 'claim':
        if (t.status !== 'waiting_queue' || t.assignee) return t;
        patch = { status: 'assigned', assignee: 'Você', botPaused: true, unread: 0 }; break;
      case 'resolve':
        if (!owned || t.transfer) return t;
        patch = { status: 'resolved', botPaused: true }; break;
      case 'reopen':
        if (t.status !== 'resolved') return t;
        patch = { status: 'assigned', assignee: 'Você', botPaused: true }; break;
      case 'wait':
        if (!owned || t.transfer) return t;
        patch = { status: 'waiting_customer' }; break;
      case 'return':
        if (!owned || t.transfer) return t;
        patch = { status: 'waiting_queue', assignee: undefined, botPaused: true }; break;
      case 'transfer':
        if (!owned || t.transfer || !action.destination.trim()) return t;
        patch = { transfer: { destination: action.destination, note: action.note.slice(0,1000) } }; break;
      case 'tag':
        if (!owned || !action.tag.trim() || t.tags.includes(action.tag.trim())) return t;
        patch = { tags: [...t.tags, action.tag.trim().slice(0,30)] }; break;
      case 'message':
        if (!owned || !action.body.trim() || action.body.length > 4096 || t.messages.some(m => m.id === action.messageId)) return t;
        patch = { messages: [...t.messages, { id: action.messageId, kind: action.internal ? 'note' : 'agent', body: action.body.trim(), time: action.time }], status: 'assigned' }; break;
    }
    return { ...t, ...patch, version: t.version + 1 };
  });
}
