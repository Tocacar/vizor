if (typeof(require) === 'function')
	require('./commands/graphEditCommands')

function GraphApi(undoManager) {
	this.undoManager = undoManager
}

GraphApi.prototype.addNode = function(graph, node) {
	var cmd = new E2.commands.graph.AddNode(graph, node)
	return this.undoManager.execute(cmd)
}

GraphApi.prototype.removeNode = function(graph, node) {
	var cmd = new E2.commands.graph.RemoveNode(graph, node)
	return this.undoManager.execute(cmd)
}

GraphApi.prototype.connect = function(graph, srcNode, dstNode, srcSlot, dstSlot, offset) {
	offset = offset || 0
	var cmd = new E2.commands.graph.Connect(graph, srcNode, dstNode, srcSlot, dstSlot, offset)
	return this.undoManager.execute(cmd)
}

GraphApi.prototype.disconnect = function(graph, connection) {
	var cmd = new E2.commands.graph.Disconnect(graph, connection)
	return this.undoManager.execute(cmd)
}

GraphApi.prototype.move = function(graph, nodes, dx, dy) {
	var cmd = new E2.commands.graph.Move(graph, nodes, dx, dy)
	return this.undoManager.execute(cmd)
}

if (typeof(module) !== 'undefined')
	module.exports = GraphApi
