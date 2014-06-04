var moment = require('moment');

var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');

module.exports = function(app) {

//	main login page //

	app.get('/', function(req, res){
		// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		}	else{
			// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
					req.session.user = o;
					res.redirect('/hms');
				}	else{
					res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});

	app.post('/', function(req, res){
		AM.manualLogin(req.param('user'), req.param('pass'), function(e, o){
			if (!o){
				res.send(e, 400);
			}	else{
				req.session.user = o;
				//   console.dir(o._id);
				//    var dddd=AM.getAllaccountsById(o._id,function(req,res){return res;});
				//    console.dir(dddd);
				if (req.param('remember-me') == 'true'){
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.send(o, 200);
			}
		});
	});

//	logged-in user homepage //

	app.get('/myaccount', function(req, res) {
		if (req.session.user == null){
			// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}   else{
			res.render('myaccount', {
				title : 'Control Panel',
				countries : CT,
				udata : req.session.user
			});
		}
	});

	app.post('/myaccount', function(req, res){
		if (req.param('user') != undefined) {
			AM.updateAccount({
				user 		: req.param('user'),
				name 		: req.param('name'),
				email 		: req.param('email'),
				country 	: req.param('country'),
				pass		: req.param('pass')
			}, function(e, o){
				if (e){
					res.send('error-updating-account', 400);
				}	else{
					req.session.user = o;
					// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined && req.cookies.uid != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
						res.cookie('uid', o._id, { maxAge: 900000 });	
					}
					res.send('ok', 200);
				}
			});
		}	else if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		}
	});

//	creating new accounts //

	app.get('/signup', function(req, res) {
		res.render('signup', {  title: 'Signup', countries : CT });
	});
	var defaultAccounts={'accounts':[
	                                 {'name':'milk'}
	                                 ,{'name':'bread'}
	                                 ,{'name':'curd'}
	                                 ,{'name':'sabji'}
	                                 ]};
	app.post('/signup', function(req, res){
		AM.addNewAccount({
			name 	: req.param('name'),
			email 	: req.param('email'),
			user 	: req.param('user'),
			pass	: req.param('pass'),
			country : req.param('country'),
			accounts:defaultAccounts.accounts
		}, function(e){
			if (e){
				res.send(e, 400);
			}	else{
				res.send('ok', 200);
			}
		});
	});

//	password reset //

	app.post('/lost-password', function(req, res){
		// look up the user's account via their email //
		AM.getAccountByEmail(req.param('email'), function(o){
			if (o){
				res.send('ok', 200);
				EM.dispatchResetPasswordLink(o, function(e, m){
					// this callback takes a moment to return //
					// should add an ajax loader to give user feedback //
					if (!e) {
						//	res.send('ok', 200);
					}	else{
						res.send('email-server-error', 400);
						for (k in e) console.log('error : ', k, e[k]);
					}
				});
			}	else{
				res.send('email-not-found', 400);
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
				// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});

	app.post('/reset-password', function(req, res) {
		var nPass = req.param('pass');
		// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
		// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.send('ok', 200);
			}	else{
				res.send('unable to update password', 400);
			}
		})
	});

//	view & delete accounts //

	app.get('/print', function(req, res) {
		AM.getAllRecords( function(e, accounts){
			res.render('print', { title : 'Account List', accts : accounts });
		})
	});

	app.post('/delete', function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
				req.session.destroy(function(e){ res.send('ok', 200); });
			}	else{
				res.send('record not found', 400);
			}
		});
	});

	app.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');	
		});
	});

	app.get('/hms/:pagedatestamp', function(req, res) {
		if (req.session.user == null){
			// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}   else{
			var accountsData=req.session;
			var pagedatestamp = req.params.pagedatestamp;
			var timeTitle=moment().calendar()+" "+moment().format("DD/MM/YYYY");
			var userID=accountsData.user.user;
			console.log("userid"+userID)
			if(moment().format("DDMMYYYY")!=pagedatestamp){
				timeTitle=moment(pagedatestamp,"DDMMYYYY").calendar()+" "+moment(pagedatestamp,"DDMMYYYY").format("DD/MM/YYYY");
			}
			AM.findAccountsByDate(pagedatestamp,userID,function(error, result) {
			//	console.log(pagedatestamp);
				if(result.length>0){
					res.render('hms', {
						title : 'HMS Panel',
						udata : req.session.user,
						today :timeTitle,
						datestamp:pagedatestamp,
						accountsData1:result,
						defaultsAccounts:accountsData.user.accounts,
						user:accountsData.user.user
					});
				}else{
			//		console.dir(accountsData.user.accounts);
					res.render('hms', {
						title : 'HMS Panel',
						udata : req.session.user,
						today :timeTitle,
						datestamp:moment().format("DDMMYYYY"),
						accountsData1:accountsData.user.accounts,
						defaultsAccounts:accountsData.user.accounts,
						user:accountsData.user.user
					});

				}
			});

		}

	});
	app.get('/hms', function(req, res) {
		if (req.session.user == null){
			// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}   else{
			res.render('hmshome', {
				title : 'HMS Panel',
				udata : req.session.user,
			});
		}

	});

	app.get('/accountdata/:datestamp', function(req, res) {
		if (req.session.user === null){
			res.redirect('/');}
		else{
			var datestamp=req.param('datestamp');
			AM.findAccountsByDate(datestamp,function(error, result) {
				res.send(console.dir(result.length));
			});
		}
	});
	app.post('/hms/:pagedatestamp', function(req, res){
		if (req.session.user == null){
			// if user is not logged-in redirect back to login page //
			//console.log
			
			setTimeout(function(){console.log('going back ');res.redirect('/');}, 9000);
			
		}else{	
			console.log("START");

			try {
				
//				var accountName= 	req.param('button');
//				var amount 	= 		req.param('amount');
//				var datestamp= 		req.param('datestamp');
//				var user= 		req.param('user');
				var defaultAccount= [];
				var accountName = req.body["button"]||req.param('button');
				var amount = req.body["amount"]||req.param('amount');
				var datestamp = req.body["datestamp"]||req.param('datestamp');
				var user = req.body["user"]||req.param('user');
				var defaultAccounts=[];
				var json=[];
				if(amount===undefined){
					console.log('amount=undefined ');
				}
				console.log("START");
				console.dir(req.params);
			/*	console.log("START");
				console.log(req.body["button"]);
				console.log(req.param('button'));
				console.log(req.body["amount"]);
				console.log(req.param('amount'));
				console.log(req.body["datestamp"]);
				console.log(req.param('datestamp'));
				console.log(req.body["user"]);
				console.log(req.param('user'));
				console.log(req.body['checkbox']);
				console.log(req.param('checkbox'));
				
				console.log(accountName);
				console.log(amount);
				console.log(datestamp);
				console.log(user);

				*/
				
				if(req.param('checkbox')) defaultAccount =  req.param('checkbox');
				if(req.body['checkbox']) defaultAccount =  req.body['checkbox'];
				defaultAccount.length=accountName.length;
				var pagedatestamp = req.params.pagedatestamp;
				//if(moment().format("DDMMYYYY")==pagedatestamp){}	
				//console.dir
				//console.dir(accountName);
				//console.dir(amount);
				console.log('accountName and accountName.length');
				console.dir(accountName);
				console.log(accountName.length);
				for(var i=0;i<accountName.length;i++)
				{
				//	console.log(accountName.length);
					if(defaultAccount[i]!==undefined){
						var defaultAccountsTemp={"name":accountName[i],"amount":0,'type':'true'};
						defaultAccounts.push(defaultAccountsTemp);
						defaultAccount[i]='true';
					}else{
						defaultAccount[i]='false';
					}
					if(amount[i]===undefined)amount[i]=0;
					
					var temp={"name":accountName[i],"amount":amount[i],"datestamp":pagedatestamp,'type':defaultAccount[i],"user":user};
					json.push(temp);
				}

				//var stringJson = JSON.stringify(json);
				//console.dir
				//console.dir(defaultAccount);
				//console.dir(json );
				AM.updateDefaultAccount (user,defaultAccounts);					
				req.session.user.accounts=defaultAccounts;
				AM.creatNewAccount (pagedatestamp,json,function(e, o){
					if (e){
						res.send('error-updating-account', 400);
					}	else{
						res.redirect('/hms');
					}
				});
			}
			catch (e) {
				//console.dir
			  console.log("entering catch block");
			  console.log(e);
			//  console.log("leaving catch block");
			}
			finally {
				console.log("END");

				//console.dir
			  //console.log("entering and leaving the finally block");
			}
		}	
	});




	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });}
