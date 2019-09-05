import { Message, MessageType, NetworkStateMessage, NetworkStateRequest } from '../message';
import Peer, { DataConnection } from "peerjs";
import { Subject, ReplaySubject } from 'rxjs';
import { MeshEvent, MeshEventType } from '../event';
import { ConnectionGraph, RoutingTable } from './connectionGraph';

export class NetworkEntity {
    private address: string;

    public incomingMessages: Subject<Message> = new Subject<Message>();

    private networkConnection: Peer;
    public events: ReplaySubject<MeshEvent> = new ReplaySubject<MeshEvent>();

    private connections: { [address: string]: DataConnection } = {};
    private connectionGraph: ConnectionGraph;
    private _networkStateIndex: number = 0;
    private get networkStateIndex() {
        return this._networkStateIndex++;
    }
    private networkStateBuffer: { [address: string]: number } = {};
    private routingTable: RoutingTable = {};

    constructor(address: string) {
        this.address = address;
        this.connectionGraph = new ConnectionGraph(address);

        this.networkConnection = new Peer(this.address, {
            secure: true,
            // host: 'localhost',
            // key: 'peerjs',
            // port: 9000,
            // debug: 3,
            config: {
                iceServers: [
                    { urls: ["stun:eu-turn1.xirsys.com"] },
                    {
                        username: "M2bPldrkkK-A2UhnkwWzhujF4UTcEdU0xWdZZswOb4L9UV7JgovgaLjcSlmqqVFoAAAAAF1j5zlwZWxpa2Fhbg==",
                        credential: "98dbe8da-c80a-11e9-815c-169b39aff842",
                        urls: [
                            "turn:eu-turn1.xirsys.com:80?transport=udp",
                            "turn:eu-turn1.xirsys.com:3478?transport=udp",
                            "turn:eu-turn1.xirsys.com:80?transport=tcp",
                            "turn:eu-turn1.xirsys.com:3478?transport=tcp",
                            "turns:eu-turn1.xirsys.com:443?transport=tcp",
                            "turns:eu-turn1.xirsys.com:5349?transport=tcp"
                        ]
                    }
                ]
            }
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
            connection.on("open", () => {
                this.handleNewConnection(connection);
            });
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
            this.handleIncomingMessage(message);
        });

        connection.on('error', (error: any) => {
            this.connections[connection.peer];
            this.sendNewNetworkState();
            throw Error(error);
        });

        this.connectionGraph.addConnection(this.address, connection.peer);

        this.sendNewNetworkState();
        this.sendNetworkStateRequest();

        console.log("Connection established between peers.");
        console.log("   this peer: ", this.address);
        console.log("   other peer: ", connection.peer);
        console.log("   connection: ", connection);
    }

    private sendNewNetworkState() {
        let networkState: NetworkStateMessage = {
            header: {
                type: MessageType.networkState,
                sourceAddress: this.address,
                index: this.networkStateIndex
            },
            body: {
                neighbours: Object.keys(this.connections)
            }
        };

        // Is a reliable way of sending messages between nodes because of tcp.
        this.sendMessage(networkState);
    }

    private sendNetworkStateRequest() {
        let networkStateRequest: NetworkStateRequest = {
            header: {
                type: MessageType.networkStateRequest,
                sourceAddress: this.address,
                index: this.networkStateIndex
            }
        };

        this.sendMessage(networkStateRequest);
    }

    public sendMessage(message: Message): void {
        switch (message.header.type) {
            case MessageType.unicast:
            case MessageType.acknowledgement:
                let nextHop: string = this.routingTable[message.header.destinationAddress!];
                this.connections[nextHop].send(message);
                break;
            case MessageType.broadcast:
            case MessageType.networkState:
            case MessageType.networkStateRequest:
            default:
                for (let address in this.connections) {
                    this.connections[address].send(message);
                }
        }
    }

    private handleIncomingMessage(message: Message): void {
        switch (message.header.type) {
            case MessageType.networkState:
                let networkState: NetworkStateMessage = <NetworkStateMessage> message;

                if (networkState.header.index > this.networkStateBuffer[networkState.header.sourceAddress]
                    || this.networkStateBuffer[networkState.header.sourceAddress] === undefined) {
                    this.connectionGraph.setNodeNeighbours(networkState.header.sourceAddress, networkState.body.neighbours);
                    this.routingTable = this.connectionGraph.makeRoutingTable();

                    this.networkStateBuffer[networkState.header.sourceAddress] = networkState.header.index;
                    this.sendMessage(networkState);
                }
                break;
            case MessageType.networkStateRequest:
                let networkStateRequest: NetworkStateRequest = <NetworkStateRequest> message;
                
                if (networkStateRequest.header.index > this.networkStateBuffer[networkStateRequest.header.sourceAddress]
                    || this.networkStateBuffer[networkStateRequest.header.sourceAddress] === undefined) {
                    this.sendNewNetworkState();
                    this.networkStateBuffer[networkStateRequest.header.sourceAddress] = networkStateRequest.header.index;
                    this.sendMessage(networkStateRequest);
                }
                break;
            case MessageType.broadcast:
                this.incomingMessages.next(message);
                break;
            default:
                if (message.header.destinationAddress == this.address) {
                    this.incomingMessages.next(message);
                } else {
                    this.sendMessage(message);
                }
        }
    }
}