import { NetworkEntity } from './network/network';
import { Subject, ReplaySubject } from 'rxjs';
import { Message } from './message';
import { MeshEvent } from './event';
export declare class TransportEntity {
    private address;
    incomingMessages: Subject<Message>;
    events: ReplaySubject<MeshEvent>;
    private _broadcastMessageIndex;
    private readonly broadcastMessageIndex;
    private messageBuffers;
    private networkEntity;
    constructor(address: string, networkEntity: NetworkEntity);
    sendMessage(message: Message): void;
    private handleUnicastMessage;
    /**
     * Take appropriate action based on message type.
     */
    private handleIncomingMessage;
    /**
     * Handles incoming acknowledgements.
     */
    private handleAcknowledgement;
    /**
     * Handles message when this node is the destination node of the message.
     */
    private handleReceivedUnicastMessage;
}
