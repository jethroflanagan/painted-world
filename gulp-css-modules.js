var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-prefixer';

function applyCssModule(moduleName, contents) {
    // /(\.)([a-z\-][a-z0-9\-\:]+\s*,?\s*)/gi,

    return contents.replace(
        /(\.[a-z\-][a-z0-9\-\:]+(,\s*\.?[a-z\-][a-z0-9\-\:]*\s*)*)\s*{/gi,
        function (match) {
            return match.replace(/(\.)([a-z\-][a-z0-9\-\:]*)/ig, '$1' + moduleName + '$2');
        }
    );
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

            // TODO REPLACED FOR NOW by #{$module} in `scss`
            // file.contents = new Buffer(contentsStr);
        }
        if (file.isStream()) {
            file.contents = file.contents.pipe(prefixStream(moduleName));
        }

        cb(null, file);

    });

}

// Exporting the plugin main function
module.exports = gulpPrefixer;
