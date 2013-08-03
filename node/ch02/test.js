var ch02 = require('./main'),
	client = require('redis').createClient(),
	uuid = require('node-uuid'),
	os = require('os'),
	fork = require('child_process').fork;

client.flushdb();

var runCleanSessions = function() {

	var p = fork('./clean-sessions', [0]);
	p.on('exit', function(code) {
		console.log('clean-sessions process exited with code ' + code);
		client.quit();
	});

};

var testLoginCookies = function() {

	console.log(os.EOL, '--- testLoginCookies ---');

	var runOnce = function(user, item) {
		var token = uuid.v4();

		ch02.updateToken(client, token, user, item, function(err) {
			if (err) console.log('err', err);
			console.log('We just logged in/updated token:', token);
			console.log('For user:', 'username', os.EOL);
			ch02.checkToken(client, token, function(err, result) {
				if (err) console.log('err', err);
				console.log('What username do we get when we look up that token?');
				console.log(result);

			});
		});
	};

	runOnce('username', 'itemX');
	runOnce('username2', 'itemY');
	runCleanSessions();

};

testLoginCookies();
