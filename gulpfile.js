//initialize all of our variables
var app, base, concat, directory, gulp, gutil, hostname, path, refresh, sass, uglify, imagemin, minifyCSS, del, browserSync, autoprefixer, gulpSequence, shell, sourceMaps, plumber;

var autoPrefixBrowserList = ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'];

//load all of our dependencies
//add more here if you want to include more libraries
gulp        = require('gulp');
gutil       = require('gulp-util');
concat      = require('gulp-concat');
uglify      = require('gulp-uglify');
sass        = require('gulp-sass');
sourceMaps  = require('gulp-sourcemaps');
imagemin    = require('gulp-imagemin');
minifyCSS   = require('gulp-minify-css');
browserSync = require('browser-sync');
autoprefixer = require('gulp-autoprefixer');
gulpSequence = require('gulp-sequence').use(gulp);
shell       = require('gulp-shell');
plumber     = require('gulp-plumber');
watch       = require('gulp-watch');
sourcemaps  = require('gulp-sourcemaps');
babel       = require('gulp-babel');
rollup      = require('gulp-rollup');
rollupIncludePaths = require('rollup-plugin-includepaths');

gulp.task('browserSync', function() {
    browserSync({
        server: {
            baseDir: ".dist/"
        },
        options: {
            reloadDelay: 250
        },
        notify: true,
        open: false,
    });
});


//compressing images & handle SVG files
gulp.task('images', function(tmp) {
    return gulp.src('app/images/**/*.*')
        //prevent pipe breaking caused by errors from gulp plugins
        // .pipe(plumber())
        // .pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))
        .pipe(gulp.dest('.dist/images'));
});



//fonts
gulp.task('fonts', function(tmp) {
    return gulp.src(['app/fonts/**/*.*'])
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(gulp.dest('.dist/fonts'));
});

gulp.task('scripts', function() {
    return gulp.src('app/scripts/**/*.js')

        .pipe(plumber())
        // .pipe(sourcemaps.init())
        .pipe(rollup({
            sourceMap: true,
            plugins: [
                rollupIncludePaths({
                    paths: ['app/js']
                })
            ],
            entry: 'app/scripts/main.js',
        }))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(concat('app.js'))
        .pipe(sourcemaps.write())
        .on('error', gutil.log)
        .pipe(gulp.dest('.dist/scripts'))
        .pipe(browserSync.reload({stream: true}));
});


gulp.task('styles', function() {
    //the initializer / master SCSS file, which will just be a file that imports everything
    return gulp.src('app/styles/styles.scss')
                //prevent pipe breaking caused by errors from gulp plugins
                .pipe(plumber({
                  errorHandler: function (err) {
                    console.log(err);
                    this.emit('end');
                  }
                }))
                //get sourceMaps ready
                .pipe(sourceMaps.init())
                //include SCSS and list every "include" folder
                .pipe(sass({
                      errLogToConsole: true,
                      includePaths: [
                          'app/styles/scss/'
                      ]
                }))
                .pipe(autoprefixer({
                   browsers: autoPrefixBrowserList,
                   cascade:  true
                }))
                //catch errors
                .on('error', gutil.log)
                //the final filename of our combined css file
                .pipe(concat('styles.css'))
                //get our sources via sourceMaps
                .pipe(sourceMaps.write())
                //where to save our final, compressed css file
                .pipe(gulp.dest('.dist/styles'))
                //notify browserSync to refresh
                .pipe(browserSync.reload({stream: true}));
});


gulp.task('html', function() {
    //watch any and all HTML files and refresh when something changes
    return gulp.src(['app/index.html', 'app/templates/**/*.html'])
        // .pipe(include())
        .pipe(plumber())
        .pipe(gulp.dest('.dist/'))
        .pipe(browserSync.reload({stream: true}))
        //catch errors
        .on('error', gutil.log);
});

gulp.task('vendor', function() {
    //watch any and all HTML files and refresh when something changes
    return gulp.src('app/vendor/**/*.*')
        // .pipe(include())
        .pipe(plumber())
        .pipe(gulp.dest('.dist/vendor'))
        .pipe(browserSync.reload({stream: true}))
        //catch errors
        .on('error', gutil.log);
});

gulp.task('data', function() {
    //watch any and all HTML files and refresh when something changes
    return gulp.src('app/data/**/*.*')
        // .pipe(include())
        .pipe(plumber())
        .pipe(gulp.dest('.dist/data'))
        .pipe(browserSync.reload({stream: true}))
        //catch errors
        .on('error', gutil.log);
});


gulp.task('clean', function() {
    return shell.task([
      'rm -rf .dist'
    ]);
});

process.env.NODE_ENV = 'development';

gulp.task('default', function() {
    gulp.run('clean');
    gulp.run('html');
    gulp.run('vendor');
    gulp.run('scripts');
    gulp.run('images');
    gulp.run('styles');
    gulp.run('data');
    gulp.run('fonts');
    gulp.run('browserSync');//, 'scripts', 'styles', 'fonts')

    //a list of watchers, so it will watch all of the following files waiting for changes
    gulp.watch('app/data/**/*.*', ['data']);
    gulp.watch('app/scripts/**/*.js', ['scripts']);
    gulp.watch('app/vendor/**/*.*', ['vendor']);
    gulp.watch('app/styles/**/*.scss', ['styles']);
    gulp.watch(['app/images/**/*.*'], ['images']);
    gulp.watch('app/fonts/**/*.*', ['fonts']);
    gulp.watch(['app/index.html', 'app/templates/**/*.html'], ['html']);
});
