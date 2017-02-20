# frontiera
**Frontiera** is a fully **asynchronous HTTP Proxy** written in Node.JS.


His main purpose is to make proxing tasks **as simple and fast** as possible. This is achieved by using JSON configuration files inside the **config.d** directory.

### Configuration file
Config files are read and parsed in an alphabetical order.
The sections are:

- domain
- target
- log.path
- log.format

##### Domain
It's a regular expression! Here basically you should describe you domain(s) so the proxy is able to catch the right requestes.

##### Target
It's the target server where to proxy the requestes that matched the previous section.

##### Log.path
It's the path of the log file. It's possible to specify some variables such as **{hostname}** or **{day}**, **{month}**, **{year}**, etc ...

##### Log.format
It's the format of every line of the log. It's parsed like the previous section, so you can put variables like {remoteIP}, {userAgent}, {method}, etc ...


### Log variables
Here comes some other flexibility.
Log.path and log.format are parsed at run time.
For example, you can create a log file with these properties:
- log.path: "/var/log/frontiera/{hostname}.{year}-{month}-{day}.log"
- log.format: "{isotime} {xforwardedfor} {remoteIP} {method} {path} {statusCode} \"{userAgent}\" {hostname}"

The **available variables** are:
- hostname
- remoteIP
- xforwardedfor
- method
- path
- statusCode
- userAgent
- year
- month
- day
- hour
- minute
- second
- isotime

### Command line options
- port
- configdir

### Dependencies
Frontiera relies on 
- [Nodejitsu's HTTP Proxy](https://github.com/nodejitsu/node-http-proxy)
- [Yargs] (https://github.com/bcoe/yargs)


### TODO
- Proxying of WS requests
- Write a better README.md

### Known Issues
No known problems (still), but feel free to open issues and don't hesitate to ask for help.

[Twitter](https://twitter.com/pfrankw)
