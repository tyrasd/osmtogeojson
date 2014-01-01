osmtogeojson.js: index.js
	browserify -s osmtogeojson index.js | uglifyjs -c -m -o osmtogeojson.js
coverage: .
	istanbul cover _mocha -- -R spec
