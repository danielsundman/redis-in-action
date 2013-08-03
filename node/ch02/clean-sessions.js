var redis = require('redis'),
	client = redis.createClient();

var LIMIT = 10000000;

console.log('clean-sessions started');
var limit = process.argv.length > 2 ? parseInt(process.argv[2], 10) : LIMIT;
var maxRuns = process.argv.length > 3 ? parseInt(process.argv[3], 10) : 10;
console.log('limit', limit, 'maxRuns', maxRuns);

var cleanSessions = function(cb) {
	client.zcard('recent:', function(err, size) {
		if (err) return cb(err);
		if (size > limit) {
			var endIndex = Math.min(size - limit, 100);
			client.zrange('recent:', 0, endIndex - 1, function(err, tokens) {
				if (err) return cb(err);

				var sessionKeys = [];
				tokens.forEach(function(token) {
					sessionKeys.push('viewed:' + token);
				});

				client.del(sessionKeys, function(err) {
					if (err) return cb(err);
					client.hdel(["login:"].concat(tokens), function(err) {
						if (err) return cb(err);
						client.zrem(["recent:"].concat(tokens), function(err) {
							if (err) return cb(err);
							cb(null, size);
						});
					});
				});
			});
		} else {
			cb(null, 0);
		}

	});
};

var count = 0;
var timeoutFunction = function() {
	cleanSessions(function(err, result) {
		if (err || count >= maxRuns) {
			process.exit(err ? 1 : 0);
		} else {
			console.log('number of sessions cleaned', result);
		}
	});
	if (count < maxRuns) {
		count += 1;
		setTimeout(timeoutFunction, 1000);
	}
};

setTimeout(timeoutFunction, 1000);
