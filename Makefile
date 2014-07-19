clean:
		@rm -rf build

compress:
		@mkdir -p build
		@cp particlemap.js ./build/particlemap.js
		@./node_modules/.bin/uglifyjs -o ./build/particlemap.min.js particlemap.js
		@gzip -c ./build/particlemap.min.js > ./build/particlemap.min.js.gz

build: clean compress
