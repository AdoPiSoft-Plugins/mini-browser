'use strict';
var { app } = require('../core')
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
    limit: '50mb',
    https: url.protocol == 'https',
    reqBodyEncoding: null,
    proxyReqOptDecorator: function(proxyReqOpts, originalReq) {
      var ref_url = {};
      if(originalReq.headers.referer){
        ref_url = new URL(originalReq.headers.referer)
        ref_url.host = url.host
        ref_url.protocol = url.protocol
        ref_url.port = url.port

        proxyReqOpts.rejectUnauthorized = false
        proxyReqOpts.headers.referer = ref_url.href
      }
      proxyReqOpts.headers.origin = ref_url.origin || url.origin
      return proxyReqOpts;
    },
    proxyErrorHandler: function(err, res, next) {
      next(err)
    }
  });
  return proxy
}

module.exports = {
  async init(){
    app.use('/exit-mini-browser', (req, res, next)=>{
      if(ip_regx.test(req.headers.host)) return next();
      proxy = null
      return res.send(`<html><head><script>document.cookie = "mini_browser=; Max-Age=0;path=/";window.location.href = "/";</script></head><body></body></html>`)
    })
    app.use('/open-mini-browser', (req, res, next)=>{
      if(ip_regx.test(req.headers.host)) return next();
      var url = req.query.url || ""
      return res.send(`<html><head><script>document.cookie = "mini_browser=true;path=/";window.location.href = "/?url=${url}";</script></head><body></body></html>`)
    })
    app.use('/', (req, res, next)=>{
      req.headers = req.headers || {}
      var is_mini_browser = (req.headers.cookie||"").match(/mini_browser\=true/ig)
      var host_url = req.query.url

      if(is_mini_browser && (host_url || proxy )){
        if(ip_regx.test(req.headers.host))
          return next();

        if(!proxy)
          proxy = setupProxy(host_url)

        if(!proxy) return next();

        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        return proxy(req, res, next)
      }else
        return next()
    });
  }
}
