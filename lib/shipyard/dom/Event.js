var Class = require('../class/Class'),
    overloadSetter = require('../utils/function').overloadSetter;

var _keys = {};

var Event = module.exports = new Class({

    initialize: function DOMEvent(event, win) {
        event = event || win.event;
        if (event.__extended) {
			return event;
		}
        this.event = event;
        this.__extended = true;
        this.shift = event.shiftKey;
        this.control = event.ctrlKey;
        this.alt = event.altKey;
        this.meta = event.metaKey;
        var type = this.type = event.type;
        var target = event.target || event.srcElement;
        while (target && target.nodeType === 3) {
			target = target.parentNode;
		}

        //TODO: to make .target be an element wrapper
        this.target = target;

        if (type.indexOf('key') === 0) {
            var code = this.code = (event.which || event.keyCode);
            this.key = _keys[code];
            if (type === 'keydown'){
                if (code > 111 && code < 124) {
					this.key = 'f' + (code - 111);
				} else if (code > 95 && code < 106) {
					this.key = code - 96;
				}
            }
            if (this.key == null) {
				this.key = String.fromCharCode(code).toLowerCase();
			}
        } else if (type === 'click' || type === 'dblclick' || type === 'contextmenu' || type === 'DOMMouseScroll' || type.indexOf('mouse') === 0) {
            var doc = win.document;
            doc = (!doc.compatMode || doc.compatMode === 'CSS1Compat') ?
                doc.documentElement : doc.body;
            this.page = {
                x: (event.pageX != null) ? event.pageX : event.clientX + doc.scrollLeft,
                y: (event.pageY != null) ? event.pageY : event.clientY + doc.scrollTop
            };
            this.client = {
                x: (event.pageX != null) ? event.pageX - win.pageXOffset : event.clientX,
                y: (event.pageY != null) ? event.pageY - win.pageYOffset : event.clientY
            };
            if (type === 'DOMMouseScroll' || type === 'mousewheel') {
                this.wheel = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
			}

            this.rightClick = (event.which === 3 || event.button === 2);
            if (type === 'mouseover' || type === 'mouseout'){
                var related = event.relatedTarget || event[(type === 'mouseover' ? 'from' : 'to') + 'Element'];
                while (related && related.nodeType === 3) {
					related = related.parentNode;
				}
                //TODO: make relatedTarget an element wrapper
                this.relatedTarget = related;
            }
        } else if (type.indexOf('touch') === 0 || type.indexOf('gesture') === 0) {
            this.rotation = event.rotation;
            this.scale = event.scale;
            this.targetTouches = event.targetTouches;
            this.changedTouches = event.changedTouches;
            var touches = this.touches = event.touches;
            if (touches && touches[0]){
                var touch = touches[0];
                this.page = {x: touch.pageX, y: touch.pageY};
                this.client = {x: touch.clientX, y: touch.clientY};
            }
        }

        if (!this.client) {
			this.client = {};
		}
        if (!this.page) {
			this.page = {};
		}
    },

    preventDefault: function preventDefault() {
        if (this.event.preventDefault) {
			this.event.preventDefault();
		} else {
			this.event.returnValue = false;
		}
		return this;
    },

    stopPropagation: function stopPropagation() {
        if (this.event.stopPropagation) {
			this.event.stopPropagation();
		} else {
			this.event.cancelBubble = true;
		}
		return this;
    },

    stop: function stop() {
        return this.preventDefault().stopPropagation();
    }

});

Event.defineKey = function(code, key) {
    _keys[code] = key;
    return this;
};

Event.defineKeys = overloadSetter(Event.defineKey);

Event.defineKeys({
    '38': 'up',
    '40': 'down',
    '37': 'left',
    '39': 'right',
    '27': 'esc',
    '32': 'space',
    '8': 'backspace',
    '9': 'tab',
    '46': 'delete',
    '13': 'enter',
	'16': 'shift',
	'17': 'control',
	'18': 'alt',
	'20': 'capslock',
	'33': 'pageup',
	'34': 'pagedown',
	'35': 'end',
	'36': 'home',
	'144': 'numlock',
	'145': 'scrolllock',
	'186': ';',
	'187': '=',
	'188': ',',
	'190': '.',
	'191': '/',
	'192': '`',
	'219': '[',
	'220': '\\',
	'221': ']',
	'222': "'",
	'107': '+'
});
