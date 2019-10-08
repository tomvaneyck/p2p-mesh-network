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

Messages are routed over the network via a link-state routing protocol.

## Deeper look

### Messaging

There are two ways to send messages on the network: unicast and broadcast. These work in the same way as in tcp/ip.

Apart from these two types of communication, housekeeping is done behind the scenes to keep the stability of the network. These message types exist to achieve this goal. Their specific use will be explained in detail later.

<dl>
    <dt>acknowledgement</dt>
    <dd>Used to deliver reliable message delivery.</dd>
    <dt>connectionAccepted</dt>
    <dd>Sent to a node that is trying to connect to the network. Means that the node can accept the connection as final.</dd>
    <dt>connectionRejected</dt>
    <dd>Sent to a node that is trying to connect to the network. Means that the node should disconnect the current connection and should connect to the address contained in this message.</dd>
    <dt>entryPointRequest</dt>
    <dd>Emitted byt a node that gets an incoming connection request if there are no connection slots available anymore.</dd>
    <dt>entryPoint</dt>
    <dd>Sent on receival of *entryPointRequest* by a node that has available connection slots.</dd>
    <dt>networkState</dt>
    <dd>Sent by any node of which the connection state to any neighbouring node has changed. Used by the link-state routing protocol.</dd>
    <dt>networkStateRequest</dt>
    <dd>Sent by any node that beleives its network model is out of date.</dd>
</dl>

### Connecting to the network

Because of the way *PeerJS* works, a node that wishes to make a new connection to another node has to consider the inital connection temporary. The node on the receiving end may, as it wishes, deny the connection if it does not have enough connection slots available. Nevertheless, the receiving node has to deliver a valid address from a node on the same network to which the initiating node **can** connect.

A valid address is found by requesting it on the network using an *entryPointRequest*. This message is flooded on the network and any node with available connection slots should answer with an *entryPoint* message containing its address.

### Link-state routing protocol

The network uses a simple implementation of the link-state routing protocol. It uses the *networkState* and *networkSateRequest* messages to distribute network topography.
