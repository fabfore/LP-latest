var exec = require("child_process").exec;
var querystring = require("querystring");
var fs = require("fs");

function start(response,postData) {
  console.log("Request handler 'start' was called.");
	response.writeHead(200, {"Content-Type": "text/html"});
 	response.write(fs.readFileSync('./index.html', 'utf8'));
	response.end();
}

exports.start = start;