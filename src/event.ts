export interface MeshEvent {
    readonly message: string;
    readonly type: MeshEventType;
    readonly metadata?: any;
    // TODO: Add error for stack trace purposes.
}

export enum MeshEventType {
    connectedToNetwork,
    connectionClosed,
    connectedToPeer,
    outOfBufferBounds,
    malformedMessage
}