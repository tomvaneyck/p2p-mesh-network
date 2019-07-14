import { ReactiveQueue } from './Reactive/ReactiveQueue';

export interface Message {
    // uid?: MessageUid,
    header: MessageHeader,
    body?: any
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

export interface NetworkStateMessage extends Message {
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

// export interface MessageUid {
//     sourceNodeUuid: string,
//     index: number
// }

export interface MessageHeader {
    type: MessageType,
    sourceAddress: string,
    destinationAddress?: string,
    index?: number,
    ttl?: number
}

export enum MessageType {
    networkState,
    networkStateRequest,
    unicast,
    broadcast,
    connectNode,
    disconnectNode,
    // new_edge,
    // destroy_edge,
    // announcement,
    acknowledgement
}

export interface MessageQueue {
    sendQueue: ReactiveQueue<Message>,
    receiveQueue: ReactiveQueue<Message>
}
