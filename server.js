// jshint: esversion 6
var os = require('os');
var pty = require('node-pty');
var shoe = require('shoe');
var http = require('http');
 
var shell = 'bash';
 
var ecstatic = require('ecstatic')(__dirname);
 
var server = http.createServer(ecstatic);
server.listen(9999);
 
var sock = shoe(function (stream) {
    console.log("something is happening");
    var ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 160,
      rows: 50,
      cwd: process.env.HOME,
      env: process.env
    });
     
    ptyProcess.pipe(stream).pipe(ptyProcess, {end: false});
    //stream.pipe(process.stdout, {end: false});
    //process.stdin.pipe(stream);
});

sock.install(server, '/pty');
