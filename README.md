html-terminal
===
Terminal emulator based on web technologies.


## TL;DR
> I heard you like the terminal and the web, so I put a terminal in your browser and an HTML renderer in your terminal, so you can hack while you browse and browse while you hack!


html-terminal is a terminal emulator based on [hterm][1] that runs in a minimal, clutter-free [webkitg2gtk][2] webView that covers the entire screen. It is designed to be run on top of [weston compositor][3].

The back-end (terminal-server) runs on nodejs and communicates with hterm via websockets using [substack's shoe][4]. It is desinged to be started via [systemd][5].

This is part of [htmshell][6].

## Installation

### Arch Linux

#### Dependencies

```
pacman -S nodejs weston 
```
and from AUR: [webkit2gtk-unstable](https://aur.archlinux.org/packages/webkit2gtk-unstable/)

```
npm i
cp build/node-terminal-server.service /etc/systemd/system/
cp build/html-terminal.service /etc/systemd/system/
systemctl daemon-reload
systemctl start node-terminal-server
```

Make sure your `/etc/systemd/system/weston.service` looks somewhat like mine:

```
[Unit]
Description=weston
RequiresMountsFor=/run
Requires=dbus.service systemd-udevd.service
After=dbus.service systemd-udevd.service

[Service]
Type=notify
NotifyAccess=all
WatchdogSec=20s
ExecStartPre=/bin/mkdir -p /var/run/root/1000
ExecStartPre=/bin/chmod 0700 /var/run/root/1000
ExecStart=/usr/bin/openvt -v -e /usr/bin/weston -- --modules=systemd-notify.so  --backend=drm-backend.so --log=/var/log/weston.log
ExecStartPost=/usr/bin/bash -c "env > /var/run/root/1000/environment"
Nice=-20
Environment=XDG_RUNTIME_DIR=/var/run/root/1000

[Install]
WantedBy=multi-user.target
```

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


