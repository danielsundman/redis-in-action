#!/usr/local/bin/node
// Code adapted from http://ronderksen.nl/2012/05/03/debugging-mocha-tests-in-webstorm/

var Mocha = require('mocha'),
	path = require('path'),
	fs = require('fs'),
	chapter = process.argv.length > 2 ? process.argv[2] : undefined;

var mocha = new Mocha({
	reporter: 'dot',
	ui: 'bdd',
	timeout: 999999
});

var testDir = './' + (chapter ? chapter + '/' : '');

if (!fs.existsSync(testDir)) {
	console.log(testDir + ' does not exist!');
	process.exit(1);
}

var readRootDir = function(dir) {
	var files = fs.readdirSync(dir);
	files.forEach(function(file) {
		if (file.match(/.*mocha-test\.js/)) {
			mocha.addFile(dir + '/' + file);
		} else if (file.match(/ch0[1-2]/)) {
			readRootDir(dir + file);
		}
	});
};
readRootDir(testDir);

var runner = mocha.run(function () {
	console.log('finished');
});

runner.on('pass', function (test) {
//	console.log('... %s passed', test.title);
});

runner.on('fail', function (test) {
	console.log('... %s failed', test.title);
});
