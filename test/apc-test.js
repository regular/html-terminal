//jshint esversion: 6, -W083
const apc = require('../apc');
const test = require('tape');
const bl = require('bl');
const concat = require('concat-stream');

const beginMagic = Buffer.from('\x1b_HTMSHELL/1.0');
const endMagic = Buffer.from('\n\x1b\\');

test('parseHeaderLines', (t)=> {
    t.deepEqual(apc.parseHeaderLines([
        'action'
    ]), {args:['action']}, 'Action name only');

    t.deepEqual(apc.parseHeaderLines([
        'APPEND arg1'
    ]), {args:['APPEND', 'arg1']}, 'Action with args only');

    t.deepEqual(apc.parseHeaderLines([
        'APPEND arg1 arg2',
        'key1: value1',
        'key2 :value2',
        'key3 : value3'
    ]), {
        args:['APPEND', 'arg1', 'arg2'],
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
    }, 'Action with args only');
    t.end();
});

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

test('makeHeaderStream (alternative line ending)', (t)=>{
    t.plan(4);

    let hs = apc.makeHeaderStream( (headers)=> {
        t.equal(headers.length, 2, 'Should have parsed two header line');
        t.equal(headers[0], 'this is a header line', 'The 1st header line should be correct');
        t.equal(headers[1], 'this is another header line', 'The 2nd header line should be correct');
    });
    hs.pipe(concat( (body)=>{
        t.equal(body.toString(), 'bo\r\n\r\ndy', 'message body should be correct');
    }));

    hs.write(Buffer.from('this is a header line\r\n'));
    hs.write(Buffer.from('this is another header line\r\n'));
    hs.write(Buffer.from('\r\n'));
    hs.write(Buffer.from('bo\r\n\r\ndy'));
    hs.end();
});


test('Sequence should not show up downstream', (t)=> {
    let stream = new bl();
    stream.append('Hello');
    stream.append(beginMagic);
    stream.append('ACTION\n');
    stream.append('\n');
    stream.append(endMagic);
    stream.append(' World');

    stream.pipe(apc()).pipe(concat((result)=>{
        t.equal(result.toString(), 'Hello World');
        t.end();
    }));
});


test('Should call callback with payload stream', (t)=> {
    let stream = new bl();
    stream.append('Hello');
    stream.append(beginMagic);
    stream.append('ACTION\n');
    stream.append('foo: bar\n');
    stream.append('\n');
    stream.append('data');
    stream.append(endMagic);
    stream.append(' World');

    t.plan(3);

    stream.pipe(apc({
        ACTION: (payloadStream, headers) => {
            t.deepEqual(headers, {
                args: ['ACTION'],
                foo: 'bar'
            }, 'Should have correctly parsed header');
            payloadStream.pipe(concat( (payload) => {
                t.equal(payload.toString(), 'data', 'Should be correct payload');
            }));
        }
    })).pipe(concat((result)=>{
        t.equal(result.toString(), 'Hello World', 'Should forward filtered data');
    }));
});

test('makeDecoderStream', (t)=>{
    t.plan(4);

    {
        let s1 = apc.makeDecoderStream({});
        s1.pipe(concat( (data)=> {
            t.equals(data.toString(), 'hallo', 'Should be transparent, if no headers are present');
        }));
        s1.end('hallo');
    }
    {
        let s1 = apc.makeDecoderStream({
            'content-transfer-encoding': 'base64'
        });
        s1.pipe(concat( (data)=> {
            t.equals(data.toString(), 'data\n', 'Should decode base64');
        }));
        s1.end('ZGF0YQo=');
    }
    {
        let s1 = apc.makeDecoderStream({
            "content-encoding": "gzip"
        });
        s1.pipe(concat( (data)=> {
            t.equals(data.toString(), 'data\n', 'Should decode gzip');
        }));
        s1.end(Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0xfd, 0x53, 0x9b, 0x58, 0x00, 0x03, 0x4b, 0x49, 0x2c, 0x49, 0xe4, 0x02, 0x00, 0x82, 0xc5, 0xc1, 0xe6, 0x05, 0x00, 0x00, 0x00]));
    }
    {
        let s1 = apc.makeDecoderStream({
            'content-transfer-encoding': 'base64',
            "content-encoding": "gzip"
        });
        s1.pipe(concat( (data)=> {
            t.equals(data.toString(), 'data\n', 'Should decode base64, then gunzip');
        }));
        s1.end('H4sIABBXm1gAA0tJLEnkAgCCxcHmBQAAAA==');
    }

});

