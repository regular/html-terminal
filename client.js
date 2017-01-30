var shoe = require('shoe');
 
hterm.defaultStorage = new lib.Storage.Local();
var t = new hterm.Terminal();
t.onTerminalReady = function() {
    console.log('READY');

    // connect to websocket on the server
    var stream = shoe('/pty');
    var io = t.io.push();

    io.onVTKeystroke = function(str) {
        console.log("waa");
        console.log(str);
        stream.write(str);
    };

    io.sendString = function(str) {
        console.log(str);
        // Just like a keystroke, except str was generated by the
        // terminal itself.
        // Most likely you'll do the same this as onVTKeystroke.
    };
    t.io.print('Print a string without a newline');
    t.io.println('Print a string and add CRLF');

    stream.on('data', function (msg) {
        t.io.print(msg);
    });

};
t.decorate(document.querySelector('#terminal'));
t.installKeyboard();
