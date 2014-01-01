osmtogeojson.js: index.js
	browserify -s osmtogeojson index.js | uglifyjs -c -m -o osmtogeojson.js
