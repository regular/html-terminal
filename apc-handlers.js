//jshint esversion: 6, -W083
const concat = require('concat-stream');

const defaultParent = 'body';

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
    let el = document.querySelector(selector);
    if (!el) throw new Error(`Selector does not match any element: ${selector}`);

    stream.pipe(concat( (data) => {
        var frag = document.createDocumentFragment();
        var div = document.createElement('div');
        div.innerHTML = data.toString(); 
        convertScriptTags(div);
        while (div.firstChild) frag.appendChild(div.firstChild);
        el.appendChild(frag);
    }));
}

function removeChild(stream, header) {
    let selector = header.args[1] || defaultParent;
    let el = document.querySelector(selector);
    if (!el) throw new Error(`Selector does not match any element: ${selector}`);
    let parent = el.parentElement;
    if (!parent) throw new Error(`${selector} has no parent element.`);
    parent.removeChild(el);
}

module.exports = {
    appendChild,
    removeChild
};
