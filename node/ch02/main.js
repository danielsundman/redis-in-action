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

module.exports = {
	checkToken: checkToken,
	updateToken: updateToken,
	addToCart: addToCart
};
