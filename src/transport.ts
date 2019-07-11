import { NetworkEntity } from './network';
import { Subject } from 'rxjs';
import { Message, MessageType } from './interfaces';

export class TransportEntity {
    private address: string;

    public incomingMessages: Subject<Message> = new Subject<Message>();
    
    private globalMessageIndex: number = 0;
    
    private networkEntity: NetworkEntity;

    constructor(address: string, networkEntity: NetworkEntity) {
        this.address = address;

        this.networkEntity = networkEntity;
        this.networkEntity.incomingMessages.subscribe((message: Message) => {
            this.incomingMessages.next(message);
        });
    }

    public sendMessage(message: Message) {
        switch(message.header.type) {
            case MessageType.broadcast:
                message.header.index = this.globalMessageIndex;

                this.networkEntity.sendMessage(message);
                break;
            default:
                throw Error("This message is not yet supported by the transport layer.");
        }
    }
}