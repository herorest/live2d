var http = requier('http');
http.createServer(function(req,res){
    res.writeHead(200, {'Content-Type': 'text/plain'});
    
}).listen(8080);