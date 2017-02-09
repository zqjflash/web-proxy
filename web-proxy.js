const http = require('http');
const net = require('net');
const url = require('url');
const PORT = 8899;
const IP = '0.0.0.0';

const fs = require("fs");
const path = require("path");
const LOCAL_IMAGE = "/banner.jpg";

function ruleUseLocalData(req, res) {
	// 接管banner图片请求
	let realUrl = new RegExp("http:\/\/inews\.gtimg\.com\/newsapp_match\/0\/1118284177\/0");
	if (realUrl.test(req.url)) {
		console.log('使用本地图片接管替换');
		console.log(path.dirname(__filename) + LOCAL_IMAGE);
		
		// 读取本地磁盘的图片，进行替换返回给客户端
		var content = fs.readFileSync(path.dirname(__filename) + LOCAL_IMAGE, 'binary');
		res.writeHead(200, {'Content-Type': "image/jpeg"});
		res.write(content, "binary");
		return 1;
	}
	return 0;
}

function webProxy(req, res) {
    // 接收客户端的请求报文
	let urlParams = url.parse(req.url);
	let options = {
		hostname : urlParams.hostname,
		port     : urlParams.port || 80,
		path     : urlParams.path,
		method   : req.method,
		headers  : req.headers
	};
	
	// 劫持与替换
	let useLocalStatus = ruleUseLocalData(req, res);
	// 劫持替换之后就不在进行和目标服务器通信了
	if (useLocalStatus) {
		return;
	}
    
	let proxyReq = http.request(options, function(proxyRes) {
		// 接收目标服务器的响应报文
		res.writeHead(proxyRes.statusCode, proxyRes.headers);
		// 返回目标服务器的响应报文给客户端
		proxyRes.pipe(res);
	}).on('error', function(e) {
		res.end();
	});
	// 发送客户端的请求报文到目标服务器
	req.pipe(proxyReq);
}

http.createServer().on('request', webProxy).listen(PORT, IP);