import { ReactiveQueue } from './Reactive/ReactiveQueue';

export interface ConnectionAccepted extends Message {
    header: {
        type: MessageType.connectionAccepted,
        sourceAddress: string,
        destinationAddress: string
    }
}

export interface ConnectionRejected extends Message {
    header: {
        type: MessageType.connectionRejected,
        sourceAddress: string,
        destinationAddress: string
    },
    body: {
        newEntryPoint: string
    }
}

export interface EntryPoint extends Message {
    header: {
        type: MessageType.entryPoint,
        sourceAddress: string,
        destinationAddress: string,
    },
    body: {
        EntryPointAddress: string
    }
}

export interface EntryPointRequest extends Message {
    header: {
        type: MessageType.entryPointRequest,
        sourceAddress: string,
        index: number
    }
}

export interface NetworkState extends Message {
    header: {
        type: MessageType.networkState,
        sourceAddress: string,
        index: number
    }
    body: {
        neighbours: string[]
    }
}

export interface NetworkStateRequest extends Message {
    header: {
        type: MessageType.networkStateRequest,
        sourceAddress: string,
        index: number
    }
}

export interface Acknowledgement extends Message {
    header: {
        type: MessageType.acknowledgement,
        sourceAddress: string,
        destinationAddress: string
    },
    body: {
        index: number
    }
}

export enum MessageType {
    connectionAccepted,
    connectionRejected,
    entryPointRequest,
    entryPoint,
    networkState,
    networkStateRequest,
    unicast,
    broadcast,
    acknowledgement
}

export interface Message {
    // uid?: MessageUid,
    header: MessageHeader,
    body?: any
}

export interface MessageHeader {
    type: MessageType,
    sourceAddress: string,
    destinationAddress?: string,
    index?: number,
    ttl?: number
}

export interface MessageQueue {
    sendQueue: ReactiveQueue<Message>,
    receiveQueue: ReactiveQueue<Message>
}
