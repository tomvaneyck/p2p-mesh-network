export interface MeshEvent {
    readonly type: MeshEventType,
    readonly message: string,
    readonly metadata?: any
    // TODO: Add error for stack trace purposes.
}

export interface NetworkChangeMeshEvent extends MeshEvent {
    readonly type: MeshEventType.networkChange,
    readonly metadata: NetworkChangeEventData
}

export interface NetworkChangeEventData {
    readonly added?: string[],
    readonly removed?: string[],
    readonly connected?: [string, string][],
    readonly disConnected?: [string, string][]
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