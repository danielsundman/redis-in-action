var ch02 = require('./main'),
	client = require('redis').createClient(),
	uuid = require('node-uuid'),
	os = require('os'),
	fork = require('child_process').fork;

client.flushdb();

var startCleanFullSessions = function() {

	var p = fork(__dirname + '/clean-full-sessions', [0, 4]); // limit=0, maxRuns=4
	p.on('exit', function(code) {
		console.log('clean-full-sessions process exited with code ' + code);
		client.hlen("login:", function(err, s) {
			console.log("The current number of sessions still available is: ", s);
			client.quit();
		});
	});

};

var testShoppingCartCookies = function() {

	console.log(os.EOL, '--- testShoppingCartCookies ---');

	var runOnce = function(user, item, count) {
		var token = uuid.v4();

		console.log('We\'ll refresh our session...');
		ch02.updateToken(client, token, user, item, function(err) {
			if (err) console.log('err', err);
			console.log('And add an item to the shopping cart');
			ch02.addToCart(client, token, 'itemY', count, function(err) {
				if (err) console.log('err', err);
				client.hgetall('cart:' + token, function(err, result) {
					console.log('Our shopping cart currently has:', result);
				});
			});
		});
	};

	runOnce('username', 'itemX', 3);
	runOnce('username2', 'itemXXX', 5);

};

testShoppingCartCookies();
startCleanFullSessions();

