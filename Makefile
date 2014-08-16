osmtogeojson.js: index.js parse_osmxml.js parse_osmpbf.js package.json lodash.custom.js node_modules
	browserify -s osmtogeojson -i osm-read index.js | uglifyjs -c -m -o osmtogeojson.js
	browserify -s osmtogeojson --bare index.js | uglifyjs -c -m -o pbftogeojson.js
coverage: .
	istanbul cover _mocha -x lodash.custom.js -- -R spec
lodash: .
	lodash exports=node include=clone,merge,isEmpty,isArray,compact,each -d
