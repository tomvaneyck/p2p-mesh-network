import { Observable, asyncScheduler, of, merge, ConnectableObservable } from "rxjs";
import { share, switchMap, publish, delay, throttle, distinctUntilChanged, debounceTime } from "rxjs/operators";

export function awesomeDebounce<T>(source: Observable<T>, timeWindow = 1000, scheduler = asyncScheduler): Observable<T> {
    let shared = source.pipe(share());
    let notification = shared.pipe(
        switchMap(val => of(val).pipe(delay(timeWindow, scheduler))),
        publish()
    ) as ConnectableObservable<T>;

    notification.connect();

    return merge(
        shared.pipe(throttle(() => notification)),
        shared.pipe(debounceTime(timeWindow, scheduler))
        ).pipe(distinctUntilChanged());
}