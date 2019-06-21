import { Subject } from 'rxjs';

/**
 * A reactive implementation of a FIFO queue.
 */
export class ReactiveQueue<T> {
    private contents: T[] = [];
    public readonly onAdd: Subject<T> = new Subject<T>();
    private readonly onRemove: Subject<T> = new Subject<T>();

    /**
     * Returns the amount of elements in the queue.
     * @returns The amount of elements in the queue.
     */
    public size(): number {
        return this.contents.length;
    }

    /**
     * Pushes an item into the queue.
     * @param item The item to push on the queue.
     */
    public push(item: T): void {
        this.contents.push(item);
        this.onAdd.next(item);
    }

    /**
     * Removes the first element in the queue and returns it.
     * @returns The first element in the queue or `undefined` if the queue is empty.
     */
    public pop(): T | undefined {
        let item: T | undefined = this.contents.shift();
        if (item !== undefined) {
            this.onRemove.next(item);
        }
        return item;
    }

    /**
     * Returns the first element in the queue without removing it.
     * @returns The first element in the queue or `undefined` if the queue is empty.
     */
    public peek(): T | undefined {
        let item: T | undefined = this.contents[0];
        return item;
    }
}