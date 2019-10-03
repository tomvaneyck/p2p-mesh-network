"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MeshEventType;
(function (MeshEventType) {
    MeshEventType[MeshEventType["connectedToNetwork"] = 0] = "connectedToNetwork";
    MeshEventType[MeshEventType["disconnectedFromNetwork"] = 1] = "disconnectedFromNetwork";
    MeshEventType[MeshEventType["connectedToPeer"] = 2] = "connectedToPeer";
    MeshEventType[MeshEventType["disconnectedFromPeer"] = 3] = "disconnectedFromPeer";
    MeshEventType[MeshEventType["connectionToPeerRejected"] = 4] = "connectionToPeerRejected";
    MeshEventType[MeshEventType["networkChange"] = 5] = "networkChange";
    MeshEventType[MeshEventType["outOfBufferBounds"] = 6] = "outOfBufferBounds";
    MeshEventType[MeshEventType["malformedMessage"] = 7] = "malformedMessage";
    MeshEventType[MeshEventType["timeOut"] = 8] = "timeOut";
})(MeshEventType = exports.MeshEventType || (exports.MeshEventType = {}));
