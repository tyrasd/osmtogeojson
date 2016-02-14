osmtogeojson.js: index.js package.json lodash.custom.js node_modules
	browserify -s osmtogeojson index.js | uglifyjs -c -m -o osmtogeojson.js
coverage: .
	istanbul cover _mocha -x lodash.custom.js -- -R spec
lodash: .
	lodash exports=node include=clone,merge,isEmpty,isArray,compact,each -d
