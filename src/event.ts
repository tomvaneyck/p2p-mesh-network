export interface MeshEvent {
    readonly type: MeshEventType;
    readonly message: string;
    readonly metadata?: any;
    // TODO: Add error for stack trace purposes.
}

export enum MeshEventType {
    connectedToNetwork,
    disconnectedFromNetwork,
    connectedToPeer,
    disconnectedFromPeer,
    connectionToPeerRejected,
    networkChange,
    outOfBufferBounds,
    malformedMessage,
    timeOut
}