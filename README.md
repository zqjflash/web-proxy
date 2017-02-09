### 移动端调试之网络代理

> 当我们调试前端代码的时候，经常需要快速修复代码并进行线上验证，如何在本地开发调试代码实时到线上真机同步就变得非常有用，目前常见的网页流量嗅探主要两类：浏览器类（如：chrome devtools）和第三方工具（如：Fiddler）

#### 问题思考：浏览器或第三方工具究竟是如何流量嗅探？如何接管替换指定文件？

带着问题，我们开始进行详细分析：

#### 一、流量嗅探

##### 1.1 常见的流量嗅探请求主要包含有如下数据：

* 请求类型（GET、POST等）
* 请求资源是什么（js、css、图片等）
* 请求的URI
* 状态
* 大小
* 完成请求耗时
* ...

##### 1.2 嗅探与代理的关系

以浏览器访问一个http协议的网页来进行推理分析：

* 分析1：能够正确完整的接收浏览器发出来的请求并给出正确的响应结果；

* 分析2：能够有一个界面来呈现嗅探到的所有网络请求列表。

从分析流程1中看到，要做到能够嗅探网络流量，需要有一个服务来做代理，这个服务既做服务端又做客户端，来负责在浏览器与真实服务器之间来回传送HTTP报文。在HTTP代理中可以找到对应的一种形式--普通代理

在《HTTP权威指南》第六章节web的中间实体-137页有对应的图片

![img](/img/web_proxy.png)

了解普通代理的基本原理后，构造一个demo案例跑一下流程：

###### 1) 使用nodejs实现一个代理

```javascript

	const http = require('http');
	const net = require('net');
	const url = require('url');
	const PORT = 8899;
	const IP = '0.0.0.0';
	
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

```

###### 2) 浏览器显示指定代理

常用显示代理配置有两种方式：

* 安装代理插件手动修改浏览器

* 或者指定PAC文件自动设置

本文采用安装代理插件的形式演示，使用PC Chrome SwitchySharp插件，下图是SwitchySharp插件配置

![img](/img/SwitchySharp.png)

###### 3) 浏览器(客户端)访问URL正确性

* 浏览器（客户端）访问http://xw.qq.com/news/20170209003500/NEW2017020900350003

* 代理node服务查看所有资源path

示例图如下：

![img](/img/page_to_source.png)


#### 二、劫持替换

对比几个国内star数较多的几个类fiddler代理（anyproxy、LivePool、whistle）框架，基本都采用字符串匹配加正则匹配的方式。本次体验demo使用正则方式来演示：

```javascript

	function ruleUseLocalData(req, res) {
		// 劫持banner图片请求
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

```

通过浏览器访问页面，劫持前后对比效果如图：

![img](/img/hijack.png)


#### 三、参考资料

* [anyproxy](https://github.com/alibaba/anyproxy)
* [livepool](https://github.com/rehorn/livepool)
* [whistle](https://github.com/avwo/whistle)
* [阮一峰-http模块](http://javascript.ruanyifeng.com/nodejs/http.html)





































