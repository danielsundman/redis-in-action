var redis = require('redis'),
	client = redis.createClient();

var LIMIT = 10000000;

console.log('clean-sessions started');
console.log('process.argv', process.argv);

var limit = process.argv.length > 2 ? parseInt(process.argv[2], 10) : LIMIT;

var cleanSessions = function(cb) {
	client.zcard('recent:', function(err, size) {
		if (err) return cb(err);
		console.log('recent:', 'size', size);
		if (size > limit) {
			var endIndex = Math.min(size - limit, 100);
			console.log('endIndex', endIndex);
			client.zrange('recent:', 0, endIndex -1, function(err, tokens) {
				if (err) return cb(err);
				var sessionKeys = [];
				console.log('tokens', tokens);
				tokens.forEach(function(token) {
					sessionKeys.push('viewed:' + token);
				});
				console.log('sessionKeys', sessionKeys);

				client.del(sessionKeys, function(err) {
					if (err) return cb(err);
					client.hdel("login:", tokens, function(err) {
						if (err) return cb(err);
						client.zrem("recent:", tokens, function(err) {
							if (err) return cb(err);
							cb(null, 'OK');
						});
					});
				});
			});
		}
	});
};

cleanSessions(function(err, result) {
	console.log('err', 'result', err, result);
	process.exit(err ? 1 : 0);
});
