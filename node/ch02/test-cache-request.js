var ch02 = require('./main'),
	client = require('redis').createClient(),
	uuid = require('node-uuid'),
	os = require('os'),
	assert = require('assert');

client.flushdb();

var testCacheRequest = function(cb) {

	console.log(os.EOL, '--- testCacheRequest ---');

	var callback = function(request) {
		return 'content for ' + request;
	};

	var runOnce = function(user, item, url, cb) {
		var token = uuid.v4();

		ch02.updateToken(client, token, user, item, function() {
			console.log('We are going to cache a simple request against', url);
			ch02.cacheRequest(client, url, callback, function(err, result) {
				console.log('We got initial content', result);
				assert.ok(result);
				console.log('To test that we\'ve cached the request, we\'ll pass a null request callback', result);
				ch02.cacheRequest(client, url, null, function(err, result2) {
					console.log('We ended up getting the same response!', result2);
					assert.equal(result, result2);
					cb();
				});
			});
		});
	};

	runOnce('username', 'itemX', 'http://test.com/?item=itemX', cb);

	// For canCache tests, see mocha-test.js

};

testCacheRequest(function() {
	process.exit(0);
});
