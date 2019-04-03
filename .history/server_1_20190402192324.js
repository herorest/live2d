var http = require('http');
var fs = require('fs');
http.createServer(function(req,res){
    //获取输入的url解析后的对象
    var pathObj = url.parse(request.url, true);
    //static文件夹的绝对路径
    var staticPath = path.resolve(__dirname, 'static')
    //获取资源文件绝对路径
    var filePath = path.join(staticPath, pathObj.pathname)
    //异步读取file
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