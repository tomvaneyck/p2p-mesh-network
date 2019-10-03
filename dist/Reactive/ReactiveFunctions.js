"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
function debounceWithoutDelay(source, timeWindow, scheduler) {
    if (timeWindow === void 0) { timeWindow = 1000; }
    if (scheduler === void 0) { scheduler = rxjs_1.asyncScheduler; }
    var shared = source.pipe(operators_1.share());
    var notification = shared.pipe(operators_1.switchMap(function (val) { return rxjs_1.of(val).pipe(operators_1.delay(timeWindow, scheduler)); }), operators_1.publish());
    notification.connect();
    return rxjs_1.merge(shared.pipe(operators_1.throttle(function () { return notification; })), shared.pipe(operators_1.debounceTime(timeWindow, scheduler))).pipe(operators_1.distinctUntilChanged());
}
exports.debounceWithoutDelay = debounceWithoutDelay;
