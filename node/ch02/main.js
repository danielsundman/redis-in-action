var crypto = require('crypto'),
	url = require('url');

var checkToken = function(client, token, cb) {
	client.hget('login:', token, function(err, result) {
		if (err) return cb(err);
		cb(null, result);
	});
};

var updateToken = function(client, token, user, item, cb) {
	var timestamp = new Date().getTime();
	client.hset('login:', token, user, function(err) {
		if (err) return cb(err);
		client.zadd('recent:', timestamp, token, function(err) {
			if (err) return cb(err);
			if (item) {
				client.zadd('viewed:' + token, timestamp, item, function(err) {
					if (err) return cb(err);
					client.zremrangebyrank('viewed:' + token, 0, -26, function(err) {
						if (err) return cb(err);
						client.zincrby('viewed:', -1, item, function(err) {
							if (err) return cb(err);
							cb();
						})
					});
				});
			} else {
				cb();
			}
		});
	});
};

var addToCart = function(client, session, item, count, cb) {
	if (count <= 0) {
		client.hrem('cart:' + session, item, function(err) {
			cb(err);
		});
	} else {
		client.hset('cart:' + session, item, count, function(err) {
			cb(err);
		});
	}
};

var isDynamic = function(query) {
	return '_' in query;
};

var canCache = function(client, request, cb) {
	var parsed = url.parse(request, true);
	var itemId = parsed.query.item;
	if (!itemId || isDynamic(parsed.query)) {
		return cb(null, false);
	}
	client.zrank('viewed:', itemId, function(err, rank) {
		if (err) return cb(err);
		return cb(null, rank !== undefined && rank < 10000);
	});
};

var hashRequest = function(request) {
	var hash = crypto.createHash("md5");
	hash.update(request);
	return hash.digest("hex");
};

var cacheRequest = function(client, request, requestCallback, cb) {
	canCache(client, request, function(err, cacheOk) {
		if (err) return cb(err);
		if (!cacheOk) return cb(null, requestCallback(request));
	});
	var pageKey = 'cache:' + hashRequest(request);
	client.get(pageKey, function(err, content) {
		if (err) return cb(err);
		if (!content && requestCallback) {
			content = requestCallback(request);
			client.setex(pageKey, 300, content, function(err) {
				if (err) return cb(err);
				cb(null, content);
			});
		} else {
			cb(null, content);
		}
	});
};

module.exports = {
	checkToken: checkToken,
	updateToken: updateToken,
	addToCart: addToCart,
	cacheRequest: cacheRequest,
	canCache: canCache
};
