var http = require('http');
var fs = require('fs');
http.createServer(function(req,res){
    res.writeHead(200, {'Content-Type': 'text/plain'});
    fs.openfile('./index.html');
    res.
}).listen(8080);