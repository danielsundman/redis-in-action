describe('Redis in Action - Chapter 2', function() {
	var ch02 = require('./main'),
		redis = require('redis'),
		should = require('should'),
		fork = require('child_process').fork;

	var client;

	before(function() {
		client = redis.createClient();
		client.flushdb();
	});

	after(function() {
		client.quit();
	});

	describe('login cookies', function() {
		describe('token - user connection', function() {
			it('should be possible to look up the user given the token', function(done) {
				ch02.updateToken(client, 'tokenX', 'user', null, function(err) {
					if (err) return done(err);
					ch02.checkToken(client, 'tokenX', function(err, result) {
						result.should.equal('user');
						done(err);
					});
				});
			});
		});
		describe('session cleanup', function() {
			beforeEach(function(done) {
				client.flushdb();
				ch02.updateToken(client, 'token0', 'user0', null, function(err) {
					if (err) return done(err);
					ch02.updateToken(client, 'token1', 'user1', null, function() {
						done(err);
					});
				});
			});
			it('there should be 2 sessions', function(done) {
				client.zcard('recent:', function(err, size) {
					size.should.equal(2);
					done(err);
				});
			});
			it('after cleaning sessions there should not be any sessions left', function(done) {
				var p = fork(__dirname + '/clean-sessions', [0, 1, false]); // limit=0, maxRuns=1
				p.on('exit', function() {
					client.hlen("login:", function(err, size) {
						size.should.equal(0);
						done(err);
					});
				});
			});
		});
	});

});