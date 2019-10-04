# Distrirender networking design

Distrirender uses a mesh network for sending and receiving data to accomplish its goal to render on a distributed system. The mesh network is based on the library peerjs.

## Network vs. Node vs. Peer

The meshnetwork consists several parts: The **Network**, several **Nodes** and several **Peers**.

The network is built on several **Nodes** and each **Node** uses a **Peer** (from the *peerjs* libray) as backend for the actual message.

## Connections

### Storage

Connections are stored in a dictionary. The uuid of the peer on the other side of the connection should be used as index. The connection object is stored as the connection object itself.

## Messaging

### Message types

- network_state
- network_state_request
- msg
- msg_broadcast
- new_edge
- destroy_edge

### Multicast / Unicast

- Ordering? => buffer
- Reliability? => buffer
- Routing?
- Duplicating? => buffer + expected index (overflow, index >> buffer size)
- Flooding / Congestion? => buffer

Buffer size: 10.
Max index: 10 000.

#### Message contents

A message consists of 3 parts: a unique identifier, a header and a body. The contents of these can change per message type. We now describe the standard contents:

1. **The uid** consists of the universally unique identifier of the node, as well as a consecutive index, wich increases with every message.
2. **The header** contains the message type and the target peer (optional).
3. **The body** is the part of the message where the transmitted information resides.

#### Buffer

The sender has a queue of packages that need to be sent, indexed by order. It loads \<buffer-size> amount of packages in the buffer associated with the target peer.

The sender then sends all packages to a neighbouring node. This node puts the messages in a forwarding buffer and then forwards them to the next node. When the target peer receives a message, it puts the message in a buffer at the right index (`messageIndex % bufferSize`). It sends an acknowledgement when all messages with a lower index than the received index have been obtained.

When an acknowledgement has not been received by the sender before the waiting time has expired the message(s) in question will be sent again.

When acknowledgement has been received for the whole buffer, it is emptied and filled again with messages in the queue, keeping the order. With the whole buffer full for the receiver, it sends an acknowledgement to the sender, empties the buffer while giving the data to the application and increments the expected index.

#### MessageQueues

There are two message queues: one for inbound and one for outbound traffic. These queues are meant to interface with the application that uses this network.

Once messages are in the *receive queue* it should be impossible for the network to get access to those messages. Any special message handling should thus be done before sending it to the application.

#### Message sending

Specified interval? When pushed to queue?

#### Acknowledgements

Acknowledgments have a uid with message index equal to -1. The uuid of the source node is still used as normal.