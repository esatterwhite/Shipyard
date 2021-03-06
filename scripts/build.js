/*global process,console,__dirname*/
var path = require('path'),
    fs = require('fs'),
    shipyard = require('../'),
	object = require('../lib/shipyard/utils/object'),
	copy = require('dryice').copy;

exports.compile = function(appDir, dest, options) {
    var pack;
    try {
        pack = shipyard.loadPackage(appDir);
    } catch (ex) {
        console.error(ex.message);
        process.exit(1);
    }
    
    var meta = pack.shipyard;

    
    console.log('Starting build of %s...', pack.name);

	// Add the dependencies at `roots` to the project
	// `dir` contains the current app
	// `app` is what will get required() to start the file search
    var dir = path.join(appDir, '../'),
        app = path.join(pack.name, meta.app || './'),
        shipyardDir = path.join(__dirname, '../lib'),
		roots = [dir];
	
	if (meta.dependencies) {
		object.forEach(meta.dependencies, function(loc, name) {
            loc = loc.replace(name, '');
			roots.push(path.join(appDir, loc));
		});
	}
	roots.push(shipyardDir);

    // Ignores to quite the log messages
    var ignores = meta.ignore || [];
    ignores.push('jsdom');

    var project = copy.createCommonJsProject({
        roots: roots,
        ignoreErrors: ignores
    });

    var build = copy.createDataObject();

    // mini_require defaults to false, for now
    if (meta.mini_require || options.mini_require) {
        console.log('Including mini require...');
        copy({
            source: [path.join(__dirname, '../build/require.js')],
            dest: build
        });
    }
    
    console.log('Following all requires...');
    copy({
        source: copy.source.commonjs({
            project: project,
            require: [app]
        }),
        dest: build,
        filter: [filterNode, wrapDefines]
    });

    copy({
        source: [{
            value: 'document.addEventListener("DOMContentLoaded", function() {require("' + app +'");}, false);'
        }],
        dest: build
    });

    var finalFilters = [];
    if (options.force_minify || meta.min && !options.no_minify) {
        finalFilters.push(copy.filter.uglifyjs);
        console.log('Minifying...');
    }
    
    dest = dest || path.join(appDir, meta.target);
    console.log('Copying to %s...', dest);
    copy({
        source: build,
        dest: dest,
        filter: finalFilters
    });

    console.log('Done.');
};


// # __all()
// Finds all the modules of Shipyard, combines the contents into a
// single file, and minifies them. Don't ever do this!
function __all() {
    console.log('Building all of Shipyard...');
    console.log('Wait, what? This is a terrible idea...');
    // start with `lib` directory
    var start = path.join(__dirname, '../lib/');

    var buffer = [];

    // get list of all files + directories
    function collect(dir) {
        var names = fs.readdirSync(dir);
        names.forEach(function(name) {
            var p = path.join(dir, name);
            var stats = fs.statSync(p);
    // add files to project
            if (stats.isFile()) {
                var ext = path.extname(p);
                if (ext === '.js') {
                    var contents = fs.readFileSync(p);
                    var id = p.replace(start, '');
                    buffer.push(wrapDefines(contents, id));
                } else if (ext === '.ejs') {
                    // TODO: TemplateLoader thingy
                }
            } else {
    // recusrve with found directories
                collect(p);
            }
        });
    }

    // remember mini-require
    buffer.push(fs.readFileSync(path.join(__dirname, '../build/require.js')));
    collect(start);
    // output

    var shipyard_all = path.join(process.cwd, 'shipyard-all.js');
    var output = filterNode(buffer.join(''));
    // output = copy.filter.uglifyjs(output);
    fs.writeFileSync(shipyard_all, output);
    console.log('Oh, good God. What have you done?');
}

function filterNode(content, location) {
    if (typeof content !== 'string') {
		content = content.toString();
	}
    return content.replace(/<node>.*<\/node>/g, '');
}
filterNode.onRead = true;

function wrapDefines(content, location) {
    if (typeof content !== 'string') {
		content = content.toString();
	}
    if (location.base) {
        location = location.path;
    }
    location = location.replace(/(\.js|\/)$/, '');
    return "define('"+ location +"', [], function(require, exports, module){\n" + content +"\n});\n";
}
wrapDefines.onRead = true;

if (require.main === module) {
    if (process.argv[2] === '--all') {
        __all();
        return;
    }
    var src = path.join(process.cwd(), process.argv[2]),
        dest = path.join(process.cwd(), process.argv[3]);
    exports.compile(src, dest);
}
