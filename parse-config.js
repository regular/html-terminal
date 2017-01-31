const pull = require('pull-stream');
const glob = require('pull-glob');
const file = require('pull-file');
const split = require('pull-split');
const R = require('ramda');

const configDir = "/etc/node-terminal-server.conf.d";

module.exports = (cb) => {
    pull(
        glob(`${configDir}/*`),
        pull.map( (filename) => file(filename) ),
        pull.flatten(),
        split(),
        pull.map( (l)=> l.trim() ),
        pull.filter( (l)=> l.length && l[0] !== "#" ),
        (()=>{
            let endpoint;
            return pull.map((line)=>{
                let m = line.match(/^\[([a-zA-Z0-9_\-]+)\]$/);
                if (m) {
                    endpoint = m[1];
                    line = "";
                }
                return {endpoint, line};
            });
        })(),
        pull.filter( ({endpoint, line}) => line.length ),
        pull.map( ({endpoint, line}) => ({
            endpoint, 
            line: line.split(/\t+/g)
        })),
        pull.asyncMap(({endpoint, line}, cb)=>{
            try {
                if (line.length !== 2) throw new Error(`Syntax Error in ${endpoint}: ${line.join("[tab]")}`);
                let [left, right] = line;
                let m = left.match(/^\/(.*)\/$/);
                if (!m) throw new Error(`Syntax Error in regular expression: ${left}`);
                let re = new RegExp(m[1]);
                let cli = right;
                cb(null, {endpoint, re, cli});
            } catch(e) {
                cb(e);
            }
        }),
        pull.collect( (err, result)=>{
            if (err) return cb(err);
            let byEndpoint = R.groupBy(R.prop('endpoint'));
            cb(null, byEndpoint(result));
        })
    );
};
