var http = require('http');
var https = require('https');

var appId='6d0276a4-20a0-11e5-b6f3-00247e00963f';
var username = 'hackathon-team-six-a';
var password='team-six-password';

var userId = "6d0276a4-20a0-11e5-b6f3-00247e00963f";

var sessionId="ef24e478db6a0084ccd975bd1b962a820826e61833324036d0dacfefd47dd4b16346c53cf3263c181d72ca28d036434ca903866008438039e225b5e71ec95cd75530fb9b086ae90366462eeaebb90fef44c87451796481fd208735e7b4f9219e05a1d91a8064de36b904363b84deb53bae6cc952efcb16ceeb2c9e2d0e781eb5";
//var address0 = 'sip:+13334441037@sandbox.demo.alcatel-lucent.com';
var address1 =	 'sip:+13334441039@sandbox.demo.alcatel-lucent.com';
//var address2 = 'sip:+16307771002@sandbox.demo.alcatel-lucent.com';

var callId;

var opts = {
	hostname: 'cowlinen.ddns.net',
	port:80,
	headers : {
		"X-BT-FV-SESSION": sessionId,
		'Content-Type':'application/json'
	}
};

http.createServer(function (req, res) {
		receiveNotification(req,res);
}).listen(5678);
var getCallIdFromLocation =function(location){
	var x = location.split("/");
	return x[x.length-1];
}

function receiveNotification(req,res){
	console.log(req.method, req.url);
	var callId = getCallIdFromLocation(req.headers['location']);
	var callLocation = ["",userId,"calllegs",callId].join("/");
	console.log("CALL LOCATION IS", callLocation);
	var b =[];
	req.on("data", function(ck){
		b.push(ck.toString());
	})
	req.on("end", function(){
		b = JSON.parse(b.join(""));
		res.status = 200;
		res.end();
		if(req.headers['status'] = 'INITIAL'){
			console.log("Calling notification");
			answerCall(callLocation,b);
		}
		
	})
}


function answerCall(location,call){
	var obj = JSON.stringify({status:"CONNECTING"});
	opts.path = location;//opts.rootPath + userId + "/callLegs/"+ callId ;
	opts.method = "PUT";
	console.log("IM HERE");
	console.log("answer call..", location,"-opts-", opts,"-call-", call);
	http.request(opts, function (res){
		console.log("\t STATUS", res.statusCode, res.headers);
		res.on("data", function(ck){
			var jsonReturn = JSON.parse(ck.toString());
			console.log(jsonReturn);
		});
	}).end(obj);
};