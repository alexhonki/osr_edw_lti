/*eslint no-console: 0, no-unused-vars: 0*/
"use strict";

var xsjs  = require("@sap/xsjs");
var xsenv = require("@sap/xsenv");
var port  = process.env.PORT || 3000;


var options = {
	anonymous : true, // remove to authenticate calls
	redirectUrl : "/http/odata/services.xsodata"
};

// configure HANA
try {
	options = Object.assign(options, xsenv.getServices({ hana: {tag: "hana"} }));
} catch (err) {
	console.log("[WARN]", err.message);
}

// configure UAA
try {
	options = Object.assign(options, xsenv.getServices({ uaa: {tag: "xsuaa"} }));
} catch (err) {
	console.log("[WARN]", err.message);
}

// configure job scheduler
try {
       options = Object.assign(options, xsenv.getServices({ jobs: {tag: "jobscheduler"} }));
} catch (err) {
       console.log("[WARN]", err.message);
}
// start server
xsjs(options).listen(port);

console.log("Server listening on port %d", port);
