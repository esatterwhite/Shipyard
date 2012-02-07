var Class = require('../class/Class'),
	Events = require('../class/Events'),
    QuerySet = require('../model/QuerySet'),
	object = require('../utils/object'),
    typeOf = require('../utils/type').typeOf,
    assert = require('../error/assert'),
	Sync = require('./Sync');

var DEFAULT = 'default';

function getSync(obj, name) {
	var using = name || DEFAULT,
		sync = obj.__syncs[using];
    assert(sync, 'This Syncable does not have a sync named "' + using + '"');
	return sync;
}

var Syncable = new Class({
	
	Implements: Events,
	
	save: function save(options) {
		options = options || {};

		var id = this.get('pk'),
			isNew = !id;

		this.emit('preSave', isNew);

		var onSave = function onSave() {
			this.emit('save', isNew);
		}.bind(this);

		var sync = getSync(this.constructor, options.using);
		if (isNew) {
			sync.create(this, onSave);
		} else {
			sync.update(id, this, onSave);
		}

		return this;
	},

	destroy: function destroy(options) {
		options = options || {};
		
		var id = this.get('pk');
		if (!id) {
			return null;
		}

		this.emit('preDestroy');

		var sync = getSync(this.constructor, options.using);
		sync.destroy(id, function onDelete(id) {
			this.emit('destroy', id);
		}.bind(this));

		return null;
	},

	emit: function emit(evt) {
		// overwrite Syncable.emit so that all events a syncable instances
		// fires can be observed by listening to the syncable Class
		Events.prototype.emit.apply(this, arguments);

		var klass = this.constructor;
		var args = [].slice.call(arguments, 1);
		args.unshift(this);
		args.unshift(evt);

		klass.emit.apply(klass, args);
	}

});

object.merge(Syncable, new Events());

Syncable.find = function find(options) {
	var klass = this;
	options = options || {};

    var qs = new QuerySet();
	function wrap(rows) {
        if (typeOf(rows) !== 'array') {
			rows = [rows];
		}
		qs.push.apply(qs, rows.map(function(m) {
            return new klass(m);
        }));
	}

	var sync = getSync(this, options.using);

	sync.read(options.conditions || {}, function(rows) {
		wrap(rows);
		if (typeof options.callback === 'function') {
			options.callback(qs);
		}
	});
	return qs;
};

Syncable.__syncs = {};

Syncable.addSync = function addSync(name, sync) {
	this.__syncs[name] = sync;
	return this;
};

Syncable.removeSync = function removeSync(name) {
	delete this.__syncs[name];
	return this;
};


// Sync mutator

Syncable.Mutators.Sync = function Sync(syncs) {
	object.forEach(syncs, function(options, name) {
		var klass;
		if (options.driver) {
			klass = options.driver;
			delete options.driver;
		} else {
			klass = options;
			options = null;
		}
		this.addSync(name, new klass(options));
	}, this);
};

module.exports = Syncable;
