"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var transport_1 = require("./transport");
var rxjs_1 = require("rxjs");
var message_1 = require("./message");
var network_1 = require("./network/network");
var event_1 = require("./event");
var Node = /** @class */ (function () {
    function Node() {
        var _this = this;
        this._address = this.generateUuidv4();
        this.receivedMessages = new rxjs_1.Subject();
        this.connectionToNetwork = new rxjs_1.Subject();
        this.connectionsToPeer = new rxjs_1.Subject();
        this.networkChange = new rxjs_1.Subject();
        this.networkEntitity = new network_1.NetworkEntity(this.address);
        this.transportEntity = new transport_1.TransportEntity(this.address, this.networkEntitity);
        this.transportEntity.incomingMessages.subscribe(function (message) {
            _this.receivedMessages.next(message);
        });
        this.transportEntity.events.subscribe(function (event) {
            switch (event.type) {
                case event_1.MeshEventType.outOfBufferBounds:
                    console.log("Metadata of incoming error:", event.metadata);
                    throw Error(event.message);
                case event_1.MeshEventType.malformedMessage:
                    console.log("Metadata of incoming error:", event.metadata);
                    throw Error(event.message);
                case event_1.MeshEventType.timeOut:
                    console.log("Metadata of incoming error:", event.metadata);
                    throw Error(event.message);
                default:
                    console.log(event.message, event);
            }
        });
        this.networkEntitity.events.subscribe(function (event) {
            switch (event.type) {
                case event_1.MeshEventType.connectedToNetwork:
                    _this.connectionToNetwork.next(true);
                    break;
                case event_1.MeshEventType.connectedToPeer:
                    _this.connectionsToPeer.next(event.metadata);
                    break;
                case event_1.MeshEventType.disconnectedFromNetwork:
                    _this.connectionToNetwork.next(false);
                    break;
                case event_1.MeshEventType.networkChange:
                    _this.networkChange.next();
                    break;
                default:
                    console.log(event.message, event);
            }
        });
    }
    Object.defineProperty(Node.prototype, "address", {
        get: function () {
            return this._address;
        },
        enumerable: true,
        configurable: true
    });
    Node.prototype.onMessageReceived = function (callback) {
        this.receivedMessages.subscribe(function (message) {
            callback(message.header.sourceAddress, message.body);
        });
    };
    Node.prototype.onConnectedToNetwork = function (callback) {
        var _this = this;
        this.connectionToNetwork.subscribe(function (connected) {
            if (connected) {
                callback(_this.address);
            }
        });
    };
    Node.prototype.onDisconnectedFromNetwork = function (callback) {
        this.connectionToNetwork.subscribe(function (connected) {
            if (!connected) {
                callback();
            }
        });
    };
    Node.prototype.onConnectedToPeer = function (callback) {
        this.connectionsToPeer.subscribe(function (address) {
            callback(address);
        });
    };
    Node.prototype.onNetworkChange = function (callback) {
        this.networkChange.subscribe(function () {
            callback();
        });
    };
    Object.defineProperty(Node.prototype, "networkTopography", {
        get: function () {
            return this.networkEntitity.networkTopography;
        },
        enumerable: true,
        configurable: true
    });
    Node.prototype.connectToPeer = function (address) {
        this.networkEntitity.connectToPeer(address);
    };
    Node.prototype.sendData = function (data, destinationAddress) {
        var message;
        if (!destinationAddress) {
            message = {
                header: {
                    type: message_1.MessageType.broadcast,
                    sourceAddress: this.address
                },
                body: data
            };
        }
        else {
            message = {
                header: {
                    type: message_1.MessageType.unicast,
                    sourceAddress: this.address,
                    destinationAddress: destinationAddress
                },
                body: data
            };
        }
        this.transportEntity.sendMessage(message);
    };
    /**
     * Generates a global unique identifier.
     * @returns A global unique identifier.
     */
    Node.prototype.generateUuidv4 = function () {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, function (c) {
            var d = c;
            return (d ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> d / 4).toString(16);
        });
    };
    return Node;
}());
exports.Node = Node;
