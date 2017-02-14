// jshint esversion: 6, -W083
const sd = require('systemd-daemon');
const fs = require('fs');
const spawn = require('child_process').spawn;
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
const proxy = require('htmshell-proxy/server');

const args = require('minimist')(process.argv.slice(1), {
    default: {
        domfs: false,
        domfsmountpoint: './mnt',
        remotespawn: false,
        logfile: false,
        shell: '/usr/bin/login',
        port: 9999,
        bind: '127.0.0.1'
     }
});
//console.dir(args);

if (args.logfile) {
    console = require('tracer').console({
        transport: (data) => {
            fs.appendFile(args.loglile, data.output + '\n', (err) => {
                if (err) throw err;
            });
        }
    });
}

let server = http.createServer(ecstatic);
server.listen(args.port, args.bind, ()=>{
    sd.notify('READY=1');
    console.log(`HTTP server listening on ${args.bind} port ${args.port}`);
});
 
// Create pty Web socket
let sock = shoe(function (sockStream) {
    console.log("New websocket connection");

    let plex = multiplex();

    let ptyStream = plex.createSharedStream('pty');
    ptyStream.write(Buffer.from('Hello client'));
    let ptyProcess = pty.spawn(args.shell, [], {
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

proxy(server, {tcpAddress: args.bind});

if (args.remotespawn) {
    const remoteSpawn = require('remote-spawn');
    remoteSpawn(server, (err)=> {
        if (err) {
            console.error(`Failed to initialze remote-spawn: ${err}`);
        }
    });
}

if (args.domfs) {
    const domfs = require('domfs/lib/server');
    domfs(server, args.domfsmountpoint || process.env.DOMFS_MOUNTPOINT || './mnt');
}

