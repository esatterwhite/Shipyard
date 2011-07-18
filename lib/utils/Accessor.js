// Parts copied or inspired by MooTools (http://mootools.net) 
// - MIT Licence
var typeOf = require('./type').typeOf,
	object = require('./object');

module.exports = function(singular, plural){

	var accessor = {}, matchers = [];

	if (!plural) plural = singular + 's';

	var define = 'define', lookup = 'lookup', match = 'match', each = 'each';

	var defineSingular = this[define + singular] = function(key, value){
		if (typeOf(key) == 'regexp') matchers.push({'regexp': key, 'value': value, 'type': typeOf(value)});
		else accessor[key] = value;
		return this;
	};

	var definePlural = this[define + plural] = function(object){
		for (var key in object) accessor[key] = object[key];
		return this;
	};

	var lookupSingular = this[lookup + singular] = function(key){
		if (accessor.hasOwnProperty(key)) return accessor[key];
		for (var l = matchers.length; l--; l){
			var matcher = matchers[l], matched = key.match(matcher.regexp);
			if (matched && (matched = matched.slice(1))){
				if (matcher.type == 'function') return function(){
					return matcher.value.apply(this, [].slice.call(arguments).concat(matched));
				}; else return matcher.value;
			}
		}
		return null;
	};

	var lookupPlural = this[lookup + plural] = function(){
		var results = {};
		for (var i = 0; i < arguments.length; i++){
			var argument = arguments[i];
			results[argument] = lookupSingular(argument);
		}
		return result;
	};

	var eachSingular = this[each + singular] = function(fn, bind){
		object.forEach(accessor, fn, bind);
	};

};

