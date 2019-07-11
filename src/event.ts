export interface NetworkEvent {
    readonly message: string;
    readonly type: NetworkEventType;
    readonly metadata?: string;
}

export enum NetworkEventType {
    connectedToNetwork,
    connectionClosed,
    connectedToPeer
}