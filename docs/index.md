---
layout: home
title: Home
nav_order: 1
---

# p2p-mesh-network

Make a peer to peer mesh network over WebRTC and send any type of data from browser to browser.

Perfect for ditributed applications where nodes can appear or disappear without warning.

## Quick start

Import this library in your project, make a new node and connect to others to establish a network. Then just send any data you like.

``` typescript
import { Node } from "p2p-mesh-network";

let node = new Node();
node.connectToPeer("address of other node");
node.sendData("someData")
```

## How does it work?

The network exists of different nodes, connected via a peer to peer connection. When you want to connect a new node to the network, a request is done to a public server with the id of an existing node on the network. The server then returns with the ip address which the new node can use to connect to the network.

More detailed information can be found [here](network-structure.md)
