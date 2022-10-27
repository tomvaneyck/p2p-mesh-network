---
layout: home
title: Home
nav_order: 1
---

# p2p-mesh-network

Make a peer to peer mesh network over WebRTC and send any type of data from browser to browser.
Perfect for distributed applications where nodes can appear or disappear without warning.

## Quick start

Import this library in your project, make a new node and connect to others to establish a network. Then just send any data you like. The public interface is explained [here](api.md).

[Find the npm package here.](https://www.npmjs.com/package/p2p-mesh-network)

``` typescript
import { Node } from "p2p-mesh-network";

let node = new Node();
node.connectToPeer("address of other node");
node.sendData("someData")
```

## How does it work?

The network exists of different nodes, connected via a peer to peer connection using [PeerJS](https://peerjs.com/). The network is self balancing and highly connected.

The network starts out with one node with an address. To join this network, a new node has to know this address. A connection is then made, using a _PeerJS_ server as tracking service.

Communication is based on a simplified protocol that uses link state routing to route a message and acknowledgements to deliver reliable transmission.

More detailed information can be found [here](network-structure.md)
