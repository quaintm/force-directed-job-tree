var http = require("http");
var fs = require('fs');
var port = 3000;
var serverUrl = "127.0.0.1";
var counter = 0;

var server = http.createServer(function(req, res) {

  
  if(req.url == "/index.html") {
    fs.readFile("index.html", function(err, text){
      res.setHeader("Content-Type", "text/html");
      res.end(text);
    });
  }

  if (req.url == "/miserables.json") {
    console.log("requesting json");
    fs.readFile('miserables.json', function(err, text) {
      res.setHeader("Content-Type", "text/json");
      res.end(text);
    });
  }

});

console.log("Starting web server at " + serverUrl + ":" + port);
server.listen(port, serverUrl);
