//jshint esversion: 6
const BufferList = require('bl');

const beginMagic = Buffer.from('\x1b_HTMSHELL/1.0');
const endMagic = Buffer.from('\x1b\\');

function startAPC(command, headers) {
    let bl = BufferList();
    bl.append(beginMagic);
    bl.append(Buffer.from(command));
    bl.append(Buffer.from('\n'));
    for (let key in headers) {
        bl.append(Buffer.from(`${key.toLowerCase()}:${headers[key].toLowerCase()}\n`));
    }
    bl.append('\n');
    return bl.slice();
}
function endAPC() {
    return endMagic;
}

module.exports = {
    startAPC,
    endAPC,
    beginMagic,
    endMagic
};

