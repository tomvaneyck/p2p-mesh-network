---
layout: page
title: Network structure
nav_order: 2
---

# Network structure
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

The **Network** consists of several **Nodes** which are wrappers for **Peers**. These nodes are connected via peer to peer connections.

The **Peers** are objects from the library [peerjs](peerjs.com).

## Nodes and their layers

The implementation tries to adhere to the OSI network model, but only uses the layers that are strictly necessary. These layers are the presentation, session, transport and network layer.

<table class="tg">
    <thead>
        <tr>
            <th class="tg-0lax">OSI model</th>
            <th class="tg-0lax">p2p-mesh-network</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="tg-0lax">Application</td>
            <td class="tg-0lax">Application that uses p2p-mesh-network</td>
        </tr>
        <tr>
            <td class="tg-0lax">Presentation</td>
            <td class="tg-0lax" rowspan="4">p2p-mesh-network</td>
        </tr>
        <tr>
            <td class="tg-0lax">Session</td>
        </tr>
        <tr>
            <td class="tg-0lax">Transport</td>
        </tr>
        <tr>
            <td class="tg-0lax">Network</td>
        </tr>
        <tr>
            <td class="tg-0lax">Data link</td>
            <td class="tg-0lax" rowspan="2">PeerJS</td>
        </tr>
        <tr>
            <td class="tg-0lax">Physical</td>
        </tr>
    </tbody>
</table>

### Presentation & session layer

These two layers serve more as an interface for the application using p2p-mesh-network as there is no real functionality present yet.

### Transport layer

This layer delivers reliable data transmission over different nodes. It uses a simplified TCP with a simplified *Selective Repeat* protocol to this end. Every node has one send and receive buffer per node with which it is communicating.

### Network layer

Instead of using ip addresses, a node generates an address in the form of a universally unique identifier, version 4. This address is used to identify and communicate with other nodes on the network.

Access control of new nodes to the network is handled in this layer.

Messages are routed over the network via a Link-state routing protocol.

## Deeper look

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