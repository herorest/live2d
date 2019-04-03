var http = require('http');
var fs = require('fs');
http.createServer(function(req,res){
    var html = fs.openfile('./index.html');

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(html); 
}).listen(8080);