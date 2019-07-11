import { TransportEntity } from './transport';
import { Subject } from 'rxjs';
import { Message, MessageType } from './interfaces';
import { NetworkEntity } from './network';
import { NetworkEventType, NetworkEvent } from './event';

export class Node {
    private address: string = this.generateUuidv4();
    
    public onMessageReceived: ((source: string, msg: any) => void) = function (source: string, msg: any) { };
    public onConnectedToNetwork: ((address: string) => void) = function (localId: string) { };
    public onConnectedToPeer: ((address: string) => void) = function (localId: string) { };
    public onDisconnectedFromNetwork: (() => void) = function () { };
    
    private transportEntity: TransportEntity;
    private networkEntitity: NetworkEntity;

    private incomingData: Subject<any> = new Subject<any>();

    constructor() {
        this.networkEntitity = new NetworkEntity(this.address);
        this.transportEntity = new TransportEntity(
            this.address,
            this.networkEntitity
        );
        this.transportEntity.incomingMessages.subscribe((message: Message) => {
            this.incomingData.next(message.body);
            this.onMessageReceived(message.header.sourceAddress, message.body);
        });

        this.networkEntitity.events.subscribe((event: NetworkEvent) => {
            switch (event.type) {
                case NetworkEventType.connectedToNetwork:
                    this.onConnectedToNetwork(<string> event.metadata);
                    break;
                case NetworkEventType.connectedToPeer:
                    this.onConnectedToPeer(<string> event.metadata);
                    break;
                case NetworkEventType.connectionClosed:
                    this.onDisconnectedFromNetwork()
                    break;
            }
        });
    }

    public connectToPeer(address: string) {
        this.networkEntitity.connectToPeer(address);
    }
    
    public sendData(data: any): void {
        let message: Message = {
            header: {
                type: MessageType.broadcast,
                sourceAddress: this.address
            },
            body: data
        }
        this.transportEntity.sendMessage(message);
    }

    /**
     * Generates a global unique identifier.
     * @returns A global unique identifier.
     */
    private generateUuidv4(): string {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, function (c: string) {
            let d: number = (c as unknown) as number;
            return (d ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> d / 4).toString(16);
        })
    }
}