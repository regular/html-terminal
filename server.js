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

const parseConfig = require('./parse-config');

const shell = '/usr/bin/login';
const logFilePath = '/var/log/node-terminal-server.log';
 
const console = require('tracer').console({
    transport: (data) => {
        fs.appendFile(logFilePath, data.output + '\n', (err) => {
            if (err) throw err;
        });
    }
});

console.log('Parsing config');
parseConfig( (err, config) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

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

    // Create sockets for additional endpoints 
    const createSocket = (mappings)=> {
        let url = `/${mappings[0].endpoint}`;
        console.log(`Installing socket server at ${url}`);
        let sock = shoe(function (stream) {
            console.log(`New connection to ${url}`);
            stream.pipe(split()).on('data', (line)=>{
                console.log('received',line);    
                for(let {re, cli} of mappings) {
                    let m = line.match(re);
                    if (m) {
                        console.log(`Matching ${re}`);
                        console.log(m);
                        console.log(`Running ${cli}`);
                        let command = spawn(cli, {
                            cwd: process.env.HOME,
                            env: process.env,
                            uid: 1000,  // TODO
                            gid: 1000,
                            shell: true
                        });
                        command.stdout.pipe(split()).on('data', (line)=>{
                            console.log('stdout', line);
                            stream.write(line + '\n');
                        });
                        command.on('close', (code)=>{
                            console.log(`${cli} ended with code ${code}`);
                        });
                    }
                }
            });
        });
        sock.install(server, url);
    };

    let createSockets = R.forEach(createSocket);

    createSockets(R.values(config));
});
