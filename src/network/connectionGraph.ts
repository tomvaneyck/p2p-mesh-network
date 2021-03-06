import { Subject } from 'rxjs';
import { MeshEvent, MeshEventType } from '../event';
import { debounceTime } from 'rxjs/operators';

export class ConnectionGraph {
    private address: string;

    private _events = new Subject<MeshEvent>();
    public get events() {
        return this._events.pipe(debounceTime(1000));
    }
    private notifyChange() {
        this._events.next({
            type: MeshEventType.networkChange,
            message: "The network topography changed."
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
        if (!  this.connections.has(address)) {
            this.connections.set(address, new Set());
            this.notifyChange();
        }
    }

    public removeNode(address: string) {
        let neighbours = this.connections.get(address);
        if (neighbours && neighbours.size == 0) {
            this.connections.delete(address);
            this.notifyChange();
        }
    }

    public removeNeighbour(address: string) {
        this.connections.get(this.address)!.delete(address);
        this.connections.get(address)!.delete(this.address);
        this.removeNode(address);
        this.notifyChange();
    }
    
    public setNodeNeighbours(address: string, neighbours: string[]) {
        for (let neighbour of neighbours) {
            this.addNode(neighbour);
        }
        this.connections.set(address, new Set(neighbours));
        this.notifyChange();
    }
    
    public addConnection(source: string, destination: string): void {
        let sourceNeighbours: Set<string> = !this.connections.get(source) ? new Set() : this.connections.get(source)!;
        sourceNeighbours.add(destination);
        this.connections.set(source, sourceNeighbours);
        
        let destinationNeighbours: Set<string> = !this.connections.get(destination) ? new Set() : this.connections.get(destination)!;
        destinationNeighbours.add(source);
        this.connections.set(destination, destinationNeighbours);
        this.notifyChange();
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