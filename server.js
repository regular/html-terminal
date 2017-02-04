// jshint esversion: 6, -W083
const sd = require('systemd-daemon');
const fs = require('fs');
const spawn = require('child_process').spawn;
const R = require('ramda');
const os = require('os');
const pty = require('node-pty');
const shoe = require('shoe');
const http = require('http');
const ecstatic = require('ecstatic')(__dirname, {
    cache: "no-cache"
});
const split = require('split');
const remoteSpawn = require('remote-spawn');

const shell = '/usr/bin/login';
const logFilePath = '/var/log/node-terminal-server.log';
 
const console = require('tracer').console({
    transport: (data) => {
        fs.appendFile(logFilePath, data.output + '\n', (err) => {
            if (err) throw err;
        });
    }
});


let server = http.createServer(ecstatic);
server.listen(9999, "127.0.0.1", ()=>{
    sd.notify('READY=1');
    console.log('ready, listening on 9999 (localhost only)');
});
 
// Create PTY socket
let sock = shoe(function (stream) {
    console.log("New PTY connection");
    let ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 25,
      cwd: process.env.HOME,
      env: process.env
    });
    ptyProcess.pipe(stream).pipe(ptyProcess, {end: false});
});
sock.install(server, '/pty');

remoteSpawn(server, (err)=> {
    if (err) {
        console.error(`Failed to initialze remote-spawn: ${err}`);
    }
});
