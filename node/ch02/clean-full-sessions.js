var redis = require('redis'),
	client = redis.createClient();

var LIMIT = 10000000;

var limit = process.argv.length > 2 ? parseInt(process.argv[2], 10) : LIMIT;
var maxRuns = process.argv.length > 3 ? parseInt(process.argv[3], 10) : 10;
var doLog = process.argv.length > 4 ? process.argv[4] !== 'false' : true;

// Optionally turn logging off
var log = function() {
	var args = Array.prototype.slice.call(arguments);
	if (doLog) {
		console.log.apply(null, args);
	}
};

log('clean-full-sessions started');
log('limit', limit, 'maxRuns', maxRuns);

var tokensToSessionKeys = function(tokens) {
	var sessionKeys = [];
	tokens.forEach(function(token) {
		sessionKeys.push('viewed:' + token);
		sessionKeys.push('cart:' + token);
	});
	return sessionKeys;
};

var deleteSessions = function(tokens, cb) {
	var sessionKeys = tokensToSessionKeys(tokens);
	client.del(sessionKeys, function(err) {
		if (err) return cb(err);
		client.hdel(["login:"].concat(tokens), function(err) {
			if (err) return cb(err);
			client.zrem(["recent:"].concat(tokens), function(err) {
				if (err) return cb(err);
				cb();
			});
		});
	});
};

var cleanFullSessions = function(cb) {
	client.zcard('recent:', function(err, size) {
		if (err) return cb(err);
		if (size > limit) {
			var endIndex = Math.min(size - limit, 100);
			client.zrange('recent:', 0, endIndex - 1, function(err, tokens) {
				if (err) return cb(err);
				deleteSessions(tokens, function(err) {
					if (err) return cb(err);
					cb(null, size);
				});
			});
		} else {
			cb(null, 0);
		}
	});
};

// Run every second
var count = 0;
var callCleanFullSessions = function() {
	cleanFullSessions(function(err, result) {
		if (!err) log('number of sessions cleaned', result);
		if (err || count >= maxRuns) {
			process.exit(err ? 1 : 0);
		}
	});
	if (count <= maxRuns) {
		count += 1;
		setTimeout(callCleanFullSessions, 1000);
	}
};

callCleanFullSessions();
