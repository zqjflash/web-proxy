### 移动端调试之https代理

> 随着各大热门网站全面切换https，那么支持https代理调试已变得非常重要。

带着思考我们首先想到前端代理利器——fiddler，看看它是如何实现https代理过程

#### 首先：fiddler截获客户端浏览器发送给服务器的https请求，此时还未建立握手，接下来具体流程

* 第一步：fiddler向服务器发送请求进行握手，获取到服务器的CA证书，用根证书公钥进行解密，验证服务器数据签名，获取到服务器CA证书公钥；

* 第二步：fiddler伪造自己的CA证书，冒充服务器证书传递给客户端浏览器，客户端浏览器做跟fiddler一样的事；

* 第三步：客户端浏览器生成https通信用的对称密钥，用fiddler伪造的证书公钥加密后传递给服务器，被fiddler截获；

* 第四步：fiddler将截获的密文用自己伪造证书的私钥解开，获得https通信用的对称密钥；

* 第五步：fiddler将对称密钥用服务器证书公钥加密传递给服务器，服务器用私钥解开后建立信任，握手完成，用对称密钥加密消息，开始通信；

* 第六步：fiddler接收到服务器发送的密文，用对称密钥解开，获得服务器发送的明文，再次加密，发送给客户端浏览器。

* 第七步：客户端向服务器发送消息，用对称密钥加密，被fiddler截获后，解密获得明文。

整个过程fiddler一直拥有通信用的对称密钥，所以整个https通信过程中信息对其透明。


![img](/img/crawler.png)
































