var http = require('http');
var fs = require('fs');
http.createServer(function(req,res){
    fs.readFile(__dirname + '/index.html', {flag: 'r+', encoding: 'utf8'}, function (err, data) {
        if(err) {
         console.error(err);
         return;
        }
        console.log(data);
    });
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(html); 
}).listen(8080);