var http = require('http');
var program = require('commander');

// configuration settings
var appId='3437a998-198e-11e5-82f0-00247e00963f';
var username = 'hackathon-team-six-a';
var password='team-six-password';
var session = false;
var userId = false;
var source = 'tel:+16307771000';

var bridgeId;

var bridgeIdOut;

var addressTel = 'tel:+13334441037'
var serverPort = '5678'

var address0 = 'sip:+16307771000@sandbox.demo.alcatel-lucent.com';
var address1 = 'sip:+16307771001@sandbox.demo.alcatel-lucent.com';
var address2 = 'sip:+16307771002@sandbox.demo.alcatel-lucent.com';
var address3 = 'sip:+16307771003@sandbox.demo.alcatel-lucent.com';
var address4 = 'sip:+16307771004@sandbox.demo.alcatel-lucent.com';
var address5 = 'sip:+16307771005@sandbox.demo.alcatel-lucent.com';

var willNotifyURL = 'http://192.168.4.163:8080';

// export.address0 = address0;
// export.address1 = address1;
// export.address2 = address2;

var opts = {
	hostname: 'cowlinen.ddns.net',
	port:80,
	rootPath:'http://cowlinen.ddns.net' +"/"
};

var addresses = {0:[address0],1:[address1],2:[address2],3:[address3],4:[address4],5:[address5]};

var userId;
var session;
var callId1,callId2;
var hasDtmfCalled = false;

program
	.version('0.0.1')
	.option('-o, --outboundarray [value]','-o time -o destination -o text -o addressBridgeId (can optionally connect another bridgeID of an outbound call )',collect,[]) 
	.option('-a, --announcearray [value]', '-a time -a text (announces to the current outbound call, if multiple then firest outbound call)	', collect, []) 
  	.option('-d, --dtmf [time]', '-d time (collects digits direclty from current outbound call, if multiple then first outbound call)') 
  	.option('-p, --tpcarray [value]','-p time -p targetA -p targetB -p text',collect,[]) 
  	.option('-e, --endcall [time]', '-e timeout to end the first outbound call')
  	.option('-t, --transfer [time]','-t timeout ( transfer the call between established third party call and single outbound call )') // 
	.option('-b, --outbridge [time]', '-b create outbound call to 2 with a current outbound bridge id')
	.option('-r, --record [value]','-r timeout -r text -r flushtones -r stopTones -r duration ', collect, [])
	.option('-s, --setnotifyurl','-s Set notify url of device 001 to http://cowlinen.ddns.net:8080/zeeshan')
	.parse(process.argv);

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
			session = res.headers["x-bt-fv-session"];
			console.log("SESSION IS ", session); 
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

function monitorLeg(leg){
	opts.path=opts.rootPath + userId+"/callLegs/"+leg;
	opts.method="GET";
	opts.headers = {
		"X-BT-FV-SESSION": session
	};
	http.request(opts, function(res){
		var b = [];
		res.on("data", function(ck){
			b.push(ck.toString());
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

function monitorCall(call){
	bridgeId = call.bridgeId;
	if(program.transfer){
		setTimeout(transferLeg,program.transfer,bridgeId);
	}
	var leg1 = call.callLegs[0];
	var leg2 = call.callLegs[1];
	// monitorLeg(leg1);
	// monitorLeg(leg2);
};

function outBoundCall(destination,announcementText,bridgeId){
	var obj = JSON.stringify({sourceAddress:source, targetAddress: destination, bridgeId: bridgeId,announcement:{text:announcementText}});
	opts.path = opts.rootPath + userId + "/callLegs";
	opts.method = "POST";
	opts.headers = {
		"X-BT-FV-SESSION": session,
		'Content-Type':'application/json'
	};
	http.request(opts, function (res){
		console.log("\t STATUS", res.statusCode, res.headers);
		var location = res.headers['location'];
        if (typeof callId1 === 'undefined')
		      callId1 = location.substring(location.length -36, location.length);
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
			 monitorLeg(callId1);
			}
		});
	}).end(obj);
};

function endCall(){
	var status = "TERMINATED";
	var obj = JSON.stringify({status:status});
	opts.path = opts.rootPath + userId + "/callLegs/" + callId1;
	opts.method = "PUT";
	opts.headers = {
		"X-BT-FV-SESSION": session,
		'Content-Type':'application/json'
	};
	http.request(opts, function(res){
		console.log("\t STATUS", res.statusCode, res.headers);
	}).end(obj);
};

function announce(announcevalue){
	var obj = JSON.stringify({announcement:{text:announcevalue}});
	opts.path = opts.rootPath + userId + "/callLegs/" + callId1;
	console.log(opts.path);
	opts.method = "PUT";
	opts.headers = {
		"X-BT-FV-SESSION": session,
		'Content-Type':'application/json'
	};
	http.request(opts, function(res){
		console.log("\t STATUS", res.statusCode, res.headers);
	}).end(obj);
};

function collect(val, memo) {
  memo.push(val);
  return memo;
}

function thirdPartyCall(addressA, addressB,announcetext){
	var obj = JSON.stringify({sourceAddress:source, targetAddresses: [addressA,addressB], announcement:{text:announcetext}});
	opts.path=opts.rootPath + userId+"/services/thirdPartyCall";
	opts.method="POST";
	opts.headers = {
		"X-BT-FV-SESSION": session,
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
				monitorCall(JSON.parse(call));
			}
		});
	}).end(obj);
};

function collectDTMF(minDigits, maxDigits, timeout, maxInterval){
	var dtmf = {name:"Ou lala", flush: "false",stopTones:"#", minDigits: minDigits, maxDigits: maxDigits, timeout: timeout, maxInterval: maxInterval};

	var obj = JSON.stringify({announcement:{text:'Zeeshan is better'}, dtmf: dtmf});
	opts.path = opts.rootPath + userId+"/callLegs/"+callId1;
	opts.method="PUT";
	opts.headers = {
		"X-BT-FV-SESSION": session,
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
				monitorCall(JSON.parse(call));
			}
		});
	}).end(obj);
};

function transferLeg(bridgeId){
	console.log(".. transferring callLeg:" + callId1 + " to the bridge "+ bridgeId)
	var obj = JSON.stringify({bridgeId:bridgeId});
	opts.path = opts.rootPath + userId + "/callLegs/" + callId1;
	opts.method = "PUT";
	opts.headers = {
		"X-BT-FV-SESSION": session,
		'Content-Type':'application/json'
	};
	http.request(opts, function(res){
		console.log("\t STATUS", res.statusCode, res.headers);
		res.on("end", function(){
			if(res.statusCode == 200){
				console.log("attemnpt successful");
				// announce(leg2," call leg transfer successful");
			}
		});
	}).end(obj);
}

function playRecord(announcetext, flushTones, stopTones, duration){
	var record = {flushTones:flushTones, stopTones: stopTones ,duration:duration};
	var obj = JSON.stringify({announcement:{text:announcetext}, record: record});
	opts.path = opts.rootPath + userId+"/callLegs/"+callId1;
	opts.method="PUT";
	opts.headers = {
		"X-BT-FV-SESSION": session,
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
				monitorCall(JSON.parse(call));
			}
		});
	}).end(obj);
}


// set notify url for device 0000 to http://cowlinen.ddns.net:8080/zeeshan
function registerNotifyURL(){

	console.log("Setting notify url of device 000 to local server");


var os = require('os');
var ifaces = os.networkInterfaces();
Object.keys(ifaces).forEach(function (ifname) { 
   	var alias = 0;
 	ifaces[ifname].forEach(function (iface) {     if ('IPv4' !== iface.family || iface.internal !== false) {return;
 }     
 if (alias == 0) {ip = iface.address;}   
	}); });
 console.info("Server IP is " + ip);


	var obj = JSON.stringify({notifyUrl:'http://'+ip+':'+serverPort+'/events'});
	opts.path = opts.rootPath + userId + "/devices/" + addressTel;
	opts.method = "PUT";
	opts.headers = {
		"X-BT-FV-SESSION": session,
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
				monitorCall(JSON.parse(call));
			}
		});
	}).end(obj); 
}

login(username, password, function(success){
	if(program.setnotifyurl){
		console.log("in setting notify url");
		registerNotifyURL();
	}

	if(program.outboundarray[0]){
		var timeout = program.outboundarray[0];
		var destination = addresses[program.outboundarray[1]][0];
		var text = program.outboundarray[2];
		var bridgecode;
		setTimeout(outBoundCall,timeout,destination,text,bridgecode);
	}
	if(program.announcearray[0]){
		setTimeout(announce,program.announcearray[0],program.announcearray[1]);
	}
	if(program.endcall){
		setTimeout(endCall,program.endcall);
	}
	if(program.dtmf){
		setTimeout(collectDTMF,program.dtmf,4,4,30,2);
	}
	if(program.tpcarray[0]){
		var targetA = addresses[program.tpcarray[1]][0];
		var targetB = addresses[program.tpcarray[2]][0];
		setTimeout(thirdPartyCall,program.tpcarray[0],targetA,targetB,program.tpcarray[3]);
	}
	if(program.outbridge){
        var text = "conecting outbound to bridge";
        setTimeout(function() {
            outBoundCall(address4,text,bridgeIdOut);
        }, 10000);
	}
	if(program.record[0]){
		setTimeout(playRecord,program.record[0],program.record[1],program.record[2],program.record[3],program.record[4]);
	}
});