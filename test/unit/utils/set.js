var Set = require('../../../lib/shipyard/utils/Set'),
    Spy = require('../../../lib/shipyard/test/Spy');


exports.Set = function(it, setup) {
    it('should have numeric indices', function(expect) {
        var s = new Set('a', 'b', 'c');

        expect(s[0]).toBe('a');
        expect(s[2]).toBe('c');
    });

    it('should have a length property', function(expect) {
        var s = new Set('a', 'b');

        expect(s.length).toBe(2);
    });

    it('should fire change events', function(expect) {
        var fn = new Spy();
        var s = new Set('a', 'b');
        s.addListener('change', fn);

        s.push('c');
        expect(fn).toHaveBeenCalled();
    });
};
