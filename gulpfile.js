// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, lastRun, parallel } = require('gulp');
// Importing all the Gulp-related packages we want to use
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const del = require('del');
const babel = require('gulp-babel');
const browserSync = require('browser-sync').create();
// const gulpif = require('gulp-if');
var fs = require('fs');
var replace = require('gulp-replace');
var rename = require('gulp-rename');
// var argv = require('yargs').argv;

var settings = {
	reload: true,
	styles: true,
	scripts: true,
	clean: true,
	copy: true,
};

// Configure these to suit your needs
var paths = {
	input: 'src/',
	tmp: 'tmp/',
	output: 'assets/',
	scripts: {
		input: 'src/js/*',
		tmp: 'tmp/js/',
		output: 'assets/js/'
	},
	styles: {
		input: 'src/scss/**/*.scss',
		tmp: 'tmp/css/',
		output: 'assets/css/'
	},
	perch: {
		html: 'perch/templates/**/*.html',
		php: 'perch/templates/**/*.php',
	},
	copy: {
		input: 'src/fonts/',
		tmp: 'tmp/fonts/',
		output: 'assets/fonts/',
		files: '*.{ttf,woff,eof,svg}'
	},
	copyImages: {
		input: 'src/images/',
		tmp: 'tmp/images/',
		output: 'assets/images/',
		files: '*.{jpg,png,svg}'
	}
};

// Watch for changes to the tmp directory
var startServer = function (done) {

	// Make sure this feature is activated before running
	if (!settings.reload) return done();

	// Initialize BrowserSync
	browserSync.init({
		injectChanges: true,
		server: {
            baseDir: "./"
        }
	});

	// Signal completion
	done();

};

// Reload the browser when files change
var reloadBrowser = function (done) {
	if (!settings.reload) return done();
	browserSync.reload();
	done();
};

function buildStyles(done){    
	// Make sure this feature is activated before running
	if (!settings.styles) return done();

	return src(paths.styles.input)
			.pipe(sourcemaps.init()) // initialize sourcemaps first
			.pipe(sass()) // compile SCSS to CSS
			.on("error", sass.logError)
			.pipe(postcss([ autoprefixer()])) // PostCSS plugins
			.pipe(sourcemaps.write('.')) // write sourcemaps file in current directory
			.pipe(dest(paths.styles.tmp)
	); // put final CSS in dist folder
}

function minifyStyles(done){    
	// Make sure this feature is activated before running
	if (!settings.styles) return done();

	return src(paths.styles.input)
			.pipe(sass()) // compile SCSS to CSS
			.on("error", sass.logError)
			.pipe(postcss([ autoprefixer(), cssnano()])) // PostCSS plugins
			.pipe(rename({suffix: '.min'}))
			.pipe(dest(paths.styles.output)
	); // put final CSS in dist folder
}

// JS task: concatenates and uglifies JS files to script.js
function buildScripts(done){
	// Make sure this feature is activated before running
	if (!settings.scripts) return done();

	return src([
			paths.scripts.input
			//,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
			])
			//.pipe(concat('all.js'))
			.pipe(dest(paths.scripts.tmp)
	);
}

function minifyScripts(done){
	// Make sure this feature is activated before running
	if (!settings.scripts) return done();

	return src([
			paths.scripts.input
			//,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
			])
			//.pipe(concat('all.js'))
			.pipe(babel({
				presets: ['@babel/env']
			}))
			.pipe(uglify())
			.pipe(rename({suffix: '.min'}))
			.pipe(dest(paths.scripts.output)
	);
}

function copyFilesTmp(done) {
	// Make sure this feature is activated before running
	if (!settings.copy) return done();

	// Copy static files
	// Check if directory exists
	if (fs.existsSync(paths.copy.input)) {
		return src(paths.copy.input+'/*')
			.pipe(dest(paths.copy.tmp));
	} else{
		console.log('No fonts to copy.');
	}

	// Signal completion
	return done();
}

function copyImagesTmp(done) {
	// Make sure this feature is activated before running
	if (!settings.copy) return done();

	// Copy static files
	// Check if directory exists
	if (fs.existsSync(paths.copyImages.input)) {
		return src(paths.copyImages.input+'/*')
			.pipe(dest(paths.copyImages.tmp));
	} else{
		console.log('No images to copy.');
	}

	// Signal completion
	return done();
}

function copyFilesDist(done) {
	// Make sure this feature is activated before running
	if (!settings.copy) return done();

	// Copy static files
	// Check if directory exists
	if (fs.existsSync(paths.copy.input)) {
		return src(paths.copy.input+'/*')
			.pipe(dest(paths.copy.output));
	} else{
		console.log('No fonts to copy.');
	}

	// Signal completion
	return done();
}

// Remove pre-existing content from output folders
var cleanTmp = function (done) {

	// Make sure this feature is activated before running
	if (!settings.clean) return done();

	// Clean the dist folder
	del.sync([
		paths.tmp
	]);

	// Signal completion
	return done();
};

var cleanDist = function (done) {

	// Make sure this feature is activated before running
	if (!settings.clean) return done();

	// Clean the dist folder
	del.sync([
		paths.output
	]);

	// Signal completion
	return done();
};

// Watch for changes
var watchSource = function (done) {
	watch([paths.input, paths.perch.html, paths.perch.php], series(exports.default, reloadBrowser));
	done();
};

// Development task
// Will export dev assets to tmp directory
exports.default = series(
	cleanTmp,
	cleanDist,
	parallel(
		buildStyles, 
		buildScripts,
		copyFilesTmp,
		copyImagesTmp
	)
);

// Watch and reload
// gulp watch
exports.watch = series(
	exports.default,
	startServer,
	watchSource
);

// Exports production css and js
// Deletes tmp directory
exports.build = series(
	cleanTmp,
	cleanDist,
	parallel(
		minifyStyles,
		minifyScripts,
		copyFilesDist
	)
);

