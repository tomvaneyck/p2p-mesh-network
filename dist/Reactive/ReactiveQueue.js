"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
/**
 * A reactive implementation of a FIFO queue.
 */
var ReactiveQueue = /** @class */ (function () {
    function ReactiveQueue() {
        this.contents = [];
        this.onAdd = new rxjs_1.Subject();
        this.onRemove = new rxjs_1.Subject();
    }
    /**
     * Returns the amount of elements in the queue.
     * @returns The amount of elements in the queue.
     */
    ReactiveQueue.prototype.size = function () {
        return this.contents.length;
    };
    /**
     * Pushes an item into the queue.
     * @param item The item to push on the queue.
     */
    ReactiveQueue.prototype.push = function (item) {
        this.contents.push(item);
        this.onAdd.next(item);
    };
    /**
     * Removes the first element in the queue and returns it.
     * @returns The first element in the queue or `undefined` if the queue is empty.
     */
    ReactiveQueue.prototype.pop = function () {
        var item = this.contents.shift();
        if (item !== undefined) {
            this.onRemove.next(item);
        }
        return item;
    };
    /**
     * Returns the first element in the queue without removing it.
     * @returns The first element in the queue or `undefined` if the queue is empty.
     */
    ReactiveQueue.prototype.peek = function () {
        var item = this.contents[0];
        return item;
    };
    return ReactiveQueue;
}());
exports.ReactiveQueue = ReactiveQueue;
