//jshint esversion: 6, -W083
const through = require('through');
const bufferEquals = require('buffer-equal');
const loner = require('loner');
const zlib = require('browserify-zlib-next'); // unmerged PR from ipfs
const base64 = require('base64-stream');
const bl = require('bl');
const throughout = require('throughout');

let beginMagic = Buffer.from('\x1b_HTMSHELL/1.0');
let endMagic = Buffer.from('\x1b\\');

function parseHeaderLines(headers) {
    let [args, ...kvs] = headers;
    args = args.split(' ');
    let ret = {args};
    for(let kv of kvs) {
        [k,v] = kv.split(/\s*:\s*/);
        ret[k.toLowerCase().trim()] = v.trim();
    }
    return ret;
}

function makeHeaderStream(cb) {
    let buffers = bl();
    let inHeaders = true;
    let separator1 = Buffer.from('\n\n');
    let separator2 = Buffer.from('\r\n\r\n');

    function write(chunk) {
        if (inHeaders) {
            if (bufferEquals(chunk, separator1) || bufferEquals(chunk, separator2)) {
                let headers = buffers.toString().split(/[\n\r]+/g);
                inHeaders = false;
                return cb(headers);
            } else {
                buffers.append(chunk);
            }
        } else {
            this.queue(chunk);
        }
    }

    function end() {
        this.queue(null);
    }
    
    return throughout(
        loner.only(1)(separator1, separator2),
        through(write, end)
    );
}

function makeDecoderStream(header) {
    let transformers = [];

    let contentTransferEncoding =
        (header['content-transfer-encoding']||'').toLowerCase() || 
        '7bit';
    if (contentTransferEncoding === 'base64') {
        transformers.push(base64.decode());
    } else {
        if (!("7bit 8bit binary".split(' ')).includes(contentTransferEncoding)) {
            throw new Error(`Unsupported content-transfer-encoding: ${contentTransferEncoding}`);
        }
    }

    let contentEncoding =
        (header['content-encoding']||'').toLowerCase() || 
        'identity';
    if (contentEncoding === 'gzip') {
        transformers.push(zlib.createGunzip());
    } else {
        if (contentEncoding!=='identity') {
            throw new Error(`Unsupported content-encoding: ${contentEncoding}`);
        }
    }
    switch(transformers.length) {
        case 0: return through();
        case 1: return transformers[0];
        case 2: return throughout(transformers[0], transformers[1]);
        default: throw new Error('Too many transformers');
    }
}

function makeAPCStream(actions) {
    let isPayload = false;
    let headerStream, decoderStream;
    return through( function(chunk) {
        let prolog = bufferEquals(chunk, beginMagic);
        let epilog = bufferEquals(chunk, endMagic);

        if (prolog && !isPayload) {
            isPayload = true;

            headerStream = makeHeaderStream( (headerLines) => {
                let header = parseHeaderLines(headerLines);
                console.log(header);
                console.log('start decoderStream');
                decoderStream = makeDecoderStream(header);
                headerStream.pipe(decoderStream);
                let action = actions[header.args[0]];
                if (action) {
                    action(decoderStream, header);
                } else {
                    console.warn(`APC action not found: ${header.args[0]}`);
                }
            });
        }
        if (!isPayload) {
            this.queue(chunk);
        } else if (!prolog && !epilog) {
            headerStream.write(chunk);
        }
        if (epilog) {
            console.log('ending decodeStream');
            isPayload = false;
            headerStream.end();
        }
    });
}

module.exports = function(actions = {}) {
    return throughout(
        loner(beginMagic, endMagic),
        makeAPCStream(actions)
    );
};

module.exports.makeHeaderStream = makeHeaderStream;
module.exports.parseHeaderLines = parseHeaderLines;
module.exports.makeDecoderStream = makeDecoderStream;
