
var crypto 		= require('crypto');
var MongoDB 	= require('mongodb').Db;
var Server 		= require('mongodb').Server;
var moment 		= require('moment');

var dbPort 		= 27017;
var dbHost 		= 'localhost';
var dbName 		= 'node-login';

/* establish the database connection */

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 0});
db.open(function(e, d){
	if (e) {
		console.log(e);
	}	else{
		console.log('connected to database :: ' + dbName);
	}
});
var users = db.collection('users');
var accounts = db.collection('accounts');
// users.insert(newData, {safe: true}, function(err,
// records){console.log("Record added as "+records[0]._id);});
// account.insert(defaultAccounts, {safe: true}, callback);
/*
 * var defaultAccounts={'accounts':[
 * {'name':'milk','amount':0,'type':"default",'date':''}
 * ,{'name':'bread','amount':0,'type':"default",'date':''}
 * ,{'name':'curd','amount':0,'type':"default",'date':''}
 * ,{'name':'sabji','amount':0,'type':"default",'date':''}
 * ],'user':'','email':'','userID':'','date':''};
 */
/* login validation methods */


exports.autoLogin = function(user, pass, callback)
{
	users.findOne({user:user}, function(e, o) {
		if (o){
			o.pass == pass ? callback(o) : callback(null);
		}	else{
			callback(null);
		}
	});
}

exports.manualLogin = function(user, pass, callback)
{
	users.findOne({user:user}, function(e, o) {
		if (o == null){
			callback('user-not-found');
		}	else{
			validatePassword(pass, o.pass, function(err, res) {
				if (res){
					callback(null, o);
				}	else{
					callback('invalid-password');
				}
			});
		}
	});
}

/* record insertion, update & deletion methods */

exports.addNewAccount = function(newData, callback)
{
	users.findOne({user:newData.user}, function(e, o) {
		if (o){
			callback('username-taken');
		}	else{
			users.findOne({email:newData.email}, function(e, o) {
				if (o){
					callback('email-taken');
				}	else{
					saltAndHash(newData.pass, function(hash){
						newData.pass = hash;
						// append date stamp when record was created //
						newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
						users.insert(newData, {safe: true}, function(err, records){
							console.log("Record added as "+records[0]._id);
							// users.insert(defaultAccounts, {safe: true},
							// callback);
						});					
					});
				}
			});
		}
	});
}

exports.updateAccount = function(newData, callback)
{
	users.findOne({user:newData.user}, function(e, o){
		o.name 		= newData.name;
		o.email 	= newData.email;
		o.country 	= newData.country;
		if (newData.pass == ''){
			users.save(o, {safe: true}, function(err) {
				if (err) callback(err);
				else callback(null, o);
			});
		}	else{
			saltAndHash(newData.pass, function(hash){
				o.pass = hash;
				users.save(o, {safe: true}, function(err) {
					if (err) callback(err);
					else callback(null, o);
				});
			});
		}
	});
}

exports.updatePassword = function(email, newPass, callback)
{
	users.findOne({email:email}, function(e, o){
		if (e){
			callback(e, null);
		}	else{
			saltAndHash(newPass, function(hash){
				o.pass = hash;
				users.save(o, {safe: true}, callback);
			});
		}
	});
}

/* account lookup methods */

exports.deleteAccount = function(id, callback)
{
	users.remove({_id: getObjectId(id)}, callback);
}

exports.getAccountByEmail = function(email, callback)
{
	users.findOne({email:email}, function(e, o){ callback(o); });
}

exports.validateResetLink = function(email, passHash, callback)
{
	users.find({ $and: [{email:email, pass:passHash}] }, function(e, o){
		callback(o ? 'ok' : null);
	});
}

exports.getAllRecords = function(callback)
{
	users.find().toArray(
			function(e, res) {
				if (e) callback(e)
				else callback(null, res)
			});
};

exports.delAllRecords = function(callback)
{
	users.remove({}, callback); // reset users collection for testing //
}

/* private encryption & validation methods */

var generateSalt = function()
{
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var salt = '';
	for (var i = 0; i < 10; i++) {
		var p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
}

var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

var saltAndHash = function(pass, callback)
{
	var salt = generateSalt();
	callback(salt + md5(pass + salt));
}

var validatePassword = function(plainPass, hashedPass, callback)
{
	var salt = hashedPass.substr(0, 10);
	var validHash = salt + md5(plainPass + salt);
	callback(null, hashedPass === validHash);
}

/* auxiliary methods */

var getObjectId = function(id)
{
	return users.db.bson_serializer.ObjectID.createFromHexString(id);
}

var findById = function(id, callback)
{
	users.findOne({_id: getObjectId(id)},
			function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};


var findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'}
// //
	users.find( { $or : a } ).toArray(
			function(e, results) {
				if (e) callback(e)
				else callback(null, results)
			});
}
// getObjectId
exports.getAllaccountsById=function(user,date,callback){
// accounts.findOne({"userID":getObjectId(id)},
	accounts.findOne({"date":date,"user":user},
			function(e, results) {
		if (e) callback(e)
		else callback(null, results)
	});
};

exports.updateAccount = function(id,newData, callback)
{
	users.save({"userID": getObjectId(id)},{'accounts':newData}, {safe: true}, function(err) {
		if (err) callback(err);else callback(null, o);
	});

}
exports.updateDefaultAccount = function(user,newData)
{
	// users.save({"user":user},{'accounts':newData});
// users.update({"user":user}, {$unset :{'accounts':newData}});
	users.update({"user":user}, {$set :{'accounts':newData}});
}
exports.creatNewAccount = function(datestamp,newData, callback) {
	accounts.remove({
		'datestamp' : datestamp
	}, function(err) {
		if (err) {
		console.log(err)
		} else {
			accounts.save(newData, {
				safe : true
			}, function(error, res) {
				if (error)
					callback(error, null);
					else
						callback(null, res);
			});
		}
	});

}
exports.sumAccount = function(callback)
{
// accounts.aggregate({$group:{ _id:"",accountst: {$sum: "$account"}}},
// function(err, result){if(err){return console.dir(err);}else{return
// console.log(result);}}
// );
	accounts.aggregate({$group: { _id: null,totalValue : {$sum:"$amount"}}}, 
			function(err, result) {
		if (err) callback (err, result)
		else callback (err, result);
	});
}
exports.findAccountsByDate = function(datestring,callback)
{
	accounts.find({'datestamp':datestring}).toArray(function(err, o) {
		if (err) {callback (err, null);}else{callback (null, o);}
	});
}