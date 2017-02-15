//jshint esversion: 6, -W083
const concat = require('concat-stream');
const series = require('run-series');
const BufferList = require('bl');

const defaultParent = 'body';

function TaskQueue() {
    let tasks = [];
    let timer;

    function runTasks() {
        console.log(`Running ${tasks.length} tasks.`);
        let pending = tasks.splice(0);
        series(pending, (err, results) => {
            console.log('Results of running tasks:', err, results);
        });
    }
    
    return function addTask(task) {
        tasks.push((cb)=>{
            task( (err)=>{ 
                // wrapping into allways-succeeding
                // async function
                console.error(err);
                cb(null);
            });
        });
        if (typeof timer !== 'undefined') clearTimeout(timer);
        timer = setTimeout(runTasks, 0);
   };
}

let addTask = TaskQueue();

// See http://stackoverflow.com/questions/1197575/can-scripts-be-inserted-with-innerhtml
function cloneScriptElement(node) {
    var script  = document.createElement("script");
    script.text = node.innerHTML;
    for(let i=0; i<node.attributes.length; i++) {
        script.setAttribute(
            node.attributes[i].name, 
            node.attributes[i].value
        );
    }
    return script;
}

function convertScriptTags(node) {
    if ( node.tagName === 'SCRIPT' ) {
        node.parentNode.replaceChild( cloneScriptElement(node), node);
    } else {
        let children = node.childNodes;
        for (let i=0; i<children.length; ++i ) {
            convertScriptTags(children[i]);
        }
    }
    return node;
}

function appendChild(stream, header) {
    let selector = header.args[1] || defaultParent;
    console.log(`About to appendChild to ${selector}`);

    stream.on('end', ()=>console.log('appendChild stream ends') );

    let data = BufferList();
    stream.pipe(data);
    let ended = false;
    stream.on('end', ()=> ended = true );

    addTask( (cb) => {
        console.log('appendChild taks');
        if (ended) return doit(cb);
        stream.on('end', ()=> doit(cb) );
        
        function doit(cb) {
            console.log('appendChild doit');
            let el = document.querySelector(selector);
            if (!el) return cb(new Error(`Selector does not match any element: ${selector}`));
            console.log(`appendChild to ${selector}`, el);

            var frag = document.createDocumentFragment();
            var div = document.createElement('div');
            div.innerHTML = data.toString(); 
            convertScriptTags(div);
            while (div.firstChild) frag.appendChild(div.firstChild);
            el.appendChild(frag);
            console.log('appended');
            cb(null);
        }
    });
}

function removeChild(stream, header) {
    let [_, parentSelector, childSelector] = header.args;
    if (!childSelector) {
        childSelector = parentSelector;
        parentSelector = defaultParent;
    }
    console.log(`About to remove ${childSelector} from ${parentSelector}`);
    addTask( (cb) => {
        let parent = document.querySelector(parentSelector);
        if (!parent) return cb(new Error(`Parent selector does not match any element: ${parentSelector}`));
        console.log(`remove ${childSelector} fomr`, parent);
        let el = parent.querySelector(childSelector);
        if (!el) return cb(new Error(`Child selector does not match any element: ${childSelector}`));
        parent.removeChild(el);
        cb(null);
    });
}

function setAttribute(stream, header) {
    let [_, selector, name] = header.args;
    console.log('about to setAttribute', selector, name);

    stream.on('end', ()=>console.log('attr stream ends') );

    let data = BufferList();
    stream.pipe(data);
    let ended = false;
    stream.on('end', ()=> ended = true );

    addTask( (cb) => {
        console.log('setAttribute taks');
        if (ended) return doit(cb);
        stream.on('end', ()=> doit(cb) );
        
        function doit(cb) {
            console.log('setAtttr doit');
            let el = document.querySelector(selector);
            //if (!el) throw new Error(`Selector does not match any element: ${selector}`);
            console.log(`set ${name} of ${selector}`, el, 'to', data);
            el.setAttribute(name, data.toString() );
            //cb(null);
        }
    });
}

module.exports = {
    appendChild,
    removeChild,
    setAttribute
};
