import { Subject } from 'rxjs';
/**
 * A reactive implementation of a FIFO queue.
 */
export declare class ReactiveQueue<T> {
    private contents;
    readonly onAdd: Subject<T>;
    private readonly onRemove;
    /**
     * Returns the amount of elements in the queue.
     * @returns The amount of elements in the queue.
     */
    size(): number;
    /**
     * Pushes an item into the queue.
     * @param item The item to push on the queue.
     */
    push(item: T): void;
    /**
     * Removes the first element in the queue and returns it.
     * @returns The first element in the queue or `undefined` if the queue is empty.
     */
    pop(): T | undefined;
    /**
     * Returns the first element in the queue without removing it.
     * @returns The first element in the queue or `undefined` if the queue is empty.
     */
    peek(): T | undefined;
}
