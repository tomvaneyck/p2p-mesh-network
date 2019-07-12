import { Message } from './message';
import Peer, { DataConnection } from "peerjs";
import { Subject, ReplaySubject } from 'rxjs';
import { MeshEvent, MeshEventType } from './event';

export class NetworkEntity {
    private address: string;

    public incomingMessages: Subject<Message> = new Subject<Message>();
    
    private networkConnection: Peer;
    // public isConnected: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public events: ReplaySubject<MeshEvent> = new ReplaySubject<MeshEvent>();
    private connections: { [address: string]: DataConnection} = {};

    constructor(address: string) {
        this.address = address;

        this.networkConnection = new Peer(this.address, {
            // secure: true,
            host: 'localhost',
            key: 'peerjs',
            port: 9000,
            // debug: 3,
            // config: {
            //     'iceServers': [
            //         { urls: 'stun:stun1.l.google.com:19302' }
            //     ]
            // }
        });

        this.networkConnection.on('open', address => {
            this.events.next({
                message: "A connection to the server has been established.",
                type: MeshEventType.connectedToNetwork,
                metadata: address
            });
        });

        this.networkConnection.on('error', e => {
            throw Error(e);
        });
        
        this.networkConnection.on('connection', connection => {
            this.handleNewConnection(connection);
        });

        this.networkConnection.on('close', () => {
            this.events.next({
                message: "The connection to the network has been closed.",
                type: MeshEventType.connectionClosed
            });
        })
    }

    public connectToPeer(address: string) {
        let connection: DataConnection = this.networkConnection.connect(address, { reliable: true });
        connection.on('open', () => {
            this.handleNewConnection(connection);
        });
    }

    /**
     * Handles a new connection to this peer.
     *
     * Adds the new connection to the list of connections and adds the
     * right callbacks.
     * @param connection The new connection.
     */
    private handleNewConnection(connection: DataConnection) {
        this.connections[connection.peer] = connection;

        this.events.next({
            message: "A connection to another peer has been made.",
            type: MeshEventType.connectedToPeer,
            metadata: connection.peer
        });

        connection.on('data', (message: Message) => {
            this.incomingMessages.next(message);
        });
        
        console.log("Connection established between peers.");
        console.log("   this peer: ", this.address);
        console.log("   other peer: ", connection.peer);
        console.log("   connection: ", connection)
    }

    public sendMessage(message: Message): void {
        for (let address in this.connections) {
            this.connections[address].send(message);
        }
    }

    // private receiveMessage(message: Message): void {

    // }
}