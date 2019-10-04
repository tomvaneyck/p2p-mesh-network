import { Message, MessageType, ConnectionAccepted, ConnectionRejected, EntryPoint, EntryPointRequest, NetworkState, NetworkStateRequest } from '../message';
import Peer, { DataConnection } from "peerjs";
import { Subject, ReplaySubject } from 'rxjs';
import { MeshEvent, MeshEventType } from '../event';
import { ConnectionGraph, RoutingTable } from './connectionGraph';

export class NetworkEntity {
    private address: string;

    public incomingMessages: Subject<Message> = new Subject<Message>();

    private networkConnection: Peer;
    public events: ReplaySubject<MeshEvent> = new ReplaySubject<MeshEvent>();

    private messageIndex: number = 0;
    private get messsageIndex() {
        return this.messageIndex++;
    }
    private messageIndexBuffer: { [address: string]: number } = {};

    private minimumNumberhOfConnections: number = 5;
    private maximumNumberOfConnections: number = 10;
    // Boolean is temporary check.
    private connections: { [address: string]: DataConnection } = {};
    private temporaryConnections: { [address: string]: DataConnection } = {};
    private get numberOfConnections(): number {
        return Object.keys(this.connections).length;
    }
    private connectionGraph: ConnectionGraph;
    private routingTable: RoutingTable = {};
    private farthestUnconnectedNode: string | undefined = undefined;

    public get networkTopography() {
        return this.connectionGraph.topography;
    }

    constructor(address: string) {
        this.address = address;
        this.connectionGraph = new ConnectionGraph(address);
        this.connectionGraph.events.subscribe((event) => {
            this.events.next(event);
            if (event.type == MeshEventType.networkChange) {
                this.routingTable = this.connectionGraph.makeRoutingTable();
                this.findFarthestUnconnectedNode();
                this.balanceNetwork();
            }
        });

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

        this.networkConnection.on('disconnected', () => {
            this.events.next({
                message: "The node was unexpectedly disconnected from the signalling server. Reconnection is being attempted.",
                type: MeshEventType.disconnectedFromNetwork
            });
            this.networkConnection.reconnect();
        });

        this.networkConnection.on('error', e => {
            throw Error(e);
        });

        this.networkConnection.on('connection', connection => {
            connection.on("open", () => {
                this.handleNewConnection(connection, true);
            });
        });

        this.networkConnection.on('close', () => {
            this.events.next({
                message: "The connection to the network has been closed.",
                type: MeshEventType.disconnectedFromNetwork
            });
        })
    }

    public connectToPeer(address: string) {
        let connection: DataConnection = this.networkConnection.connect(address, { reliable: true });
        connection.on('open', () => {
            this.handleNewConnection(connection, false);
        });
    }

    /**
     * Handles a new connection to this peer.
     *
     * Adds the new connection to the list of connections and adds the
     * right callbacks.
     * @param connection The new connection.
     */
    private handleNewConnection(connection: DataConnection, incoming: boolean): void {
        // Set up connection for data transmission.
        this.events.next({
            message: "A connection to another peer has been made.",
            type: MeshEventType.connectedToPeer,
            metadata: connection.peer
        });

        connection.on('data', (message: Message) => {
            this.handleIncomingMessage(message);
        });

        connection.on("close", () => {
            this.events.next({
                message: "A connection to another peer has been lost.",
                type: MeshEventType.disconnectedFromPeer,
                metadata: connection.peer
            });
            delete this.connections[connection.peer];
            delete this.temporaryConnections[connection.peer];
            this.connectionGraph.removeNeighbour(connection.peer);
            this.sendNewNetworkState();
        })
        
        connection.on('error', (error: any) => {
            this.events.next({
                message: "A connection to another peer has been lost.",
                type: MeshEventType.disconnectedFromPeer,
                metadata: connection.peer
            });
            delete this.connections[connection.peer];
            delete this.temporaryConnections[connection.peer];
            this.connectionGraph.removeNeighbour(connection.peer);
            this.sendNewNetworkState();
            throw Error(error);
        });

        this.temporaryConnections[connection.peer] = connection;

        if (incoming) {
            // Checking if connection is allowed.
            if (this.numberOfConnections < this.maximumNumberOfConnections) {
                let connectionAccepted: ConnectionAccepted = {
                    header: {
                        type: MessageType.connectionAccepted,
                        sourceAddress: this.address,
                        destinationAddress: connection.peer
                    }
                };
                this.sendMessage(connectionAccepted)
                
                this.handleAcceptedConnection(connection);
            }
            else {
                // Ask for available entry point. When entry point received, handled by handleNewMessage.
                let entryPointRequest: EntryPointRequest = {
                    header: {
                        type: MessageType.entryPointRequest,
                        sourceAddress: this.address,
                        index: this.messageIndex
                    }
                };
                this.sendMessage(entryPointRequest);
            }
        }
    }

    private handleAcceptedConnection(connection: DataConnection) {
        this.connections[connection.peer] = connection;
        delete this.temporaryConnections[connection.peer];

        this.connectionGraph.addConnection(this.address, connection.peer);

        this.sendNewNetworkState();
        this.sendNetworkStateRequest();

        console.log("Connection established between peers.");
        console.log("   this peer: ", this.address);
        console.log("   other peer: ", connection.peer);
        console.log("   connection: ", connection);
    }

    private sendNewNetworkState() {
        let networkState: NetworkState = {
            header: {
                type: MessageType.networkState,
                sourceAddress: this.address,
                index: this.messsageIndex
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
                index: this.messsageIndex
            }
        };

        this.sendMessage(networkStateRequest);
    }

    public sendMessage(message: Message): void {
        switch (message.header.type) {
            case MessageType.unicast:
            case MessageType.acknowledgement:
            case MessageType.entryPoint:
                let nextHop: string = this.routingTable[message.header.destinationAddress!].nextHop;
                this.connections[nextHop].send(message);
                break;
            case MessageType.connectionAccepted:
            case MessageType.connectionRejected:
                this.temporaryConnections[message.header.destinationAddress!].send(message);
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
            case MessageType.connectionAccepted:
                let connectionAccepted = message as ConnectionAccepted;

                this.handleAcceptedConnection(this.temporaryConnections[connectionAccepted.header.sourceAddress]);
                break;
            case MessageType.connectionRejected:
                let connectionRejected = message as ConnectionRejected;
                
                delete this.connections[connectionRejected.header.sourceAddress];
                this.connectToPeer(connectionRejected.body.newEntryPoint);
                
                this.events.next({
                    type: MeshEventType.connectionToPeerRejected,
                    message: "The peer that was tried does not have any more connection slots open."
                })
                break;
            case MessageType.entryPoint:
                this.unicastHandler(message, (message: Message) => {
                    let entryPoint = message as EntryPoint;

                    for (let address in this.temporaryConnections) {
                        let connectionRejected: ConnectionRejected = {
                            header: {
                                type: MessageType.connectionRejected,
                                sourceAddress: this.address,
                                destinationAddress: address
                            },
                            body: {
                                newEntryPoint: entryPoint.body.EntryPointAddress
                            }
                        };

                        this.sendMessage(connectionRejected);
                        delete this.temporaryConnections[address];
                    }
                });
                break;
            case MessageType.entryPointRequest:
                let entryPointRequest = message as EntryPointRequest;
                if (this.numberOfConnections < this.maximumNumberOfConnections) {
                    let entryPoint: EntryPoint = {
                        header: {
                            type: MessageType.entryPoint,
                            sourceAddress: this.address,
                            destinationAddress: entryPointRequest.header.sourceAddress
                        },
                        body: {
                            EntryPointAddress: this.address
                        }
                    }

                    this.sendMessage(entryPoint);
                }
                else {
                    this.broadcastHandler(entryPointRequest, () => {});
                }
                break;
            case MessageType.networkState:
                let networkState = message as NetworkState;

                this.broadcastHandler(networkState, (networkState: Message) => {
                    this.connectionGraph.setNodeNeighbours(networkState.header.sourceAddress, networkState.body.neighbours);
                });
                break;
            case MessageType.networkStateRequest:
                let networkStateRequest = message as NetworkStateRequest;
                
                this.broadcastHandler(networkStateRequest, () => {
                    this.sendNewNetworkState();
                });
                break;
            case MessageType.broadcast:
                this.incomingMessages.next(message);
                break;
            default:
                this.unicastHandler(message, (message: Message) => {
                    this.incomingMessages.next(message);
                });
        }
    }

    // Checks if the message is destined for this node and take appropriate action.
    private unicastHandler(message: Message, callback: (message: Message) => any): void {
        if (message.header.destinationAddress === this.address) {
            callback(message);
        } else {
            this.sendMessage(message);
        }
    }

    private broadcastHandler(message: Message, callback: (message: Message) => any): void {
        let index: number = message.header.index!;
        let bufferedIndex: number = this.messageIndexBuffer[message.header.sourceAddress];

        if (index === undefined || bufferedIndex === undefined || index > bufferedIndex) {
            callback(message);
            this.messageIndexBuffer[message.header.sourceAddress] = index;
            this.sendMessage(message);
            console.log("broadcastHandler", message);
        }
    }

    private findFarthestUnconnectedNode() {
        let farthestNode: string | undefined;
        let distance: number = 0;

        for (let node in this.routingTable) {
            if (!(node in this.connections) && this.routingTable[node].distance > distance) {
                farthestNode = node;
            }
        }

        this.farthestUnconnectedNode = farthestNode;
    }
    
    private balanceNetwork(): void {
        if (this.farthestUnconnectedNode
            && this.numberOfConnections < this.minimumNumberhOfConnections
            && this.numberOfConnections < this.connectionGraph.numberOfNodes - 1) {
            this.connectToPeer(this.farthestUnconnectedNode);
            // Renewing farthest node because of previous connect.
            this.findFarthestUnconnectedNode();
        }
    }
}