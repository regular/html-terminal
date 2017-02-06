pwd := $(shell pwd)

all: build/bundle.js build/web servicefiles
.PHONY : all

# get rid of this when the PR is merged
node_modules/browserify-zlib-next/lib/index.js:
	cd node_modules/browserify-zlib-next && npm i && npm run build

build/bundle.js: client.js node_modules/browserify-zlib-next/lib/index.js
	mkdir -p build
	node_modules/.bin/browserify client.js -o build/bundle.js

build/web: web.c
	mkdir -p build
	gcc -o build/web `pkg-config --libs --cflags webkit2gtk-4.0` web.c

servicefiles: build/node-terminal-server.service build/html-terminal.service
.PHONY : servicefiles

build/html-terminal.service: html-terminal.service
	cat html-terminal.service | sed "s#INSTALLDIR#${pwd}#" > build/html-terminal.service

build/node-terminal-server.service: node-terminal-server.service
	cat node-terminal-server.service | sed "s#INSTALLDIR#${pwd}#" > build/node-terminal-server.service

clean:
	rm -f build/*
