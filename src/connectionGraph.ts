// class ConnectionGraph {
//     private members: Set<string> = new Set<string>();
//     private connections: Set<[string, string]> = new Set<[string, string]>();
//     public handleUserJoin: (user: string) => void = function (user: string) { };
//     public handleUserDisconnect: (user: string) => void = function (user: string) { };

//     public addConnection(sourcePeer: string, targetPeer: string) {
//         if (!this.members.has(sourcePeer)) {
//             this.members.add(sourcePeer);
//             this.handleUserJoin(sourcePeer);
//         }
//         if (!this.members.has(targetPeer)) {
//             this.members.add(targetPeer);
//             this.handleUserJoin(targetPeer);
//         }
//         this.connections.add([sourcePeer, targetPeer]);
//         this.connections.add([targetPeer, sourcePeer]);
//     }

//     public removeConnection(sourcePeer: string, targetPeer: string) {
//         this.connections.delete([sourcePeer, targetPeer]);
//         this.connections.delete([targetPeer, sourcePeer]);
//         let sourceConnected = false;
//         let targetConnected = false;
//         for (let [node1, node2] of this.connections.values()) {
//             if (node1 == sourcePeer || node2 == sourcePeer) {
//                 sourceConnected = true;
//             }
//             if (node1 == targetPeer || node2 == targetPeer) {
//                 targetConnected = true;
//             }
//         }
//         if (!sourceConnected) {
//             this.members.delete(sourcePeer);
//             this.handleUserDisconnect(sourcePeer);
//         }
//         if (!targetConnected) {
//             this.members.delete(targetPeer);
//             this.handleUserDisconnect(targetPeer);
//         }
//     }

//     public findPathBetwenPeers(sourcePeer: string, targetPeer: string) {
//         // TODO: Implement.
//     }

//     public mergeSerialized(network: Network) {
//         for (let [node1, node2] of network.connections.values()) {
//             if (!this.members.has(node1)) {
//                 this.members.add(node1);
//                 this.handleUserJoin(node1);
//             }
//             if (!this.members.has(node2)) {
//                 this.members.has(node2);
//                 this.handleUserJoin(node2);
//             }

//             this.connections.add([node1, node2]);
//             this.connections.add([node2, node1]);
//         }
//     }

//     public serialize(): Network {
//         return {
//             connections: Array.from(this.connections)
//         }
//     }
// }