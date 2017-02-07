//jshint esversion: 6, -W083
const through = require('through');
const bufferEquals = require('buffer-equal');
const replace = require('binary-stream-replace');
const zlib = require('browserify-zlib-next'); // unmerged PR from ipfs
const base64 = require('base64-stream');
const bl = require('bl');
const throughout = require('throughout');

let beginMagic = Buffer.from('\x1b_HTMSHELL/1.0');
let endMagic = Buffer.from('\n\x1b\\');

function makeHeaderStream(cb) {
    let buffers = bl();
    let inHeaders = true;
    let separator1 = Buffer.from('\n\n'); //TODO: use max occurances =1
    let separator2 = Buffer.from('\r\n\r\n');

    return throughout(
        throughout(
            replace(separator1, separator1),
            replace(separator2, separator2)
        ), 
        through(write)
    );

    function write(chunk) {
        console.log('header chunk', chunk);

        if (inHeaders) {
            if (bufferEquals(chunk, separator1) || bufferEquals(chunk, separator2)) {
                console.log('found header separator');
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
    return ret;
}

function makeDecoderStream(headers) {
    return through();
}

function getActionFromHeaders(headers, actions) {
    return action[headers[0]];
}

function makeAPCStream(actions) {
    let isPayload = false;
    let headerStream, decoderStream;
    return through( function(chunk) {
        let prolog = bufferEquals(chunk, beginMagic);
        let epilog = bufferEquals(chunk, endMagic);

        if (prolog && !isPayload) {
            isPayload = true;

            headerStream = makeHeaderStream( (headers) => {
                decoderStream = makeDecoderStream(headers);
                headerStream.pipe(deocderStream);
                let action = getActionFromHeader(headers, actions);
                if (action) action(decoderStream, headers);
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

module.exports = function(stream, actions) {
    return stream.pipe(through(function(chunk) {
        // Turn string into Buffer
        // TODO: Is it a problem that the wecsocket
        // is not binary-safe?
        this.queue(Buffer.from(chunk));
    })).pipe(
        // this seems pointless, but it isn't.
        // the purpose of this is to
        // ensure that beginMagic and endMagic
        // are in their own data chunks, so we can
        // easily detect them downstream.
        replace(beginMagic, beginMagic)
    ).pipe(
        replace(endMagic, endMagic)
    ).pipe(
        makeAPCStream(actions)
    );
};

module.exports.makeHeaderStream = makeHeaderStream;
