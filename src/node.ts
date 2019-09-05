import { TransportEntity } from './transport';
import { Subject } from 'rxjs';
import { Message, MessageType } from './message';
import { NetworkEntity } from './network/network';
import { MeshEventType, MeshEvent } from './event';

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

        this.transportEntity.events.subscribe((event: MeshEvent) => {
            switch (event.type) {
                case MeshEventType.outOfBufferBounds:
                    console.log("Metadata of incoming error:", event.metadata);
                    throw Error(event.message);
                case MeshEventType.malformedMessage:
                    console.log("Metadata of incoming error:", event.metadata);
                    throw Error(event.message);
                case MeshEventType.timeOut:
                    console.log("Metadata of incoming error:", event.metadata);
                    throw Error(event.message);
                    
            }
        });

        this.networkEntitity.events.subscribe((event: MeshEvent) => {
            switch (event.type) {
                case MeshEventType.connectedToNetwork:
                    this.onConnectedToNetwork(<string> event.metadata);
                    break;
                case MeshEventType.connectedToPeer:
                    this.onConnectedToPeer(<string> event.metadata);
                    break;
                case MeshEventType.connectionClosed:
                    this.onDisconnectedFromNetwork()
                    break;
            }
        });
    }

    public connectToPeer(address: string) {
        this.networkEntitity.connectToPeer(address);
    }
    
    public sendData(data: any): void;
    public sendData(data: any, destinationAddress: string): void;
    public sendData(data: any, destinationAddress?: string): void {
        let message: Message;
        if (!destinationAddress) {
            message = {
                header: {
                    type: MessageType.broadcast,
                    sourceAddress: this.address
                },
                body: data
            }
        } else {
            message = {
                header: {
                    type: MessageType.unicast,
                    sourceAddress: this.address,
                    destinationAddress: destinationAddress
                },
                body: data
            }
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