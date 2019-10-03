"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var rxjs_1 = require("rxjs");
var event_1 = require("../event");
var operators_1 = require("rxjs/operators");
var ConnectionGraph = /** @class */ (function () {
    function ConnectionGraph(address) {
        this._events = new rxjs_1.Subject();
        this.connections = new Map();
        this.address = address;
        this.addNode(address);
    }
    Object.defineProperty(ConnectionGraph.prototype, "events", {
        get: function () {
            return this._events.pipe(operators_1.debounceTime(1000));
        },
        enumerable: true,
        configurable: true
    });
    ConnectionGraph.prototype.notifyChange = function () {
        this._events.next({
            type: event_1.MeshEventType.networkChange,
            message: "The network topography changed."
        });
    };
    Object.defineProperty(ConnectionGraph.prototype, "topography", {
        get: function () {
            return this.connections;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionGraph.prototype, "numberOfNodes", {
        get: function () {
            return this.connections.size;
        },
        enumerable: true,
        configurable: true
    });
    // public get numberOfNodes(): number {
    //     return this.connections.size;
    // }
    ConnectionGraph.prototype.addNode = function (address) {
        if (!this.connections.has(address)) {
            this.connections.set(address, new Set());
            this.notifyChange();
        }
    };
    ConnectionGraph.prototype.removeNode = function (address) {
        var neighbours = this.connections.get(address);
        if (neighbours && neighbours.size == 0) {
            this.connections.delete(address);
            this.notifyChange();
        }
    };
    ConnectionGraph.prototype.removeNeighbour = function (address) {
        this.connections.get(this.address).delete(address);
        this.connections.get(address).delete(this.address);
        this.removeNode(address);
        this.notifyChange();
    };
    ConnectionGraph.prototype.setNodeNeighbours = function (address, neighbours) {
        var e_1, _a;
        try {
            for (var neighbours_1 = tslib_1.__values(neighbours), neighbours_1_1 = neighbours_1.next(); !neighbours_1_1.done; neighbours_1_1 = neighbours_1.next()) {
                var neighbour = neighbours_1_1.value;
                this.addNode(neighbour);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (neighbours_1_1 && !neighbours_1_1.done && (_a = neighbours_1.return)) _a.call(neighbours_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this.connections.set(address, new Set(neighbours));
        this.notifyChange();
    };
    ConnectionGraph.prototype.addConnection = function (source, destination) {
        var sourceNeighbours = !this.connections.get(source) ? new Set() : this.connections.get(source);
        sourceNeighbours.add(destination);
        this.connections.set(source, sourceNeighbours);
        var destinationNeighbours = !this.connections.get(destination) ? new Set() : this.connections.get(destination);
        destinationNeighbours.add(source);
        this.connections.set(destination, destinationNeighbours);
        this.notifyChange();
    };
    ConnectionGraph.prototype.constructRoutingTree = function () {
        var e_2, _a, e_3, _b;
        var root = {
            address: this.address,
            children: []
        };
        // Add the neighbours of this node to the candidates. 
        var visitedNodes = new Set(this.address);
        var candidates = [];
        try {
            for (var _c = tslib_1.__values(this.connections.get(this.address)), _d = _c.next(); !_d.done; _d = _c.next()) {
                var neighbour = _d.value;
                candidates.push([neighbour, root]);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_2) throw e_2.error; }
        }
        // Keep looking at candidates for tree insertion untill none are over.
        while (candidates.length > 0) {
            var currentCandidate = candidates.shift();
            var currentNode = currentCandidate[0];
            var parentTreeNode = currentCandidate[1];
            // If node has not been handled before, add node to the tree.
            if (!visitedNodes.has(currentNode)) {
                visitedNodes.add(currentNode);
                // Add node to tree adding it to the referenced parent node.
                var currentTreeNode = {
                    address: currentNode,
                    children: []
                };
                parentTreeNode.children.push(currentTreeNode);
                try {
                    // Add all neighbours of this node to the candidates.
                    for (var _e = (e_3 = void 0, tslib_1.__values(this.connections.get(currentNode))), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var neighbour = _f.value;
                        candidates.push([neighbour, currentTreeNode]);
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
        }
        return root;
    };
    ConnectionGraph.prototype.addToRoutingTable = function (nextHop, currentNode, distance, routingTable) {
        var e_4, _a;
        routingTable[currentNode.address] = {
            nextHop: nextHop,
            distance: distance
        };
        try {
            for (var _b = tslib_1.__values(currentNode.children), _c = _b.next(); !_c.done; _c = _b.next()) {
                var treeNode = _c.value;
                this.addToRoutingTable(nextHop, treeNode, distance + 1, routingTable);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
    };
    ConnectionGraph.prototype.makeRoutingTable = function () {
        var e_5, _a;
        var root = this.constructRoutingTree();
        var routingTable = {};
        try {
            for (var _b = tslib_1.__values(root.children), _c = _b.next(); !_c.done; _c = _b.next()) {
                var treeNode = _c.value;
                this.addToRoutingTable(treeNode.address, treeNode, 1, routingTable);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return routingTable;
    };
    return ConnectionGraph;
}());
exports.ConnectionGraph = ConnectionGraph;
