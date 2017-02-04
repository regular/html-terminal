html-terminal
===
Terminal emulator based on web technologies.


## TL;DR
> I heard you like the terminal and the web, so I put a terminal in your browser and an HTML renderer in your terminal, so you can hack while you browse and browse while you hack!


html-terminal is a terminal emulator based on [hterm][1] that runs in a minimal, clutter-free [webkitg2gtk][2] webView that covers the entire screen. It is designed to be run on top of [weston compositor][3].

The back-end (terminal-server) runs on nodejs and communicates with hterm via websockets using [substack's shoe][4]. It is desinged to be started via [systemd][5].

This is part of [htmshell][6].

## Installation

```
npm i
cp node-terminal-server.service /etc/systemd/system/
# edit to adjust the paths in the .service file
systemctl daemon-reload
systemctl start node-terminal-server.service
````

# Known Bugs

Terminal resize does not resize the pty.

# Future Plans

Invent custom [ANSI Escape Sequence][7] to support rendering of HTML snippets inside the terminal window.

[1]: https://github.com/macton/hterm
[2]: https://directory.fsf.org/wiki/Webkit2gtk
[3]: https://github.com/wayland-project/weston
[4]: https://github.com/substack/shoe
[5]: https://en.wikipedia.org/wiki/Systemd
[6]: https://github.com/regular/htmshell
[7]: https://en.wikipedia.org/wiki/ANSI_escape_code



