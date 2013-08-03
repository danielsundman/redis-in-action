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
						cb();
					})
				});
			} else {
				cb();
			}
		});
	});
};

module.exports = {
	checkToken: checkToken,
	updateToken: updateToken
};
