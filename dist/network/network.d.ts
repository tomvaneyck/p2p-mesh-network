import { Message } from '../message';
import { Subject, ReplaySubject } from 'rxjs';
import { MeshEvent } from '../event';
export declare class NetworkEntity {
    private address;
    incomingMessages: Subject<Message>;
    private networkConnection;
    events: ReplaySubject<MeshEvent>;
    private messageIndex;
    private readonly messsageIndex;
    private messageIndexBuffer;
    private minimumNumberhOfConnections;
    private maximumNumberOfConnections;
    private connections;
    private temporaryConnections;
    private readonly numberOfConnections;
    private connectionGraph;
    private routingTable;
    private farthestUnconnectedNode;
    readonly networkTopography: Map<string, Set<string>>;
    constructor(address: string);
    connectToPeer(address: string): void;
    /**
     * Handles a new connection to this peer.
     *
     * Adds the new connection to the list of connections and adds the
     * right callbacks.
     * @param connection The new connection.
     */
    private handleNewConnection;
    private handleAcceptedConnection;
    private sendNewNetworkState;
    private sendNetworkStateRequest;
    sendMessage(message: Message): void;
    private handleIncomingMessage;
    private unicastHandler;
    private broadcastHandler;
    private findFarthestUnconnectedNode;
    private balanceNetwork;
}
