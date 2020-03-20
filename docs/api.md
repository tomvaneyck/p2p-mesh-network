---
layout: page
title: API
nav_order: 2
---

# API
{: .no_toc}

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

<div class="code-example" markdown="1">

## IceServer

An interface to describe the format of the TURN server configuration.

#### Signature
{: .no_toc}

```typescript
export interface IceServer {
    username?: string,
    credential?: string,
    urls: string[]
}
```

</div>

<div class="code-example" markdown="1">

## Node

A node on the network.

### Constructor

<div class="code-example" markdown="1">

#### Signature
{: .no_toc}

 ```typescript
 constructor(iceServers?: IceServer[])
 ```

#### Parameters
{: .no_toc}

| Parameter | Type | Description |
|:-|:-|:-|
| iceServers | [IceServer](#iceserver) | The urls of the ice servers to be used for TURN services. |

</div>

### Properties

| Property | Type | Description |
|:-|:-|:-|
| address | string | The address of the node on the network. |
| networkTopography | Map\<string, Set\<string\>\> | The current network topography as seen by the node. |
| neighbours | string[] | The nodes this node is directly connected to. |

### Methods

<div class="code-example" markdown="1">

#### onMessageReceived()

Set the callback to execute when a message is received.

```typescript
onMessageReceived(callback: (source: string, msg: any) => void): void
```

##### Parameters
{: .no_toc}

| Parameter | Type | Description |
|:-|:-|:-|
| callback | `(source: string, msg: any) => void`{:.typescript} | The callback to execute. |

</div>

<div class="code-example" markdown="1">

#### onConnectedToNetwork()

Set the callback to execute when the node is connected to a network.

```typescript
onConnectedToNetwork(callback: (address: string) => void): void
```

##### Parameters
{: .no_toc}

| Parameter | Type | Description |
|:-|:-|:-|
| callback | `(address: string) => void`{:.typescript} | The callback to execute. |

</div>

<div class="code-example" markdown="1">

#### onDisconnectedFromNetwork()

Set the callback to execute when the node is disconnected from the network.

```typescript
onMessageReceived(callback: (source: string, msg: any) => void): void
```

##### Parameters
{: .no_toc}

| Parameter | Type | Description |
|:-|:-|:-|
| callback | `(source: string, msg: any) => void`{:.typescript} | The callback to execute. |

</div>

<div class="code-example" markdown="1">

#### onConnectedToPeer()

Set the callback to execute when the node is connected to another node.

```typescript
onConnectedToPeer(callback: (address: string) => void): void
```

##### Parameters
{: .no_toc}

| Parameter | Type | Description |
|:-|:-|:-|
| callback | `(address: string) => void`{:.typescript} | The callback to execute. |

</div>

<div class="code-example" markdown="1">

#### onNetworkChange()

Set the callback to execute when there is a change in network topology.

```typescript
onNetworkChange(callback: () => void): void
```

##### Parameters
{: .no_toc}

| Parameter | Type | Description |
|:-|:-|:-|
| callback | `() => void`{:.typescript} | The callback to execute. |

</div>

<div class="code-example" markdown="1">

#### connectToPeer()

Connect to the node with the given address.

```typescript
connectToPeer(address: string): void
```

##### Parameters
{: .no_toc}

| Parameter | Type | Description |
|:-|:-|:-|
| address | string | The address of the node. |

</div>

<div class="code-example" markdown="1">

#### sendData()

Send data over the network to the node with the given address.<br>
When no destination address is given, the data will be broadcasted over the network.

```typescript
sendData(data: any, destinationAddress?: string): void
```

##### Parameters
{: .no_toc}

| Parameter | Type | Description |
|:-|:-|:-|
| data | any | The data to send over the network. |
| destinationAddress **optional** | string | The address of the node to send the data to. |

</div>

</div>
