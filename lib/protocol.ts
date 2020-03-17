export const enum PacketType {
  REQUEST,
  RESPONSE,
}

export interface PacketRequest {
  id: number;
  type: PacketType.REQUEST;
  method: string;
  args: any;
}

export interface PacketResponse {
  id: number;
  type: PacketType.RESPONSE;
  error: boolean;
  response: any;
}

export type Packet = PacketRequest | PacketResponse;

export interface Handles {
  [method: string]: (...args: any[]) => any;
}

let id = 0;

export function createResponse(
  id: number,
  error: boolean,
  response: any
): PacketResponse {
  return {
    id,
    error,
    response,
    type: PacketType.RESPONSE,
  };
}

export function createRequest(method: string, args?: any): PacketRequest {
  const req: PacketRequest = {
    id,
    method,
    args,
    type: PacketType.REQUEST,
  };

  id++;

  return req;
}
