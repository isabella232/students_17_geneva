all:
	emcc -s WASM=1 -s NO_EXIT_RUNTIME=1 -O3 -o gmp.js gmp.c libgmp.a
	cp gmp.wasm ../gmp.wasm
	cp gmp.js ../js/gmp.js
