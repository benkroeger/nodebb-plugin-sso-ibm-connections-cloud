(function(module) {
	"use strict";

	var User = module.parent.require('./user'),
		meta = module.parent.require('./meta'),
		db = module.parent.require('../src/database'),
		passport = module.parent.require('passport'),
		PassportIBMConnectionsCloud = require('passport-ibm-connections-cloud').Strategy,
		fs = module.parent.require('fs'),
		path = module.parent.require('path'),
		nconf = module.parent.require('nconf'),
		async = module.parent.require('async');

	var constants = Object.freeze({
		'name': "IBM Connections Cloud",
		'admin': {
			'route': '/plugins/sso-ibm-connections-cloud',
			'icon': 'fa-magic'
		}
	});

	var IBMCloud = {};

	IBMCloud.init = function(data, callback) {
		function render(req, res, next) {
			res.render('admin/plugins/sso-ibm-connections-cloud', {});
		}

		data.router.get('/admin/plugins/sso-ibm-connections-cloud', data.middleware.admin.buildHeader, render);
		data.router.get('/api/admin/plugins/sso-ibm-connections-cloud', render);

		callback();
	};

	IBMCloud.getStrategy = function(strategies, callback) {
		meta.settings.get('sso-ibm-connections-cloud', function(err, settings) {
			if (!err && settings && settings.id && settings.secret) {
				passport.use(new PassportIBMConnectionsCloud({
					hostname: settings.hostname || 'apps.na.collabserv.com',
					clientID: settings.id,
					clientSecret: settings.secret,
					callbackURL: nconf.get('url') + '/auth/ibm-connections-cloud/callback',
					state: false,
				}, function(accessToken, refreshToken, params, profile, done) {
					// @TODO: add photo back in
					IBMCloud.login(profile.id, profile.displayName, profile.emails[0].value, null, function(err, user) {
						if (err) {
							return done(err);
						}
						done(null, user);
					});
				}));

				strategies.push({
					name: 'ibm-connections-cloud',
					url: '/auth/ibm-connections-cloud',
					callbackURL: '/auth/ibm-connections-cloud/callback',
					icon: 'fa-magic',
					scope: ''
				});
			}

			callback(null, strategies);
		});
	};

	IBMCloud.login = function(ibmcloudId, handle, email, picture, callback) {
		IBMCloud.getUidByIBMCloudId(ibmcloudId, function(err, uid) {
			if (err) {
				return callback(err);
			}

			if (uid !== null) {
				// Existing User
				callback(null, {
					uid: uid
				});
			} else {
				// New User
				var success = function(uid) {
					// Save ibmcloud-specific information to the user
					User.setUserField(uid, 'ibmconnectionscloud', ibmcloudId);
					db.setObjectField('ibmconnectionscloud:uid', ibmcloudId, uid);

					// Save their photo, if present
					if (picture) {
						User.setUserField(uid, 'uploadedpicture', picture);
						User.setUserField(uid, 'picture', picture);
					}

					callback(null, {
						uid: uid
					});
				};

				User.getUidByEmail(email, function(err, uid) {
					if (err) {
						return callback(err);
					}

					if (!uid) {
						User.create({
							username: handle,
							email: email
						}, function(err, uid) {
							if (err) {
								return callback(err);
							}

							success(uid);
						});
					} else {
						success(uid); // Existing account -- merge
					}
				});
			}
		});
	};

	IBMCloud.getUidByIBMCloudId = function(ibmcloudId, callback) {
		db.getObjectField('ibmconnectionscloud:uid', ibmcloudId, function(err, uid) {
			if (err) {
				return callback(err);
			}
			callback(null, uid);
		});
	};

	IBMCloud.addMenuItem = function(custom_header, callback) {
		custom_header.authentication.push({
			"route": constants.admin.route,
			"icon": constants.admin.icon,
			"name": constants.name
		});

		callback(null, custom_header);
	};

	IBMCloud.deleteUserData = function(uid, callback) {
		async.waterfall([
			async.apply(User.getUserField, uid, 'ibmconnectionscloud'),
			function(oAuthIdToDelete, next) {
				db.deleteObjectField('ibmconnectionscloud:uid', oAuthIdToDelete, next);
			}
		], function(err) {
			if (err) {
				// winston.error('[sso-ibm-connections-cloud] Could not remove OAuthId data for uid ' + uid + '. Error: ' + err);
				return callback(err);
			}
			callback(null, uid);
		});
	};

	module.exports = IBMCloud;
}(module));