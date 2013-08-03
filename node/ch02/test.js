var ch02 = require('./main'),
	client = require('redis').createClient(),
	uuid = require('node-uuid'),
	os = require('os'),
	fork = require('child_process').fork;

client.flushdb();

var startCleanSessions = function() {

	var p = fork(__dirname + '/clean-sessions', [0, 4]); // limit=0, maxRuns=4
	p.on('exit', function(code) {
		console.log('clean-sessions process exited with code ' + code);
		client.hlen("login:", function(err, s) {
			console.log("The current number of sessions still available is: ", s);
			client.quit();
		});
	});

};

var testLoginCookies = function() {

	console.log(os.EOL, '--- testLoginCookies ---');

	var runOnce = function(user, item) {
		var token = uuid.v4();

		ch02.updateToken(client, token, user, item, function(err) {
			if (err) console.log('err', err);
			console.log('We just logged in/updated token:', token);
			console.log('For user:', user, os.EOL);
			ch02.checkToken(client, token, function(err, result) {
				if (err) console.log('err', err);
				console.log('What username do we get when we look up that token?');
				console.log(result);
			});
		});
	};

	runOnce('username', 'itemX');
	runOnce('username2', 'itemY');

};

testLoginCookies();
startCleanSessions();
