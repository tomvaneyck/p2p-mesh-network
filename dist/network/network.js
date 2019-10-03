"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var message_1 = require("../message");
var peerjs_1 = require("peerjs");
var rxjs_1 = require("rxjs");
var event_1 = require("../event");
var connectionGraph_1 = require("./connectionGraph");
var NetworkEntity = /** @class */ (function () {
    function NetworkEntity(address) {
        var _this = this;
        this.incomingMessages = new rxjs_1.Subject();
        this.events = new rxjs_1.ReplaySubject();
        this.messageIndex = 0;
        this.messageIndexBuffer = {};
        this.minimumNumberhOfConnections = 5;
        this.maximumNumberOfConnections = 10;
        // Boolean is temporary check.
        this.connections = {};
        this.temporaryConnections = {};
        this.routingTable = {};
        this.farthestUnconnectedNode = undefined;
        this.address = address;
        this.connectionGraph = new connectionGraph_1.ConnectionGraph(address);
        this.connectionGraph.events.subscribe(function (event) {
            _this.events.next(event);
            if (event.type == event_1.MeshEventType.networkChange) {
                _this.routingTable = _this.connectionGraph.makeRoutingTable();
                _this.findFarthestUnconnectedNode();
                _this.balanceNetwork();
            }
        });
        this.networkConnection = new peerjs_1.default(this.address, {
            secure: true,
            // host: 'localhost',
            // key: 'peerjs',
            // port: 9000,
            // debug: 3,
            config: {
                iceServers: [
                    { urls: ["stun:eu-turn1.xirsys.com"] },
                    {
                        username: "M2bPldrkkK-A2UhnkwWzhujF4UTcEdU0xWdZZswOb4L9UV7JgovgaLjcSlmqqVFoAAAAAF1j5zlwZWxpa2Fhbg==",
                        credential: "98dbe8da-c80a-11e9-815c-169b39aff842",
                        urls: [
                            "turn:eu-turn1.xirsys.com:80?transport=udp",
                            "turn:eu-turn1.xirsys.com:3478?transport=udp",
                            "turn:eu-turn1.xirsys.com:80?transport=tcp",
                            "turn:eu-turn1.xirsys.com:3478?transport=tcp",
                            "turns:eu-turn1.xirsys.com:443?transport=tcp",
                            "turns:eu-turn1.xirsys.com:5349?transport=tcp"
                        ]
                    }
                ]
            }
        });
        this.networkConnection.on('open', function (address) {
            _this.events.next({
                message: "A connection to the server has been established.",
                type: event_1.MeshEventType.connectedToNetwork,
                metadata: address
            });
        });
        this.networkConnection.on('disconnected', function () {
            _this.events.next({
                message: "The node was unexpectedly disconnected from the signalling server. Reconnection is being attempted.",
                type: event_1.MeshEventType.disconnectedFromNetwork
            });
            _this.networkConnection.reconnect();
        });
        this.networkConnection.on('error', function (e) {
            throw Error(e);
        });
        this.networkConnection.on('connection', function (connection) {
            connection.on("open", function () {
                _this.handleNewConnection(connection, true);
            });
        });
        this.networkConnection.on('close', function () {
            _this.events.next({
                message: "The connection to the network has been closed.",
                type: event_1.MeshEventType.disconnectedFromNetwork
            });
        });
    }
    Object.defineProperty(NetworkEntity.prototype, "messsageIndex", {
        get: function () {
            return this.messageIndex++;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NetworkEntity.prototype, "numberOfConnections", {
        get: function () {
            return Object.keys(this.connections).length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NetworkEntity.prototype, "networkTopography", {
        get: function () {
            return this.connectionGraph.topography;
        },
        enumerable: true,
        configurable: true
    });
    NetworkEntity.prototype.connectToPeer = function (address) {
        var _this = this;
        var connection = this.networkConnection.connect(address, { reliable: true });
        connection.on('open', function () {
            _this.handleNewConnection(connection, false);
        });
    };
    /**
     * Handles a new connection to this peer.
     *
     * Adds the new connection to the list of connections and adds the
     * right callbacks.
     * @param connection The new connection.
     */
    NetworkEntity.prototype.handleNewConnection = function (connection, incoming) {
        var _this = this;
        // Set up connection for data transmission.
        this.events.next({
            message: "A connection to another peer has been made.",
            type: event_1.MeshEventType.connectedToPeer,
            metadata: connection.peer
        });
        connection.on('data', function (message) {
            _this.handleIncomingMessage(message);
        });
        connection.on("close", function () {
            _this.events.next({
                message: "A connection to another peer has been lost.",
                type: event_1.MeshEventType.disconnectedFromPeer,
                metadata: connection.peer
            });
            delete _this.connections[connection.peer];
            delete _this.temporaryConnections[connection.peer];
            _this.connectionGraph.removeNeighbour(connection.peer);
            _this.sendNewNetworkState();
        });
        connection.on('error', function (error) {
            _this.events.next({
                message: "A connection to another peer has been lost.",
                type: event_1.MeshEventType.disconnectedFromPeer,
                metadata: connection.peer
            });
            delete _this.connections[connection.peer];
            delete _this.temporaryConnections[connection.peer];
            _this.connectionGraph.removeNeighbour(connection.peer);
            _this.sendNewNetworkState();
            throw Error(error);
        });
        this.temporaryConnections[connection.peer] = connection;
        if (incoming) {
            // Checking if connection is allowed.
            if (this.numberOfConnections < this.maximumNumberOfConnections) {
                var connectionAccepted = {
                    header: {
                        type: message_1.MessageType.connectionAccepted,
                        sourceAddress: this.address,
                        destinationAddress: connection.peer
                    }
                };
                this.sendMessage(connectionAccepted);
                this.handleAcceptedConnection(connection);
            }
            else {
                // Ask for available entry point. When entry point received, handled by handleNewMessage.
                var entryPointRequest = {
                    header: {
                        type: message_1.MessageType.entryPointRequest,
                        sourceAddress: this.address,
                        index: this.messageIndex
                    }
                };
                this.sendMessage(entryPointRequest);
            }
        }
    };
    NetworkEntity.prototype.handleAcceptedConnection = function (connection) {
        this.connections[connection.peer] = connection;
        delete this.temporaryConnections[connection.peer];
        this.connectionGraph.addConnection(this.address, connection.peer);
        this.sendNewNetworkState();
        this.sendNetworkStateRequest();
        console.log("Connection established between peers.");
        console.log("   this peer: ", this.address);
        console.log("   other peer: ", connection.peer);
        console.log("   connection: ", connection);
    };
    NetworkEntity.prototype.sendNewNetworkState = function () {
        var networkState = {
            header: {
                type: message_1.MessageType.networkState,
                sourceAddress: this.address,
                index: this.messsageIndex
            },
            body: {
                neighbours: Object.keys(this.connections)
            }
        };
        // Is a reliable way of sending messages between nodes because of tcp.
        this.sendMessage(networkState);
    };
    NetworkEntity.prototype.sendNetworkStateRequest = function () {
        var networkStateRequest = {
            header: {
                type: message_1.MessageType.networkStateRequest,
                sourceAddress: this.address,
                index: this.messsageIndex
            }
        };
        this.sendMessage(networkStateRequest);
    };
    NetworkEntity.prototype.sendMessage = function (message) {
        switch (message.header.type) {
            case message_1.MessageType.unicast:
            case message_1.MessageType.acknowledgement:
            case message_1.MessageType.entryPoint:
                var nextHop = this.routingTable[message.header.destinationAddress].nextHop;
                this.connections[nextHop].send(message);
                break;
            case message_1.MessageType.connectionAccepted:
            case message_1.MessageType.connectionRejected:
                this.temporaryConnections[message.header.destinationAddress].send(message);
                break;
            case message_1.MessageType.broadcast:
            case message_1.MessageType.networkState:
            case message_1.MessageType.networkStateRequest:
            default:
                for (var address in this.connections) {
                    this.connections[address].send(message);
                }
        }
    };
    NetworkEntity.prototype.handleIncomingMessage = function (message) {
        var _this = this;
        switch (message.header.type) {
            case message_1.MessageType.connectionAccepted:
                var connectionAccepted = message;
                this.handleAcceptedConnection(this.temporaryConnections[connectionAccepted.header.sourceAddress]);
                break;
            case message_1.MessageType.connectionRejected:
                var connectionRejected = message;
                delete this.connections[connectionRejected.header.sourceAddress];
                this.connectToPeer(connectionRejected.body.newEntryPoint);
                this.events.next({
                    type: event_1.MeshEventType.connectionToPeerRejected,
                    message: "The peer that was tried does not have any more connection slots open."
                });
                break;
            case message_1.MessageType.entryPoint:
                this.unicastHandler(message, function (message) {
                    var entryPoint = message;
                    for (var address in _this.temporaryConnections) {
                        var connectionRejected_1 = {
                            header: {
                                type: message_1.MessageType.connectionRejected,
                                sourceAddress: _this.address,
                                destinationAddress: address
                            },
                            body: {
                                newEntryPoint: entryPoint.body.EntryPointAddress
                            }
                        };
                        _this.sendMessage(connectionRejected_1);
                        delete _this.temporaryConnections[address];
                    }
                });
                break;
            case message_1.MessageType.entryPointRequest:
                var entryPointRequest = message;
                if (this.numberOfConnections < this.maximumNumberOfConnections) {
                    var entryPoint = {
                        header: {
                            type: message_1.MessageType.entryPoint,
                            sourceAddress: this.address,
                            destinationAddress: entryPointRequest.header.sourceAddress
                        },
                        body: {
                            EntryPointAddress: this.address
                        }
                    };
                    this.sendMessage(entryPoint);
                }
                else {
                    this.broadcastHandler(entryPointRequest, function () { });
                }
                break;
            case message_1.MessageType.networkState:
                var networkState = message;
                this.broadcastHandler(networkState, function (networkState) {
                    _this.connectionGraph.setNodeNeighbours(networkState.header.sourceAddress, networkState.body.neighbours);
                });
                break;
            case message_1.MessageType.networkStateRequest:
                var networkStateRequest = message;
                this.broadcastHandler(networkStateRequest, function () {
                    _this.sendNewNetworkState();
                });
                break;
            case message_1.MessageType.broadcast:
                this.incomingMessages.next(message);
                break;
            default:
                this.unicastHandler(message, function (message) {
                    _this.incomingMessages.next(message);
                });
        }
    };
    // Checks if the message is destined for this node and take appropriate action.
    NetworkEntity.prototype.unicastHandler = function (message, callback) {
        if (message.header.destinationAddress === this.address) {
            callback(message);
        }
        else {
            this.sendMessage(message);
        }
    };
    NetworkEntity.prototype.broadcastHandler = function (message, callback) {
        var index = message.header.index;
        var bufferedIndex = this.messageIndexBuffer[message.header.sourceAddress];
        if (index === undefined || bufferedIndex === undefined || index > bufferedIndex) {
            callback(message);
            this.messageIndexBuffer[message.header.sourceAddress] = index;
            this.sendMessage(message);
            console.log("broadcastHandler", message);
        }
    };
    NetworkEntity.prototype.findFarthestUnconnectedNode = function () {
        var farthestNode;
        var distance = 0;
        for (var node in this.routingTable) {
            if (!(node in this.connections) && this.routingTable[node].distance > distance) {
                farthestNode = node;
            }
        }
        this.farthestUnconnectedNode = farthestNode;
    };
    NetworkEntity.prototype.balanceNetwork = function () {
        if (this.farthestUnconnectedNode
            && this.numberOfConnections < this.minimumNumberhOfConnections
            && this.numberOfConnections < this.connectionGraph.numberOfNodes - 1) {
            this.connectToPeer(this.farthestUnconnectedNode);
            // Renewing farthest node because of previous connect.
            this.findFarthestUnconnectedNode();
        }
    };
    return NetworkEntity;
}());
exports.NetworkEntity = NetworkEntity;
