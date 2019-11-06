import { Subject } from 'rxjs';
import { MeshEventType, NetworkChangeMeshEvent, NetworkChangeEventData } from '../event';
import { debounceTime } from 'rxjs/operators';

export class ConnectionGraph {
    private address: string;

    private _events = new Subject<NetworkChangeMeshEvent>();
    public get events() {
        return this._events.pipe(debounceTime(1000));
    }
    private notifyChange(data: NetworkChangeEventData) {
        this._events.next({
            type: MeshEventType.networkChange,
            message: "The network topography changed.",
            metadata: data
        });
    }

    private connections: Map<string, Set<string>> = new Map();
    public get topography() {
        return this.connections;
    }
    public get numberOfNodes() {
        return this.connections.size;
    }

    constructor(address: string) {
        this.address = address;
        this.addNode(address);
    }

    // public get numberOfNodes(): number {
    //     return this.connections.size;
    // }

    public addNode(address: string) {
        if (!this.connections.has(address)) {
            this.connections.set(address, new Set());
            this.notifyChange({
                added: [address]
            });
        }
    }

    public removeNodeIfUnreachable(address: string) {
        let nodes = this.connections.get(address);
        if (nodes) {
            // For each node connected to the presumed unreachable node, check
            // if there is a connection to the unreachable node. If there is
            // no connection, the node can be safely assumed disconnected from
            // the network.
            for (let node of nodes) {
                let neighbours = this.connections.get(node);
                if (neighbours && neighbours.has(address)) {
                    return;
                }
            }

            this.connections.delete(address);
            this.notifyChange({
                removed: [address]
            });
        }
    }

    public removeNeighbour(address: string) {
        this.connections.get(this.address)!.delete(address);
        this.notifyChange({
            disConnected: [[this.address, address]]
        });
        this.removeNodeIfUnreachable(address);
    }

    /**
     * Set neighbours on a node in the graph.
     * @param address The node to set the neighbours on.
     * @param neighbours The neighbours of the node
     */
    public setNodeNeighbours(address: string, neighbours: string[]) {
        // Calculate which nodes disconnected from address.
        let disconnectedNodes: string[] = [];
        if (this.connections.has(address)) {
            disconnectedNodes = [...this.connections.get(address)!]
                .filter(neighbour => !neighbours.includes(neighbour));
        }

        for (let neighbour of neighbours) {
            // Add all neighbours as nodes.
            this.addNode(neighbour);
        }
        this.connections.set(address, new Set(neighbours));

        // For nodes that disconnected from address, delete if unreachable.
        for (let disconnectedNode of disconnectedNodes) {
            this.removeNodeIfUnreachable(disconnectedNode);
        }
        
        // Notify the application with the new neighbours.
        let connections: [string, string][] = [];
        for (let neighbour of neighbours) {
            connections.push([address, neighbour]);
        }
        this.notifyChange({
            connected: connections
        });
    }

    public addConnection(source: string, destination: string): void {
        this.addNode(source);
        this.addNode(destination)

        this.connections.get(source)!.add(destination);
        this.connections.get(destination)!.add(source);

        this.notifyChange({
            connected: [[source, destination], [destination, source]]
        });
    }

    public constructRoutingTree(): RoutingTreeNode {
        let root: RoutingTreeNode = {
            address: this.address,
            children: []
        };

        // Add the neighbours of this node to the candidates. 
        let visitedNodes: Set<string> = new Set();
        visitedNodes.add(this.address);
        let candidates: [string, RoutingTreeNode][] = [];
        for (let neighbour of this.connections.get(this.address)!) {
            candidates.push([neighbour, root]);
        }

        // Keep looking at candidates for tree insertion untill none are over.
        while (candidates.length > 0) {
            let currentCandidate: [string, RoutingTreeNode] = candidates.shift()!;
            let currentNode: string = currentCandidate[0];
            let parentTreeNode: RoutingTreeNode = currentCandidate[1];

            // If node has not been handled before, add node to the tree.
            if (!visitedNodes.has(currentNode)) {
                visitedNodes.add(currentNode);

                // Add node to tree adding it to the referenced parent node.
                let currentTreeNode: RoutingTreeNode = {
                    address: currentNode,
                    children: []
                }
                parentTreeNode.children.push(currentTreeNode);

                // Add all neighbours of this node to the candidates.
                for (let neighbour of this.connections.get(currentNode)!) {
                    candidates.push([neighbour, currentTreeNode]);
                }
            }
        }

        return root;
    }

    private addToRoutingTable(nextHop: string, currentNode: RoutingTreeNode, distance: number, routingTable: RoutingTable): void {
        routingTable[currentNode.address] = {
            nextHop: nextHop,
            distance: distance
        };

        for (let treeNode of currentNode.children) {
            this.addToRoutingTable(nextHop, treeNode, distance + 1, routingTable);
        }
    }

    public makeRoutingTable(): RoutingTable {
        let root: RoutingTreeNode = this.constructRoutingTree();

        let routingTable: RoutingTable = {};
        for (let treeNode of root.children) {
            this.addToRoutingTable(treeNode.address, treeNode, 1, routingTable);
        }

        return routingTable;
    }
}

interface RoutingTreeNode {
    address: string,
    children: RoutingTreeNode[]
}

export interface RoutingTable {
    [address: string]: {
        nextHop: string,
        distance: number
    }
}