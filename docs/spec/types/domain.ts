/** Tipos de referência; converter para schemas Zod e tipos gerados do banco na implementação. */
export type Id = string;
export type TenantId = Id;
export type UnitId = Id;
export type DepartmentId = Id;
export type QueueId = Id;
export type TicketId = Id;
export type UserId = Id;
export type ChannelId = Id;
export type IsoTimestamp = string;
export type Currency = 'BRL' | 'USD' | string;

export type TenantScope = {
  tenantId: TenantId;
  unitId?: UnitId;
  departmentId?: DepartmentId;
  queueId?: QueueId;
};

export type Role = 'platform_owner'|'platform_support'|'tenant_admin'|'network_manager'|'unit_manager'|'supervisor'|'agent'|'finance_agent'|'auditor';
export type Capability =
  | 'inbox.read' | 'message.send' | 'ticket.claim' | 'ticket.transfer'
  | 'ticket.close' | 'contacts.read' | 'contacts.export'
  | 'campaign.create' | 'campaign.approve' | 'integration.manage'
  | 'team.manage' | 'billing.read' | 'collections.confirm';
export type Grant = TenantScope & { userId: UserId; role: Role; capabilities: Capability[] };

export type ChannelType = 'whatsapp_cloud' | 'webchat' | 'email' | 'instagram' | 'messenger';
export type TicketStatus = 'waiting_bot'|'waiting_queue'|'assigned'|'waiting_customer'|'pending'|'resolved'|'closed';
export type TransferStatus = 'pending'|'accepted'|'rejected'|'expired'|'cancelled';
export type IdentityTrust = 'not_found'|'phone_match'|'verified'|'sensitive_verified';
export type LookupResult = {
  contactId?: Id;
  trust: IdentityTrust;
  possibleUnitCount: number; // não divulgar sem nível apropriado de verificação
  candidateUnits?: UnitId[]; // server-only, após autorização/checagem
  provider?: string;
};

export type Ticket = TenantScope & {
  id: TicketId;
  threadId: Id;
  status: TicketStatus;
  assigneeUserId?: UserId;
  version: number;
  priority: 'low'|'normal'|'high'|'urgent';
  botPaused: boolean;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
};

export type TransferRequest = {
  id: Id;
  tenantId: TenantId;
  ticketId: TicketId;
  from: TenantScope;
  to: TenantScope;
  requestedBy: UserId;
  reason?: string;
  status: TransferStatus;
  requestedAt: IsoTimestamp;
};

export type BotNode =
  | {type:'start'|'end'|'fallback'}
  | {type:'message'; text:string}
  | {type:'menu'; choices:Array<{label:string;value:string;next:string}>}
  | {type:'lookup_contact';provider:'local'|'connected_provider'; next:string}
  | {type:'verify_identity'; method:'secure_link'|'approved_step_up'; next:string}
  | {type:'select_unit'; next:string}
  | {type:'tag'; tags:string[]; next:string}
  | {type:'route'; departmentId:DepartmentId; unitId?:UnitId; queueId?:QueueId}
  | {type:'human_handoff'; queueId?:QueueId};

export interface CustomerSystemAdapter {
  provider: string;
  lookupByPhone(tenantId:TenantId, e164:string):Promise<LookupResult>;
  getVerifiedMemberships(tenantId:TenantId, contactId:Id, assurance:string):Promise<UnitId[]>;
  healthCheck(tenantId:TenantId):Promise<'ok'|'degraded'|'down'>;
}

export interface MessagingProvider {
  provider: ChannelType;
  sendMessage(params: {tenantId:TenantId;channelId:ChannelId;recipientId:Id;payload:unknown;idempotencyKey:string}): Promise<{externalId:string;status:string}>;
  parseWebhook(raw:Uint8Array,headers:Record<string,string>):Promise<unknown>;
}

export type CampaignBudget = {
  tenantId:TenantId; currency:Currency; estimatedMinorUnits:number;
  reservedMinorUnits:number; actualMinorUnits:number; maximumMinorUnits:number;
  pricingVersion:string; pricingSource:string;
};
