// taken from https://gist.github.com/baldwicc/9ad4b0f6f7a01cde267b

var s7d_colours = {
      'base03': '#002b36',
      'base02': '#073642',
      'base01': '#586e75',
      'base00': '#657b83',
      'base0': '#839496',
      'base1': '#93a1a1',
      'base2': '#eee8d5',
      'base3': '#fdf6e3',
      'yellow': '#b58900',
      'orange': '#cb4b16',
      'red': '#dc322f',
      'magenta': '#d33682',
      'violet': '#6c71c4',
      'blue': '#268bd2',
      'cyan': '#2aa198',
      'green': '#859900'
};

module.exports.dark = function(t) {
    t.prefs_.set('background-color', s7d_colours.base03);
    t.prefs_.set('foreground-color', s7d_colours.base0);
    t.prefs_.set('color-palette-overrides', [s7d_colours.base02, s7d_colours.red, s7d_colours.green, s7d_colours.yellow, s7d_colours.blue, s7d_colours.magneta, s7d_colours.cyan, s7d_colours.base2, s7d_colours.base3, s7d_colours.orange, s7d_colours.base01, s7d_colours.base00, s7d_colours.base0, s7d_colours.violet, s7d_colours.base1, s7d_colours.base3]);
};

module.exports.light = function(t) {
    t.prefs_.set('background-color', s7d_colours.base3);
    t.prefs_.set('foreground-color', s7d_colours.base00);
    t.prefs_.set('color-palette-overrides', [s7d_colours.base2, s7d_colours.red, s7d_colours.green, s7d_colours.yellow, s7d_colours.blue, s7d_colours.magneta, s7d_colours.cyan, s7d_colours.base02, s7d_colours.base03, s7d_colours.orange, s7d_colours.base1, s7d_colours.base0, s7d_colours.base00, s7d_colours.violet, s7d_colours.base01, s7d_colours.base03]);
};
