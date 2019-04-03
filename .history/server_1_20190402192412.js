var http = require('http');
var fs = require('fs');
http.createServer(function(req,res){
    var pathObj = url.parse(req.url, true);
    var staticPath = path.resolve(__dirname, 'static')
    var filePath = path.join(staticPath, pathObj.pathname)
    fs.readFile(filePath, 'binary', function(err, fileContent){
        if(err){
            console.log('404')
            response.writeHead(404, 'not found')
            response.end('<h1>404 Not Found</h1>')
        }else{
            console.log('ok')
            response.write(fileContent, 'binary')
            response.end()
        }
    })



    fs.readFile(__dirname + '/index.html', 'utf-8', function (err, data) {
        if(err) {
         console.error(err);
         return;
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data); 
    });
    
}).listen(8080);