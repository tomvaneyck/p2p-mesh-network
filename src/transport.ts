import { NetworkEntity } from './network';
import { Subject, Subscription, interval, ReplaySubject } from 'rxjs';
import { Message, MessageType, Acknowledgement } from './message';
import { MeshEvent, MeshEventType } from './event';

export class TransportEntity {
    private address: string;

    public incomingMessages: Subject<Message> = new Subject<Message>();
    
    public events: ReplaySubject<MeshEvent> = new ReplaySubject<MeshEvent>();
    
    private _globalMessageIndex: number = 0;
    private get globalMessageIndex() {
        return this._globalMessageIndex++;
    }
    private messageBuffers: { [address: string]: MessageBuffers } = {};
    
    private networkEntity: NetworkEntity;

    constructor(address: string, networkEntity: NetworkEntity) {
        this.address = address;

        this.networkEntity = networkEntity;
        this.networkEntity.incomingMessages.subscribe((message: Message) => {
            this.handleIncomingMessage(message);
        });
    }

    public sendMessage(message: Message) {
        switch(message.header.type) {
            case MessageType.broadcast:
                message.header.index = this.globalMessageIndex;
                this.networkEntity.sendMessage(message);
                break;
            case MessageType.unicast:
                this.handleUnicastMessage(message);
                break;
            default:
                this.events.next({
                    message: "This message is not yet supported by the transport layer.",
                    type: MeshEventType.malformedMessage,
                    metadata: message
                });
        }
    }

    private handleUnicastMessage(message: Message): void {
        let destAddr = message.header.destinationAddress!;
        if (!this.messageBuffers[destAddr]) {
            this.messageBuffers[destAddr] = new MessageBuffers();
        }

        let sendBuffer = this.messageBuffers[destAddr].sendBuffer;

        // Clear buffer if acks are received for all messages
        if (sendBuffer.canReset()) {
            sendBuffer.reset();
            console.log("Sendbuffer reset");
        }

        let messageIndex: number = sendBuffer.messageIndex;
        message.header.index = messageIndex;
        let bufferIndex: number = messageIndex % MessageBuffer.bufferSize;

        console.log("BufferIndex", bufferIndex);
        console.log("ExpectedIndex + Node.bufferSize ", sendBuffer.expectedIndex + MessageBuffer.bufferSize)

        if (bufferIndex >= sendBuffer.expectedIndex && messageIndex < sendBuffer.upperBufferIndex()) {
            sendBuffer.buffer[bufferIndex] = message;

            this.networkEntity.sendMessage(sendBuffer.buffer[bufferIndex]);
            // Set timer for resending message if ack was not received.
            sendBuffer.timers[messageIndex] = interval(10000).subscribe(_ => {
                this.networkEntity.sendMessage(sendBuffer.buffer[bufferIndex]);
            });
        } else {
            this.events.next({
                message: "The message does not fit in the buffer.",
                type: MeshEventType.outOfBufferBounds,
                metadata: {
                    message: message,
                    expectedIndex: sendBuffer.expectedIndex
                }
            });
        }
    }

    /**
     * Take appropriate action based on message type.
     */
    private handleIncomingMessage(message: Message): void {
        switch(message.header.type) {
            case MessageType.broadcast:
                this.incomingMessages.next(message);
                break;
            case MessageType.unicast:
                this.handleReceivedUnicastMessage(message);
                break;
            case MessageType.acknowledgement:
                this.handleAcknowledgement(message);
                break;
            default:
                this.events.next({
                    message: "The message type of the incoming message is not recognized.",
                    type: MeshEventType.malformedMessage,
                    metadata: message
                });
        }
    }
    
    /**
     * Handles incoming acknowledgements.
     */
    private handleAcknowledgement(message: Message): void {
        let ack: Acknowledgement = <Acknowledgement>message;
        let sendBuffer: SendMessageBuffer = this.messageBuffers[message.header.sourceAddress].sendBuffer;

        // Indicate acknowledgement is received.
        sendBuffer.ackReceived[ack.body.index % MessageBuffer.bufferSize] = true;

        // Delete resend timer.
        // TODO: check if storage can be avoided so that auto deletion of subscriptions can be done.
        sendBuffer.timers[ack.body.index].unsubscribe();
        delete sendBuffer.timers[ack.body.index];
    }
    
    /**
     * Handles message when this node is the destination node of the message.
     */
    private handleReceivedUnicastMessage(message: Message): void {
        // Create buffers if they do not exist.
        let srcAddr = message.header.sourceAddress!;
        if (!this.messageBuffers[srcAddr]) {
            this.messageBuffers[srcAddr] = new MessageBuffers();
        }

        // Send acknwoledgement.
        let ack: Acknowledgement = {
            header: {
                sourceAddress: this.address,
                destinationAddress: message.header.sourceAddress,
                type: MessageType.acknowledgement
            },
            body: {
                index: message.header.index!
            }

        };
        this.networkEntity.sendMessage(ack);

        let messageIndex: number = message.header.index!;
        let bufferIndex: number = messageIndex % MessageBuffer.bufferSize;
        let receiveBuffer: MessageBuffer = this.messageBuffers[message.header.sourceAddress].receiveBuffer;

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
                } else {
                    break;
                }
            }
        }
    }
}

class MessageBuffers {
    public sendBuffer: SendMessageBuffer = new SendMessageBuffer();
    public receiveBuffer: MessageBuffer = new MessageBuffer();
}

class MessageBuffer {
    public static readonly bufferSize = 10;
    public expectedIndex: number = 0;
    private bufferPosition: number = 0;
    public buffer: Message[] = [];

    public upperBufferIndex(): number {
        return (this.bufferPosition + 1) * MessageBuffer.bufferSize;
    }

    public reset(): void {
        this.expectedIndex = 0;
        this.bufferPosition++;
        this.buffer = [];
    }
}

class SendMessageBuffer extends MessageBuffer {
    protected maxMessageIndex = 1000;
    private _messageIndex: number = 0;
    get messageIndex() { 
        if (this._messageIndex > this.maxMessageIndex) {
            this._messageIndex = 0;
        }
        return this._messageIndex++;
    }
    public ackReceived: boolean[] = [];
    public timers: { [messageIndex: number]: Subscription } = {};

    public reset(): void {
        super.reset();
        this.ackReceived = [];
    }

    public canReset(): boolean {
        if (this.ackReceived.length < MessageBuffer.bufferSize) {
            return false;
        } else {
            for (let ack of this.ackReceived) {
                if (!ack) {
                    return false;
                }
            }

            return true;
        }
    }
}