export type ArtifactType = 'spec' | 'ticket' | 'execution';

export interface GetSpecsRequest {
  type: 'getSpecs';
}

export interface GetTicketsRequest {
  type: 'getTickets';
  specId?: string;
}

export interface GetExecutionsRequest {
  type: 'getExecutions';
}

export interface OpenArtifactRequest {
  type: 'openArtifact';
  artifactType: ArtifactType;
  id: string;
}

export interface CreateSpecRequest {
  type: 'createSpec';
}

export interface CreateTicketRequest {
  type: 'createTicket';
  specId?: string;
}

export interface RefreshRequest {
  type: 'refresh';
}

export type RequestMessage =
  | GetSpecsRequest
  | GetTicketsRequest
  | GetExecutionsRequest
  | OpenArtifactRequest
  | CreateSpecRequest
  | CreateTicketRequest
  | RefreshRequest;

export interface SpecData {
  id: string;
  epicId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  author?: string;
  tags: string[];
  ticketCount: number;
  ticketIds: string[];
}

export interface TicketData {
  id: string;
  epicId: string;
  specId: string;
  specTitle?: string;
  title: string;
  status: string;
  priority: string;
  assignee?: string;
  estimatedEffort?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface ExecutionData {
  id: string;
  epicId: string;
  agentType: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  specCount: number;
  specIds: string[];
  specTitles: string[];
  ticketCount: number;
  ticketIds: string[];
}

export interface SpecsResponse {
  type: 'specsResponse';
  data: SpecData[];
}

export interface TicketsResponse {
  type: 'ticketsResponse';
  data: TicketData[];
}

export interface ExecutionsResponse {
  type: 'executionsResponse';
  data: ExecutionData[];
}

export interface ErrorResponse {
  type: 'error';
  message: string;
}

export interface RefreshResponse {
  type: 'refresh';
}

export type ResponseMessage =
  | SpecsResponse
  | TicketsResponse
  | ExecutionsResponse
  | ErrorResponse
  | RefreshResponse;
