"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var rxjs_1 = require("rxjs");
var message_1 = require("./message");
var event_1 = require("./event");
var TransportEntity = /** @class */ (function () {
    function TransportEntity(address, networkEntity) {
        var _this = this;
        this.incomingMessages = new rxjs_1.Subject();
        this.events = new rxjs_1.ReplaySubject();
        this._broadcastMessageIndex = 0;
        this.messageBuffers = {};
        this.address = address;
        this.networkEntity = networkEntity;
        this.networkEntity.incomingMessages.subscribe(function (message) {
            _this.handleIncomingMessage(message);
        });
    }
    Object.defineProperty(TransportEntity.prototype, "broadcastMessageIndex", {
        get: function () {
            return this._broadcastMessageIndex++;
        },
        enumerable: true,
        configurable: true
    });
    TransportEntity.prototype.sendMessage = function (message) {
        switch (message.header.type) {
            case message_1.MessageType.broadcast:
                message.header.index = this.broadcastMessageIndex;
                this.networkEntity.sendMessage(message);
                break;
            case message_1.MessageType.unicast:
                this.handleUnicastMessage(message);
                break;
            default:
                this.events.next({
                    message: "This message is not yet supported by the transport layer.",
                    type: event_1.MeshEventType.malformedMessage,
                    metadata: message
                });
        }
    };
    TransportEntity.prototype.handleUnicastMessage = function (message) {
        var _this = this;
        var destAddr = message.header.destinationAddress;
        if (!this.messageBuffers[destAddr]) {
            this.messageBuffers[destAddr] = new MessageBuffers();
        }
        var sendBuffer = this.messageBuffers[destAddr].sendBuffer;
        // Clear buffer if acks are received for all messages
        if (sendBuffer.canReset()) {
            sendBuffer.reset();
            console.log("Sendbuffer reset");
        }
        var messageIndex = sendBuffer.messageIndex;
        message.header.index = messageIndex;
        var bufferIndex = messageIndex % MessageBuffer.bufferSize;
        console.log("BufferIndex", bufferIndex);
        console.log("ExpectedIndex + Node.bufferSize ", sendBuffer.expectedIndex + MessageBuffer.bufferSize);
        if (bufferIndex >= sendBuffer.expectedIndex && messageIndex < sendBuffer.upperBufferIndex()) {
            sendBuffer.buffer[bufferIndex] = message;
            this.networkEntity.sendMessage(sendBuffer.buffer[bufferIndex]);
            // Set timer for resending message if ack was not received.
            sendBuffer.timers[messageIndex] = rxjs_1.interval(10000).subscribe(function (_) {
                var counter = 10;
                if (counter > 0) {
                    _this.networkEntity.sendMessage(sendBuffer.buffer[bufferIndex]);
                    counter--;
                }
                else {
                    sendBuffer.timers[messageIndex].unsubscribe();
                    delete sendBuffer.timers[messageIndex];
                    sendBuffer.ackReceived[messageIndex] = true;
                    _this.events.next({
                        type: event_1.MeshEventType.timeOut,
                        message: "The message timed out",
                        metadata: sendBuffer.buffer[messageIndex]
                    });
                }
            });
        }
        else {
            this.events.next({
                message: "The message does not fit in the buffer.",
                type: event_1.MeshEventType.outOfBufferBounds,
                metadata: {
                    message: message,
                    expectedIndex: sendBuffer.expectedIndex
                }
            });
        }
    };
    /**
     * Take appropriate action based on message type.
     */
    TransportEntity.prototype.handleIncomingMessage = function (message) {
        switch (message.header.type) {
            case message_1.MessageType.broadcast:
                this.incomingMessages.next(message);
                break;
            case message_1.MessageType.unicast:
                this.handleReceivedUnicastMessage(message);
                break;
            case message_1.MessageType.acknowledgement:
                this.handleAcknowledgement(message);
                break;
            default:
                this.events.next({
                    message: "The message type of the incoming message is not recognized.",
                    type: event_1.MeshEventType.malformedMessage,
                    metadata: message
                });
        }
    };
    /**
     * Handles incoming acknowledgements.
     */
    TransportEntity.prototype.handleAcknowledgement = function (message) {
        var ack = message;
        var sendBuffer = this.messageBuffers[message.header.sourceAddress].sendBuffer;
        // Indicate acknowledgement is received.
        sendBuffer.ackReceived[ack.body.index % MessageBuffer.bufferSize] = true;
        // Delete resend timer.
        // TODO: check if storage can be avoided so that auto deletion of subscriptions can be done.
        sendBuffer.timers[ack.body.index].unsubscribe();
        delete sendBuffer.timers[ack.body.index];
    };
    /**
     * Handles message when this node is the destination node of the message.
     */
    TransportEntity.prototype.handleReceivedUnicastMessage = function (message) {
        // Create buffers if they do not exist.
        var srcAddr = message.header.sourceAddress;
        if (!this.messageBuffers[srcAddr]) {
            this.messageBuffers[srcAddr] = new MessageBuffers();
        }
        // Send acknwoledgement.
        var ack = {
            header: {
                sourceAddress: this.address,
                destinationAddress: message.header.sourceAddress,
                type: message_1.MessageType.acknowledgement
            },
            body: {
                index: message.header.index
            }
        };
        this.networkEntity.sendMessage(ack);
        var messageIndex = message.header.index;
        var bufferIndex = messageIndex % MessageBuffer.bufferSize;
        var receiveBuffer = this.messageBuffers[message.header.sourceAddress].receiveBuffer;
        // If index fits in buffer
        if (bufferIndex >= receiveBuffer.expectedIndex && messageIndex < receiveBuffer.upperBufferIndex()) {
            // Put message in buffer
            receiveBuffer.buffer[bufferIndex] = message;
            // Handle all messages that have been received in order
            for (receiveBuffer.expectedIndex; receiveBuffer.expectedIndex < MessageBuffer.bufferSize; receiveBuffer.expectedIndex++) {
                if (receiveBuffer.buffer[receiveBuffer.expectedIndex]) {
                    this.incomingMessages.next(receiveBuffer.buffer[receiveBuffer.expectedIndex]);
                    // Reset buffer if buffer is full
                    if (receiveBuffer.expectedIndex == MessageBuffer.bufferSize - 1) {
                        receiveBuffer.reset();
                        break;
                    }
                }
                else {
                    break;
                }
            }
        }
    };
    return TransportEntity;
}());
exports.TransportEntity = TransportEntity;
var MessageBuffers = /** @class */ (function () {
    function MessageBuffers() {
        this.sendBuffer = new SendMessageBuffer();
        this.receiveBuffer = new MessageBuffer();
    }
    return MessageBuffers;
}());
var MessageBuffer = /** @class */ (function () {
    function MessageBuffer() {
        this.expectedIndex = 0;
        this.bufferPosition = 0;
        this.buffer = [];
    }
    MessageBuffer.prototype.upperBufferIndex = function () {
        return (this.bufferPosition + 1) * MessageBuffer.bufferSize;
    };
    MessageBuffer.prototype.reset = function () {
        this.expectedIndex = 0;
        this.bufferPosition++;
        this.buffer = [];
    };
    MessageBuffer.bufferSize = 10;
    return MessageBuffer;
}());
var SendMessageBuffer = /** @class */ (function (_super) {
    tslib_1.__extends(SendMessageBuffer, _super);
    function SendMessageBuffer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.maxMessageIndex = 1000;
        _this._messageIndex = 0;
        _this.ackReceived = [];
        _this.timers = {};
        return _this;
    }
    Object.defineProperty(SendMessageBuffer.prototype, "messageIndex", {
        get: function () {
            if (this._messageIndex > this.maxMessageIndex) {
                this._messageIndex = 0;
            }
            return this._messageIndex++;
        },
        enumerable: true,
        configurable: true
    });
    SendMessageBuffer.prototype.reset = function () {
        _super.prototype.reset.call(this);
        this.ackReceived = [];
    };
    SendMessageBuffer.prototype.canReset = function () {
        var e_1, _a;
        if (this.ackReceived.length < MessageBuffer.bufferSize) {
            return false;
        }
        else {
            try {
                for (var _b = tslib_1.__values(this.ackReceived), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var ack = _c.value;
                    if (!ack) {
                        return false;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return true;
        }
    };
    return SendMessageBuffer;
}(MessageBuffer));
