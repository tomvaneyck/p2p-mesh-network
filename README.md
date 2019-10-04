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

## More information

Read the wiki.
