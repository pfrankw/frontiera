var fs = require('fs'),
    util = require('util'),
    url = require('url'),
    http = require('http'),
    crypto = require('crypto'),
    zlib = require('zlib'),
    path = require('path'),
    FrontieraCache = require('./FrontieraCache.js'),
    httpProxy = require('http-proxy');



function Frontiera(port, config_dir){
  var self = this;

  this.port = port;
  this.config_dir = config_dir;
  this.configs = [];
  this.reloadConfiguration();

  this.proxy = httpProxy.createProxyServer();
  this.proxy.on('error', function(e){console.error(e)});
  this.proxy.on('proxyRes', this.onProxyResponse.bind(this));
  this.proxy.on('proxyReq', this.onProxyRequest.bind(this));

  http.createServer(this.onRequest.bind(this)).listen(this.port);

}

Frontiera.prototype.reloadConfiguration = function reloadConfiguration(){
  var self = this;

  fs.readdir(this.config_dir, function(err, config_files){
    if(err){
      console.error("ERROR: Unable to list configuration directory");
      process.exit(1);
    }

    self.config = [];
    config_files.forEach(function(config_file){
      try {
        self.configs.push(JSON.parse(fs.readFileSync(self.config_dir+'/'+config_file)));
      } catch (e) {
        console.error("ERROR: Unable to parse configuration file", self.config_dir+'/'+config_file);
        process.exit(2);
      }
    });

    console.log("Configuration reloaded");
  });

}

Frontiera.prototype.getLogVariables = function getLogVariables(request, response, config){
    var date = new Date();
    return {
      hostname: request.headers.host,
      remoteIP: request.connection.remoteAddress.replace("::ffff:", ""),
      xforwardedfor: request.headers['x-forwarded-for'] || "-",
      method: request.method,
      path: request.url,
      statusCode: response.statusCode,
      userAgent: request.headers['user-agent'],
      year: date.getFullYear(),
      month: ("0"+date.getMonth()).slice(-2),
      day: ("0"+date.getDate()).slice(-2),
      hour: ("0"+date.getHours()).slice(-2),
      minute: ("0"+date.getMinutes()).slice(-2),
      second: ("0"+date.getSeconds()).slice(-2),
      isotime: date.toISOString()
    };
};


Frontiera.prototype.compileLogString = function compileLogString(request, response, config, logStringTemplate){

    var log_vars = this.getLogVariables(request, response, config);
    var compiled_log_string = logStringTemplate;

    for(var name in log_vars)
    {
      compiled_log_string = compiled_log_string.replace("{"+name+"}", log_vars[name]);
    }

    return compiled_log_string;

}


Frontiera.prototype.getConfigByHostname = function getConfigByHostname(hostname){

  var found_config = {};

  this.configs.every(function(config){

    if(new RegExp(config.host).test(hostname)){
      found_config = config;
      return false;
    }
    return true;
  });

  return found_config;
}

Frontiera.prototype.onRequest = function onRequest(request, response){
  var self = this;

  if(!request.headers.host || request.headers.host == ""){
      response.end();
      console.error("ERROR: No HTTP Host header present in request");
      return;
  }



  var config = this.getConfigByHostname(request.headers.host);

  if(config.cache){

    var frontieraCache = new FrontieraCache(config, null, request, response);
    if(frontieraCache.isCached()){

      frontieraCache.replyCache();
      return;
    }
  }

  if(config.target)
    self.proxy.web(request, response, {target: config.target})
  else{
    console.error("ERROR: No configuration is suitable for host:", request.headers.host);
    response.end();
  }
}


Frontiera.prototype.onProxyRequest = function onProxyRequest(proxyRequest, request, response, options){
}

Frontiera.prototype.onProxyResponse = function onProxyResponse(proxyResponse, request, response, options){
  var self = this;


  var config = this.getConfigByHostname(request.headers.host);
  if(config.cache){
    var frontieraCache = new FrontieraCache(config, proxyResponse, request, response);
    if(frontieraCache.isCachable())
      frontieraCache.cache();

  }

  if(config.log && config.log.path && config.log.format){
    var log_path = this.compileLogString(request, response, config, config.log.path);
    var log_content = this.compileLogString(request, response, config, config.log.format);
    fs.appendFile(log_path, log_content+"\n");
  }

}



module.exports = Frontiera;

