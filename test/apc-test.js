//jshint esversion: 6, -W083
const apc = require('../apc');
const test = require('tape');
const bl = require('bl');
const concat = require('concat-stream');

const beginMagic = Buffer.from('\x1b_HTMSHELL/1.0');
const endMagic = Buffer.from('\n\x1b\\');

test('makeHeaderStream (one line header)', (t)=>{
    t.plan(4);

    let hs = apc.makeHeaderStream( (headers)=> {
        t.equal(headers.length, 2, 'Should have parsed two header line');
        t.equal(headers[0], 'this is a header line', 'The 1st header line should be correct');
        t.equal(headers[1], 'this is another header line', 'The 2nd header line should be correct');
    });
    hs.pipe(concat( (body)=>{
        t.equal(body.toString(), 'bo\n\ndy', 'message body should be correct');
    }));

    hs.write(Buffer.from('this is a header line\n'));
    hs.write(Buffer.from('this is another header line\n'));
    hs.write(Buffer.from('\n'));
    hs.write(Buffer.from('bo\n\ndy'));
    hs.end();
});

test.skip('Sequence should not show up downstream', (t)=> {
    let stream = new bl();
    stream.append('Hello');
    stream.append(beginMagic);
    stream.append(Buffer.from('\n\n'));
    stream.append(endMagic);
    stream.append(' World');

    apc(stream).pipe(concat((result)=>{
        t.equal(result.toString(), 'Hello World');
        t.end();
    }));
});

test.skip('Sequence at beginning of input should not show up downstream', (t)=> {
    let stream = new bl();
    stream.append(beginMagic);
    stream.append(Buffer.from('\n\n'));
    stream.append(endMagic);
    stream.append('Hello World');

    apc(stream).pipe(concat((result)=>{
        t.equal(result.toString(), 'Hello World');
        t.end();
    }));
});

test.skip('Should call callback with payload stream', (t)=> {
    let stream = new bl();
    stream.append('Hello');
    stream.append(beginMagic);
    stream.append(Buffer.from('ACTION'));
    stream.append(Buffer.from('\n\n'));
    stream.append(Buffer.from('data'));
    stream.append(endMagic);
    stream.append(' World');

    t.plan(2);

    apc(stream, {
        ACTION: (payloadStream) => {
            payloadStream.pipe(concat( (payload) => {
                t.equal(payload, 'data');
            }));
        }
    }).pipe(concat((result)=>{
        t.equal(result.toString(), 'Hello World');
    }));
});
