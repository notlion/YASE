public/build:
	mkdir public/build

public/build/main.js: public/build
	r.js -o build.js

all: public/build/main.js

clean:
	rm -rf public/build
