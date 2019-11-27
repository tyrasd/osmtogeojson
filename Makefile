osmtogeojson.js: index.js package.json lodash.custom.js node_modules
	browserify -s osmtogeojson index.js | ./node_modules/.bin/uglifyjs -c -m -o osmtogeojson.js
coverage: .
	./node_modules/.bin/istanbul cover node_modules/.bin/_mocha -x lodash.custom.js -- -R spec
lodash: .
	lodash exports=node include=clone,merge,isEmpty,isArray,compact,each -d
