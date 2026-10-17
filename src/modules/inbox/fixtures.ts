import type { Ticket } from './model';
// Entirely fictional. No real contact data and no external provider connections.
export function demoTickets(): Ticket[] {
  const names = [
    ['Clara Martins','CM','mint','Quero conhecer as opções para a minha equipe.','Comercial','Matriz'],
    ['Rafael Costa','RC','peach','Vocês conseguem me ajudar com meu pedido?','Suporte','Central'],
    ['Beatriz Lima','BL','violet','Perfeito! Podemos conversar amanhã?','Comercial','Unidade Centro'],
    ['Lucas Ferreira','LF','blue','Gostaria de agendar uma visita.','Comercial','Matriz'],
    ['Ana Oliveira','AO','rose','Obrigada pela atenção, ficou tudo certo!','Suporte','Central'],
    ['Pedro Santos','PS','sand','Qual o horário de atendimento?','Recepção','Unidade Centro'],
    ['Mariana Alves','MA','mint','Tenho uma dúvida sobre os serviços.','Comercial','Central'],
    ['Gabriel Rocha','GR','blue','Vou verificar e retorno para vocês.','Suporte','Matriz'],
  ];
  return names.map(([name, initials, color, body, department, unit], i) => ({
    id: `demo-${i + 1}`, threadId: `thread-demo-${i+1}`, name, initials, color,
    channel: i % 3 === 2 ? 'Webchat' : 'WhatsApp', unit, department,
    status: i === 4 ? 'resolved' : i === 2 || i === 7 ? 'waiting_customer' : i === 1 || i === 3 || i === 6 ? 'waiting_queue' : 'assigned',
    assignee: i === 1 || i === 3 || i === 6 ? undefined : i === 7 ? 'Marina' : 'Você',
    botPaused: i !== 6, unread: i === 1 ? 2 : i === 3 ? 1 : 0, priority: i === 1,
    tags: i === 0 ? ['Novo contato','Orçamento'] : [department === 'Comercial' ? 'Interesse' : 'Atendimento'], version: 1,
    messages: i === 0 ? [
      {id:'c1',kind:'contact',body:'Olá! Tudo bem? Estou procurando uma solução para a minha empresa.',time:'09:41'},
      {id:'c2',kind:'bot',body:'Olá, Clara! Sou a Vi, assistente da Aurora. Como posso ajudar?\n\n1. Conhecer nossos serviços\n2. Falar com o suporte\n3. Outros assuntos',time:'09:41'},
      {id:'c3',kind:'contact',body:'Quero conhecer as opções para a minha equipe.',time:'09:42'},
      {id:'c4',kind:'system',body:'Atendimento direcionado para Comercial · Matriz',time:'09:42'},
      {id:'c5',kind:'note',body:'Contato interessado em uma solução para a equipe. Entender a necessidade antes de apresentar as opções.',time:'09:43'},
      {id:'c6',kind:'agent',body:'Oi, Clara! Sou a Alex, da equipe Aurora. Vou te ajudar 😊\nMe conta um pouco: quantas pessoas fazem parte da sua equipe?',time:'09:44'},
      {id:'c7',kind:'contact',body:'Hoje somos 12 pessoas, mas estamos crescendo!',time:'09:45'},
    ] : [{id:`m-${i}`,kind:'contact',body,time:`09:${44-i}`}],
  }));
}
