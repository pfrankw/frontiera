var argv = require('yargs').argv,
    Frontiera = require('./lib/Frontiera.js');




var frontiera = new Frontiera(argv.port || 80, argv.configdir || '/etc/frontiera');
