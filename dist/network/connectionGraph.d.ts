import { MeshEvent } from '../event';
export declare class ConnectionGraph {
    private address;
    private _events;
    readonly events: import("rxjs").Observable<MeshEvent>;
    private notifyChange;
    private connections;
    readonly topography: Map<string, Set<string>>;
    readonly numberOfNodes: number;
    constructor(address: string);
    addNode(address: string): void;
    removeNode(address: string): void;
    removeNeighbour(address: string): void;
    setNodeNeighbours(address: string, neighbours: string[]): void;
    addConnection(source: string, destination: string): void;
    constructRoutingTree(): RoutingTreeNode;
    private addToRoutingTable;
    makeRoutingTable(): RoutingTable;
}
interface RoutingTreeNode {
    address: string;
    children: RoutingTreeNode[];
}
export interface RoutingTable {
    [address: string]: {
        nextHop: string;
        distance: number;
    };
}
export {};
