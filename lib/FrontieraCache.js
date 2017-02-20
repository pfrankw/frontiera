var crypto = require('crypto'),
    path = require('path'),
    fs = require('fs'),
    zlib = require('zlib');


function FrontieraCache(config, proxyResponse, request, response){
  this.config = config;
  this.proxyResponse = proxyResponse;
  this.request = request;
  this.response = response;


  this.ext_regexp = new RegExp(config.cache.ext);

  this.cached_file_dir = this.config.cache.dir+"/"+this.request.headers.host;
  this.cached_file_path = this.cached_file_dir+"/"+crypto.createHash('md5').update(request.url).digest('hex');
  try{fs.mkdirSync(this.cached_file_dir);}catch(e){}
}

FrontieraCache.prototype.isCached = function isCached(){
  try{
    var date = new Date();
    var stat = fs.statSync(this.cached_file_path);
    var creation_time = new Date(stat.birthtime);

    if( (date.getTime()/1000) - (creation_time.getTime()/1000) > this.config.cache.time){
      console.log("Refreshing cache for", this.request.headers.host+this.request.url);
      return false;
    }
    
    if(stat.size == 0)
      return false;
    return true
  }catch(e){
    return false
  }
}

FrontieraCache.prototype.isCachable = function isCachable(){

  return this.ext_regexp.test(path.extname(this.request.url));
}


FrontieraCache.prototype.cache = function cache(){

    if(!this.proxyResponse) return;

    if(this.proxyResponse.headers['content-encoding'] && this.proxyResponse.headers['content-encoding'] == 'gzip'){
      this.proxyResponse.pipe(zlib.createGunzip()).pipe(fs.createWriteStream(this.cached_file_path));
    }
    else {
      this.proxyResponse.pipe(fs.createWriteStream(this.cached_file_path));
    }
}


FrontieraCache.prototype.replyCache = function replyCache(){
  if(this.isCached()){
    fs.createReadStream(this.cached_file_path).pipe(this.response);
  }
}

module.exports = FrontieraCache;

