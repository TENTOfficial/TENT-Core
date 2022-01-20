var gulp = require('gulp');
var rename = require('gulp-rename'); 
var uglify = require('gulp-uglifyes');
var plumber = require('gulp-plumber');
var plumberNotifier = require('gulp-plumber-notifier');
var sourcemaps = require('gulp-sourcemaps');
var runSequence = require('run-sequence').use(gulp);

gulp.task('compressapp', function () {
  return gulp.src(['src/mwapp.js'])
    .pipe(plumberNotifier())
    .pipe(uglify({ 
       mangle: true, 
       ecma: 6 ,
       toplevel: true
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('src'));
});

gulp.task('compressendscreen', function () {
  return gulp.src(['src/endscreen.js'])
    .pipe(plumberNotifier())
    .pipe(uglify({ 
       mangle: true, 
       ecma: 6 ,
       toplevel: true
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('src'));
});

gulp.task('compresssplashscreen', function () {
  return gulp.src(['src/splashscreen.js'])
    .pipe(plumberNotifier())
    .pipe(uglify({ 
       mangle: true, 
       ecma: 6 ,
       toplevel: true
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('src'));
});

gulp.task('compressdebuggingscreen', function () {
  return gulp.src(['src/debuggingscreen.js'])
    .pipe(plumberNotifier())
    .pipe(uglify({ 
       mangle: true, 
       ecma: 6 ,
       toplevel: true
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('src'));
});