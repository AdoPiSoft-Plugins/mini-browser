'use strict';
var { router, middlewares } = require('../core')
var httpProxy = require('express-http-proxy')
var ip_regx = /(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}/
var proxy

function setupProxy(url_str){
  if(!url_str.match(/^http/ig)) url_str = "http://"+url_str;
  var url;
  try{
    url = new URL(url_str)
  }catch(e){}
  if(!url) return
  proxy = httpProxy(url.host, {
    https: !!url.protocol.match(/https/i),
    reqBodyEncoding: null,
    proxyReqOptDecorator: function(proxyReqOpts, originalReq) {
      var ref_url = {};
      if(originalReq.headers.referer){
        ref_url = new URL(originalReq.headers.referer)
        ref_url.host = url.host
        ref_url.protocol = url.protocol
        ref_url.port = ''
        if(url.port != '80')
          ref_url.port = url.port

        proxyReqOpts.rejectUnauthorized = false
        proxyReqOpts.headers.referer = ref_url.href
      }
      proxyReqOpts.headers.origin = ref_url.origin || url.origin
      return proxyReqOpts;
    },
    userResHeaderDecorator: function(headers, userReq, userRes, proxyReq, proxyRes){
      userRes.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      userRes.setHeader('Expires', '-1');
      userRes.setHeader('Pragma', 'no-cache');
      userRes.setHeader('x-frame-options', '');
      headers["x-frame-options"] = ""
      if(headers.location){
        var loc = new URL(headers.location)
        if(loc.protocol != url.protocol){
          proxy = setupProxy(loc.toString())
        }

        loc.host = userReq.headers.host
        loc.protocol = "http"
        headers.location = loc.toString()
      }
      return headers
    },
    userResDecorator: function(proxyRes, proxyResData, userReq, userRes){
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
      return proxyResData
    },
    proxyErrorHandler: function(err, res, next) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
      res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, user-scalable=no">
          <title>Something went wrong!</title>
        </head>
        <body style="padding:50px;line-height:30px;background: #eee;">
          <center><h1>Ooops!&nbsp;&nbsp;</h1>
          <h2>Something went wrong.</h2>
          <h2>The local url you want to access is probably inaccessable by your machine.</h2>
          <h2>Or prabably just a browser issue, please try other browsers.</h2>
          <a href="/exit-mini-browser">Exit Mini Browser Session</a>
          </center>
        </body>
      </html>
    `)
    }
  });
  return proxy
}

router.get('/exit-mini-browser', (req, res, next)=>{
  req.headers = req.headers || {}
  var is_mini_browser = (req.headers.cookie||"").match(/mini_browser\=true/ig)
  if(!is_mini_browser)
    return next();

  proxy = null
  return res.send(`<html><head><script>document.cookie = "mini_browser=; Max-Age=0;path=/";window.location.href = "/";</script></head><body></body></html>`)
})
router.get('/open-mini-browser', (req, res, next)=>{
  // if(ip_regx.test(req.headers.host)) return next();
  var url = req.query.url || ""
  return res.send(`<html><head><script>document.cookie = "mini_browser=true;path=/";window.location.href = "/?url=${url}";</script></head><body></body></html>`)
})

router.use((req, res, next)=>{
  try{
    req.headers = req.headers || {}
    var is_mini_browser = (req.headers.cookie||"").match(/mini_browser\=true/ig)
    if(!is_mini_browser)
      return next();
  
    if(!proxy){
      var host_url = req.query.url
      if(!host_url && req.headers.referer){
        var matches = req.headers.referer.match(/\?url\=(.*)/) || []
        host_url = matches[1]
      }
  
      if(host_url) proxy = setupProxy(host_url);
    }
  
    if(!proxy)
      return next();

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
    return proxy(req, res, next)
  }catch(e){
    next()
  }
});

module.exports = router
