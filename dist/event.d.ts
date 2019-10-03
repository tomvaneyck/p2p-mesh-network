export interface MeshEvent {
    readonly type: MeshEventType;
    readonly message: string;
    readonly metadata?: any;
}
export declare enum MeshEventType {
    connectedToNetwork = 0,
    disconnectedFromNetwork = 1,
    connectedToPeer = 2,
    disconnectedFromPeer = 3,
    connectionToPeerRejected = 4,
    networkChange = 5,
    outOfBufferBounds = 6,
    malformedMessage = 7,
    timeOut = 8
}
