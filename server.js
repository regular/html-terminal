// jshint esversion: 6, -W083
const sd = require('systemd-daemon');
const fs = require('fs');
const spawn = require('child_process').spawn;
const R = require('ramda');
const os = require('os');
const pty = require('node-pty');
const shoe = require('shoe-bin');
const multiplex = require('multiplex');
const http = require('http');
const dnode = require('dnode');
const ecstatic = require('ecstatic')(__dirname, {
    cache: "no-cache"
});
const split = require('split');

//const domfs = require('domfs/lib/server');
//const remoteSpawn = require('remote-spawn');

//const shell = '/usr/bin/login';
const shell = '/usr/local/bin/zsh';
const logFilePath = '/var/log/node-terminal-server.log';
 
/*
const console = require('tracer').console({
    transport: (data) => {
        fs.appendFile(logFilePath, data.output + '\n', (err) => {
            if (err) throw err;
        });
    }
});
*/

let server = http.createServer(ecstatic);
server.listen(9999/*, "127.0.0.1"*/, ()=>{
    sd.notify('READY=1');
    console.log('ready, listening on 9999 (localhost only)');
});
 
// Create Web socket
let sock = shoe(function (sockStream) {
    console.log("New websocket connection");

    let plex = multiplex();

    let ptyStream = plex.createSharedStream('pty');
    ptyStream.write(Buffer.from('Hello client'));
    let ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 25,
      cwd: process.env.HOME,
      env: process.env
    });
    ptyProcess.pipe(ptyStream).pipe(ptyProcess, {end: false});

    let ctlStream = plex.createSharedStream('ctl');
    let rpc = dnode({
        resizePTY: function(cols, rows) {
            console.log('server resize', cols, rows);
            ptyProcess.resize(cols, rows);
        }
    });
    rpc.pipe(ctlStream).pipe(rpc);

    sockStream.pipe(plex).pipe(sockStream);
});

sock.install(server, '/pty');

// Create control socket for receiving  resize notifications

/*
remoteSpawn(server, (err)=> {
    if (err) {
        console.error(`Failed to initialze remote-spawn: ${err}`);
    }
});
*/
//domfs(server, process.env.DOMFS_MOUNTPOINT || './mnt');

