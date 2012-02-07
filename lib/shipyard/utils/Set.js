// Class: Set
//
// Behaves exactly like an Array, but mixed in with an EventEmitter.

var Class = require('../class/Class'),
    EventEmitter = require('../class/Events');

var slice = Array.prototype.slice;

var Set = new Class({

	Extends: EventEmitter,

    initialize: function Set() {
        this.push.apply(this, arguments);
    },

	toString: function() {
		return String(slice.call(this));
	}

});

var arrayMods = ['push', 'pop', 'unshift', 'shift'];
var arrayMethods = ['forEach', 'map', 'some', 'every', 'filter'];

arrayMethods.forEach(function(method) {
	Set.implement(method, Array.prototype[method]);
});

arrayMods.forEach(function(name) {
	var method = Array.prototype[name];
	Set.implement(name, function() {
		var ret = method.apply(this, arguments);
		this.emit('change', ret);
	});
});


module.exports = Set;
