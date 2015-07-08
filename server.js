var http = require('http');
var https = require('https');

var appId='3437a998-198e-11e5-82f0-00247e00963f';
var username = 'hackathon-team-six-a';
var password='team-six-password';

var userId;
var location;
var sessionId;
var contentType;
//var address0 = 'sip:+13334441037@sandbox.demo.alcatel-lucent.com';
var address1 = 'sip:+13334441037@sandbox.demo.alcatel-lucent.com';
//var address2 = 'sip:+16307771002@sandbox.demo.alcatel-lucent.com';

var callId;

var opts = {
	hostname: 'cowlinen.ddns.net',
	port:80,
	rootPath:'http://cowlinen.ddns.net' +"/"
};

http.createServer(function (req, res) {
		receiveNotification(req,res);
}).listen(5678);

function receiveNotification(req,res){
	var templocation = req.headers['location'];
	console.log(templocation);
	var callId = req.headers['location'].split("/");
	callId = callId[callId.length-1];
	location = templocation.substring(0,25) + templocation.substring(templocation.length -82, templocation.length);
	console.log(location);
	sessionId = req.headers['x-bt-fv-session'];

	console.log("receiveNotification:"+req.path);
	console.log("receiveNotification:"+req.url);
	console.log("receiveNotification:"+req.method);
	console.log("receiveNotification:"+req.headers);
	console.log("callLegID:"+callId);


	req.on("data",function(){
		login(username, password, function(success){
		var temploc = req.headers['location'];
        if (typeof callId1 === 'undefined') {
		      callId = temploc.substring(temploc.length -36, temploc.length);
		 }
		 console.log("answerCall")
		answerCall(); 
		});
	});
}

function login(u, p, cb){
	opts.path=opts.rootPath + "login";
	opts.method="POST";
	opts.headers = {
		"X-BT-FV-API-KEY": appId,
		"Content-Length":0,
		Authorization: "Basic " + new Buffer(u + ":" + p).toString('base64')
	};
	console.log("\nATTEMPTING LOGIN for " + u +" with appid " + appId);
	http.request(opts, function(res){
		console.log("\t STATUS", res.statusCode);
		if (res.headers["x-bt-fv-userid"]){
			userId = res.headers["x-bt-fv-userid"];
			sessionId = res.headers["x-bt-fv-session"];
			//console.log("SESSION IS ", session); 
			var b = [];
			res.on("data", function(ck){
				b.push(ck.toString());
			});
			res.on("end",function(){
				cb(b.join(""));
			});
		}
		else{
			process.exit(0);
		}	
	}).end();
};

function answerCall(){
	console.log("answer call..");
	var obj = JSON.stringify({status:"CONNECTING",targetAddress:address1});
	opts.path = opts.rootPath + userId + "/callLegs/"+ callId ;
	opts.method = "PUT";
	opts.headers = {
		"X-BT-FV-SESSION": sessionId,
		'Content-Type':'application/json'
	};
	http.request(opts, function (res){
		console.log("\t STATUS", res.statusCode, res.headers);
		res.on("data", function(ck){
			var jsonReturn = JSON.parse(ck.toString());
			console.log(jsonReturn);
		});
	}).end(obj);
};