var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

// Consts
const PLUGIN_NAME = 'gulp-prefixer';

function applyCssModule (moduleName, contents) {
    var modularized = contents.replace(
        /([;}\s]+\.)([a-z\-][a-z0-9\-]+\s*{)/gi,
        '$1' + moduleName + '$2'
    );
    return modularized;
}

function prefixStream(moduleName) {
    var stream = through();
    stream.write(moduleName);
    return stream;
}

// Plugin level function(dealing with files)
function gulpPrefixer(moduleName) {

    if (!moduleName) {
        throw new PluginError(PLUGIN_NAME, 'Missing module name');
    }
    // moduleName = new Buffer(moduleName); // allocate ahead of time

    // Creating a stream through which each file will pass
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            // return empty file
            return cb(null, file);
        }
        if (file.isBuffer()) {
            var contentsStr = applyCssModule(moduleName, (file.contents).toString());

            file.contents = new Buffer(contentsStr);
        }
        if (file.isStream()) {
            file.contents = file.contents.pipe(prefixStream(moduleName));
        }

        cb(null, file);

    });

}

// Exporting the plugin main function
module.exports = gulpPrefixer;
