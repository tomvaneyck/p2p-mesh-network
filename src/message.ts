import { ReactiveQueue } from './Reactive/ReactiveQueue';

export interface Message {
    // uid?: MessageUid,
    header: MessageHeader,
    body?: any
}

export interface Acknowledgement extends Message {
    header: AcknowledgementHeader,
    body: {
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

export interface AcknowledgementHeader {
    type: MessageType.acknowledgement,
    sourceAddress: string,
    destinationAddress: string,
}

export enum MessageType {
    // network_state,
    // network_state_request,
    unicast,
    broadcast,
    new_edge,
    // destroy_edge,
    // announcement,
    acknowledgement
}

export interface MessageQueue {
    sendQueue: ReactiveQueue<Message>,
    receiveQueue: ReactiveQueue<Message>
}
