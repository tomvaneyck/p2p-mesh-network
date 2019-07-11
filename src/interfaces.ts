import { ReactiveQueue } from './Reactive/ReactiveQueue';

export interface Message {
    // uid?: MessageUid,
    header: MessageHeader,
    body?: any
}

export interface MessageUid {
    sourceNodeUuid: string,
    index: number
}

export interface MessageHeader {
    type: MessageType,
    sourceAddress: string,
    destinationAddress?: string,
    index?: number,
    ttl?: number
}

export enum MessageType {
    // network_state,
    // network_state_request,
    unicast,
    broadcast,
    new_edge,
    // destroy_edge,
    // announcement,
    ack
}

export interface MessageQueue {
    sendQueue: ReactiveQueue<Message>,
    receiveQueue: ReactiveQueue<Message>
}
