"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MessageType;
(function (MessageType) {
    MessageType[MessageType["connectionAccepted"] = 0] = "connectionAccepted";
    MessageType[MessageType["connectionRejected"] = 1] = "connectionRejected";
    MessageType[MessageType["entryPointRequest"] = 2] = "entryPointRequest";
    MessageType[MessageType["entryPoint"] = 3] = "entryPoint";
    MessageType[MessageType["networkState"] = 4] = "networkState";
    MessageType[MessageType["networkStateRequest"] = 5] = "networkStateRequest";
    MessageType[MessageType["unicast"] = 6] = "unicast";
    MessageType[MessageType["broadcast"] = 7] = "broadcast";
    MessageType[MessageType["acknowledgement"] = 8] = "acknowledgement";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
