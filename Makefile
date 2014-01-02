osmtogeojson.js: index.js lodash.custom.js node_modules
	browserify -s osmtogeojson index.js | uglifyjs -c -m -o osmtogeojson.js
coverage: .
	istanbul cover _mocha -- -R spec
lodash: .
	lodash exports=node include=clone,merge,isEmpty,isArray,compact,contains,each -d
