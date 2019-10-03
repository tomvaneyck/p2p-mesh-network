interface MeshNetwork {
    readonly address: string;
    readonly networkTopography: Map<string, Set<string>>;
    onMessageReceived(callback: (source: string, msg: any) => void): void;
    onConnectedToNetwork(callback: (address: string) => void): void;
    onDisconnectedFromNetwork(callback: () => void): void;
    onConnectedToPeer(callback: (address: string) => void): void;
    onNetworkChange(callback: () => void): void;
    connectToPeer(address: string): void;
    sendData(data: any): void;
    sendData(data: any, destinationAddress: string): void;
    sendData(data: any, destinationAddress?: string): void;
}
export declare class Node implements MeshNetwork {
    private readonly _address;
    readonly address: string;
    private receivedMessages;
    onMessageReceived(callback: (source: string, msg: any) => void): void;
    private connectionToNetwork;
    onConnectedToNetwork(callback: (address: string) => void): void;
    onDisconnectedFromNetwork(callback: () => void): void;
    private connectionsToPeer;
    onConnectedToPeer(callback: (address: string) => void): void;
    private networkChange;
    onNetworkChange(callback: () => void): void;
    private transportEntity;
    private networkEntitity;
    readonly networkTopography: Map<string, Set<string>>;
    constructor();
    connectToPeer(address: string): void;
    sendData(data: any): void;
    sendData(data: any, destinationAddress: string): void;
    /**
     * Generates a global unique identifier.
     * @returns A global unique identifier.
     */
    private generateUuidv4;
}
export {};
