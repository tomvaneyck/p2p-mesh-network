import { Observable } from "rxjs";
export declare function debounceWithoutDelay<T>(source: Observable<T>, timeWindow?: number, scheduler?: import("rxjs/internal/scheduler/AsyncScheduler").AsyncScheduler): Observable<T>;
