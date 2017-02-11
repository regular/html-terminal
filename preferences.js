// See https://chromium.googlesource.com/chromiumos/platform/assets/+/95f6a2c7a984b1c09b7d66c24794ce2057144e86/chromeapps/hterm/doc/faq.txt
module.exports = function(prefs) {
    prefs.set('cursor-color', 'rgba(155, 255, 155, 0.5)');
    prefs.set('font-size', 35);
    //prefs.set('font-family', 'Monaco for Powerline');
    //prefs.set('font-family', 'Inconsolata');
    prefs.set('font-family', 'monospace');
    prefs.set('cursor-blink', true);

    prefs.set('enable-bold', true);
    prefs.set('enable-bold-as-bright', false);

    prefs.set('environment', {
      "TERM": "xterm-256color"
    });
};
