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

var announcedtmf = false;

var callIdToUser;
var callIdOfCaller;


var bridgeIdOut;

var callbackCall = false;


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
	//console.log(req.method, req.url);
	callId = getCallIdFromLocation(req.headers['location']);
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
		console.log('Status = %s',b['status']);
		if((b['status'] == 'INITIAL') && (!callbackCall)){
			console.log("Calling notification");
			callIdOfCaller = callId;
			setTimeout(collectDTMF,5000,1,1,300,5);

			newCallLeg(callLocation,b);


		} else {
			console.log("NOT CALLING");
			console.log('----------------------------------------------');
		}
		
	})
}


// function answerCall(location,call){
// 	var obj = JSON.stringify({status:"CONNECTING"});
// 	opts.path = location;//opts.rootPath + userId + "/callLegs/"+ callId ;
// 	opts.method = "PUT";
// 	//console.log("answer call..", location,"-opts-", opts,"-call-", call);
// 	http.request(opts, function (res){
// 		console.log("\t STATUS", res.statusCode, res.headers);
// 		res.on("data", function(ck){
// 			var jsonReturn = JSON.parse(ck.toString());
// 			console.log(jsonReturn);
// 		});
// 	}).end(obj);
// 	console.log('---------*-------------*-------------+-----------');
// };


var source = 'sip:+13334441039@sandbox.demo.alcatel-lucent.com';
var destination = 'sip:+13334441039@sandbox.demo.alcatel-lucent.com';
var announcementText = 'Hi there';

function newCallLeg(callLocation,call){
	console.log("callLocation = %s",callLocation);
	//var obj = JSON.stringify({sourceAddress:source, targetAddress: destination, bridgeId: bridgeId,announcement:{text:announcementText}});
	var obj = JSON.stringify({sourceAddress:source, targetAddress: destination, announcement:{text:announcementText}});
	console.log(JSON.stringify(obj));
	opts.path = "/" + userId + "/callLegs";//opts.rootPath + userId + "/callLegs/"+ callId ;
	opts.method = "POST";
	//console.log("answer call..", location,"-opts-", opts,"-call-", call);
	opts.headers = {
		"X-BT-FV-SESSION": sessionId,
		'Content-Type':'application/json'
	};
	http.request(opts, function (res){
		console.log("\t STATUS", res.statusCode, res.headers);
		var location = res.headers['location'];
		console.log("location = %s",location);
        if (typeof callIdToUser === 'undefined')
		      callIdToUser = getCallIdFromLocation(location);
		var b = [];
		res.on("data", function(ck){
			var jsonReturn = JSON.parse(ck.toString());
            if (typeof bridgeIdOut === 'undefined')
			     bridgeIdOut = jsonReturn.bridgeId;
			b.push(ck.toString());
		});
		res.on("end",function(){
			var call = b.join("");
			if(res.statusCode == 201){
				if(callbackCall){
					announce("Press 1 to blacklist the last number, or press 2 to add it to the white list",callIdToUser);
					monitorOptionsLeg(callIdToUser);
					callbackCall = false;	
				} else {
					monitorLeg(callIdToUser);
			}
			}
		});
	}).end(obj);
	console.log('---------*-------------*-------------+-----------');
};

var runBounceCallCheck = false;

function monitorLeg(leg){
	opts.path='/' + userId+"/callLegs/"+leg;
	opts.method="GET";
	opts.headers = {
		"X-BT-FV-SESSION": sessionId
	};
	http.request(opts, function(res){
		var b = [];
		res.on("data", function(ck){
			b.push(ck.toString());
			var jsonReturn =  JSON.parse(ck.toString());
			console.log(jsonReturn.dtmf);
			 if(!announcedtmf && jsonReturn.dtmf.length > 0 ){

			console.log("recive dtmf");
			announcedtmf = true;

			runBouncerCall();

			}		
		});
		res.on("end",function(){
			var result = b.join("");
			console.log("\nLEG " + leg + " " +res.statusCode + " " + result);
			if (res.statusCode === 200){
				setTimeout(function(){
					monitorLeg(leg)
				},3000);
			}
		});
	}).end();
};

function runBouncerCall(){
			console.log("killing leg %s", callIdOfCaller);
			endCall(callIdOfCaller);

			console.log("killing leg %s", callIdToUser);
			endCall(callIdToUser);

			//start new call
			callbackCall = true;


			setTimeout(collectDTMF,5000,1,1,300,5);

			newCallLeg();
}


function monitorOptionsLeg(leg){
	opts.path='/' + userId+"/callLegs/"+leg;
	opts.method="GET";
	opts.headers = {
		"X-BT-FV-SESSION": sessionId
	};
	http.request(opts, function(res){
		var b = [];
		res.on("data", function(ck){
			b.push(ck.toString());
			var jsonReturn =  JSON.parse(ck.toString());
			console.log(jsonReturn.dtmf);
			 if(!announcedtmf && jsonReturn.dtmf.length > 0 ){

			 	console.log("recive dtmf");
			announcedtmf = true;

				//announce("Press 1 to blacklist the last number, or press 2 to add it to the white list");

			 	var selectedvalue = jsonReturn.dtmf[0].digits;
			 	if( selectedvalue == 1) {
			 		announce(" The last caller has been added to your black list",callIdToUser);
			 		console.log("option 1 selected, added to blacklist");
			 	} else if(selectedvalue == 2) {
			 		announce(" The last caller has been added to your white list",callIdToUser);
			 		console.log("option 2 seleted, added to white list");
			 	}
			// 		console.log(jsonReturn.bridgeId);
			// 		setTimeout(outBoundCallA,1000,address20,"Dad");
			// 	}else if(selectedvalue == 4){
			// 		endCall();
			// 	}else if(selectedvalue == 5){
			// 			announce("turning on lights");
			// 			mqttClient.publish("milight-control", "192.168.4.172 1 on");

			

			console.log("killing leg %s", callIdToUser);
			endCall(callIdToUser);

			}		
		});
		res.on("end",function(){
			var result = b.join("");
			console.log("\nLEG " + leg + " " +res.statusCode + " " + result);
			if (res.statusCode === 200){
				setTimeout(function(){
					monitorLeg(leg)
				},3000);
			}
		});
	}).end();
};

function endCall(callToTerminate){
	var status = "TERMINATED";
	var obj = JSON.stringify({status:status});
	opts.path = "/" + userId + "/callLegs/" + callToTerminate;
	opts.method = "PUT";
	opts.headers = {
		"X-BT-FV-SESSION": sessionId,
		'Content-Type':'application/json'
	};
	http.request(opts, function(res){
		console.log("\t STATUS", res.statusCode, res.headers);
	}).end(obj);
};

function collectDTMF(minDigits, maxDigits, timeout, maxInterval){
	console.log("collect dtmf");
	var dtmf = {name:"Ou lala", flush: "false",stopTones:"#", minDigits: minDigits, maxDigits: maxDigits, timeout: timeout, maxInterval: maxInterval};

	var obj = JSON.stringify({dtmf: dtmf,announcement:{text:"testing text to prove something"}});
	opts.path = '/' + userId+"/callLegs/"+callIdToUser;
	opts.method="PUT";
	opts.headers = {
		"X-BT-FV-SESSION": sessionId,
		'Content-Type':'application/json'
	};
	http.request(opts, function(res){
		console.log("\t STATUS", res.statusCode, res.headers);
				var b = [];
		res.on("data", function(ck){
			b.push(ck.toString());
		});
		res.on("end",function(){
			var call = b.join("");
			if (res.statusCode === 201){
				monitorLeg(JSON.parse(call));
			}
		});
	}).end(obj);
};

function announce(announcevalue, callIdtoAnnounce){
	var obj = JSON.stringify({announcement:{text:announcevalue}});
	opts.path = "/" + userId + "/callLegs/" + callIdtoAnnounce;
	console.log(opts.path);
	opts.method = "PUT";
	opts.headers = {
		"X-BT-FV-SESSION": sessionId,
		'Content-Type':'application/json'
	};
	http.request(opts, function(res){
		console.log("\t STATUS", res.statusCode, res.headers);
	}).end(obj);
};
