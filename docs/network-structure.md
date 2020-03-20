---
layout: page
title: Network structure
nav_order: 3
---

# Network structure
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

The **Network** consists of several **Nodes**. These nodes are connected via peer to peer connections, which use the library [peerjs](peerjs.com).

## Nodes and their layers

The implementation uses different layers, just like the real internet: transport and network.

### Transport layer

This layer delivers reliable data transmission over different nodes. It uses a simplified *Selective Repeat* protocol to this end. Every node has one send and one receive buffer per other node with which it is communicating.

### Network layer

Instead of using ip addresses, a node generates an address in the form of a [Universally Unique Identifier](https://en.wikipedia.org/wiki/Universally_unique_identifier), version 4. This address is used to identify and communicate with other nodes on the network.

Access control of new nodes to the network is handled in this layer.

Messages are routed over the network via a link-state routing protocol.

## Deeper look

### Connecting to the network

To connect to a network, the address of one of the nodes has to be known. When connecting to that network, a connection request is sent to the node which belongs to the address. This node can, depending on the amount of current connections, decide to accept or deny the conection.

When the node accepts the incoming connection, the change in network topology is communicated to the rest of the network.

When the node rejects the incoming connection, it is responsible for finding another access point in the network. To do this, the node broadcasts an entry point request. Any other node on the network that is able to accept new connections can send its address back. This address is then sent to the connecting node so that it can connect to the network.

### Link-state routing protocol

The network uses a simple implementation of the link-state routing protocol. Every node has its own representation of the network. On every broadcasted network topology change, this representation is updated and a routing table is generated.

### Messaging

There are three ways to send messages on the network: unicast, multicast and broadcast. Messages are tracked using send and receive buffers. These buffers are implemented using a *slective repeat* type protocol. This way reliable delivery is provided. Messages are not encrypted.

### Balancing

A node will always try to keep the network balanced and well connected. A node will thus keep the amount of connections between a given minimum and maximum, as long as there are enough nodes on the network. For every new connection it will try to find the farthest node on the network, based on its internal routing table.
