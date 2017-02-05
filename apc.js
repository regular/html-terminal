//jshint esversion: 6, -W083
const through = require('through');
const bufferEquals = require('buffer-equal');
const replace = require('binary-stream-replace');
const zlib = require('browserify-zlib-next'); // unmerged PR from ipfs
const base64 = require('base64-stream');
const bl = require('bl');

let beginMagic = Buffer.from('\x1b_HTMSHELL/1.0');
let endMagic = Buffer.from('\n\x1b\\');

module.exports = function(stream) {
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
        (()=>{
            let isPayload = false;
            let decodeStream;
            let bufferList;
            let inHeader;
            return through( function(chunk) {
                //console.log('chunk', chunk);
                let prolog = bufferEquals(chunk, beginMagic);
                let epilog = bufferEquals(chunk, endMagic);
                if (prolog && !isPayload) {
                    isPayload = true;
                    inHeader = true;
                    bufferList = new bl();
                    let gunzip = zlib.createGunzip();

                    gunzip.on('error', (err)=>{
                        console.log('gunzip err', err); 
                    });
                    gunzip.on('data', (data)=>{
                        //console.log('gunzip data', data); 
                        bufferList.append(data);
                    });
                    gunzip.on('end', (data)=>{
                        console.log('gunzip end'); 
                        let html = bufferList.toString();
                        console.log('html', html.length); 
                        let el = document.createElement('div');
                        el.innerHTML = html;
                        el.style.height = '20%';
                        el.style.width = '100%';
                        document.body.appendChild(el);
                    });

                    decodeStream = replace(Buffer.from(';;'), Buffer.from(';;'));
                    decodeStream
                        .pipe(through(function(data) {
                            //console.log(data);
                            if (!inHeader) {
                                this.queue(data); 
                            }
                            if (data.length==2 && data[0]==59 && data[1]==59) {
                                console.log('FOUND EMPTY LINE');
                                inHeader = false;
                            }
                        }))
                        .pipe(base64.decode())
                        .pipe(gunzip);
                }
                if (!isPayload) {
                    this.queue(chunk);
                } else if (!prolog && !epilog) {
                    decodeStream.write(chunk);
                }
                if (epilog) {
                    console.log('ending decodeStream');
                    isPayload = false;
                    decodeStream.end();
                }
            });
        })()
    );
};
