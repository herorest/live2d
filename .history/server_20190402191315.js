var http = require('http');
var file = require('file');
http.createServer(function(req,res){
    res.writeHead(200, {'Content-Type': 'text/plain'});
    file.open();
    res.
}).listen(8080);