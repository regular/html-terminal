all: script.js web

script.js: client.js
	node_modules/.bin/browserify client.js -o script.js

web: web.c
	gcc -o web `pkg-config --libs --cflags webkit2gtk-4.0` web.c

clean:
	rm script.js
	rm web
