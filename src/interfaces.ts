import { ReactiveQueue } from './Reactive/ReactiveQueue';

export interface Message {
    uid: MessageUid,
    header: MessageHeader,
    body?: any
}

export interface MessageUid {
    sourceNodeUuid: string,
    index: number
}

export interface MessageHeader {
    type: MessageType,
    targetPeer?: string,
    ttl?: number
}

export enum MessageType {
    // network_state,
    // network_state_request,
    msg,
    msg_broadcast,
    new_edge,
    // destroy_edge,
    // announcement,
    ack
}

export interface MessageQueue {
    sendQueue: ReactiveQueue<Message>,
    receiveQueue: ReactiveQueue<Message>
}
