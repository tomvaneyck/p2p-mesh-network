import { TransportEntity } from './transport';
import { Subject } from 'rxjs';
import { Message, MessageType } from './message';
import { NetworkEntity } from './network/network';
import { MeshEventType, MeshEvent } from './event';

interface MeshNetwork {
    readonly address: string,
    readonly networkTopography: Map<string, Set<string>>,

    onMessageReceived(callback: (source: string, msg: any) => void): void,
    onConnectedToNetwork(callback: (address: string) => void): void;
    onDisconnectedFromNetwork(callback: () => void): void;
    onConnectedToPeer(callback: (address: string) => void): void;
    onNetworkChange(callback: () => void): void;

    connectToPeer(address: string): void;

    sendData(data: any): void;
    sendData(data: any, destinationAddress: string): void;
    sendData(data: any, destinationAddress?: string): void;
}

export class Node implements MeshNetwork {
    private readonly _address: string = this.generateUuidv4();
    public get address() {
        return this._address;
    }

    private receivedMessages = new Subject<Message>();
    public onMessageReceived(callback: (source: string, msg: any) => void) {
        this.receivedMessages.subscribe((message: Message) => {
            callback(message.header.sourceAddress, message.body);
        });
    }
    private connectionToNetwork = new Subject<boolean>();
    public onConnectedToNetwork(callback: (address: string) => void) {
        this.connectionToNetwork.subscribe((connected: boolean) => {
            if (connected) {
                callback(this.address);
            }
        });
    }
    public onDisconnectedFromNetwork(callback: () => void) {
        this.connectionToNetwork.subscribe((connected: boolean) => {
            if (!connected) {
                callback();
            }
        });
    }
    private connectionsToPeer = new Subject<string>();
    public onConnectedToPeer(callback: (address: string) => void) {
        this.connectionsToPeer.subscribe((address: string) => {
            callback(address);
        });
    }
    private networkChange = new Subject<undefined>();
    public onNetworkChange(callback: () => void) {
        this.networkChange.subscribe(() => {
            callback();
        });
    }

    private transportEntity: TransportEntity;
    private networkEntitity: NetworkEntity;

    public get networkTopography() {
        return this.networkEntitity.networkTopography;
    }

    constructor() {
        this.networkEntitity = new NetworkEntity(this.address);
        this.transportEntity = new TransportEntity(
            this.address,
            this.networkEntitity
        );
        this.transportEntity.incomingMessages.subscribe((message: Message) => {
            this.receivedMessages.next(message);
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
                default:
                    console.log(event.message, event);
            }
        });

        this.networkEntitity.events.subscribe((event: MeshEvent) => {
            switch (event.type) {
                case MeshEventType.connectedToNetwork:
                    this.connectionToNetwork.next(true);
                    break;
                case MeshEventType.connectedToPeer:
                    this.connectionsToPeer.next(event.metadata);
                    break;
                case MeshEventType.disconnectedFromNetwork:
                    this.connectionToNetwork.next(false);
                    break;
                case MeshEventType.networkChange:
                    this.networkChange.next();
                    break;
                default:
                    console.log(event.message, event);
            }
        });
    }

    public connectToPeer(address: string): void {
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