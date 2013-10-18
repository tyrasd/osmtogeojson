osmtogeojson
============

Converts [OSM](http://openstreetmap.org) [data](http://wiki.openstreetmap.org/wiki/OSM_XML) to [GeoJSON](http://www.geojson.org/). Try the [demo](http://tyrasd.github.io/osmtogeojson/)!

* stable
* real OSM [polygon support](https://wiki.openstreetmap.org/wiki/Overpass_turbo/Polygon_Features)
* real OSM multipolygon support
* well [tested](http://github.com/tyrasd/osmtogeojson/tree/master/test/) and proven
* ~~fast~~ not slow

This code is used in and maintained by the [overpass turbo](http://github.com/tyrasd/overpass-ide) project.

[![Build Status](https://secure.travis-ci.org/tyrasd/osmtogeojson.png)](https://travis-ci.org/tyrasd/osmtogeojson)

Usage
-----

* as a command line tool:
  
        npm install -g osmtogeojson
        $ osmtogeojson file.osm > file.geojson
  
* as a nodejs libary:
  
        npm install osmtogeojson
  
        var osm = require('osmtogeojson');
        osm.toGeojson(xml_data);
  
* as a browser library:
  
        <script src='lodash.js'></script>
        <script src='osmtogeojson.js'></script>
  
        osmtogeojson.toGeojson(xml_data);

API
---

### `.toGeojson( data, options )`

Converts OSM data into GeoJSON.

* `data`: the OSM data. Either as a XML DOM or in [OSM JSON](http://overpass-api.de/output_formats.html#json).
* `options`: optional. The following options can be used:
  * `flatProperties`: If true, the resulting GeoJSON feature's properties won't be a structured json object rather than a simple key-value list.
  * `uninterestingTags`: Either a [blacklist](https://github.com/tyrasd/osmtogeojson/blob/5d8684dc80712c3dc44d7a72692a2df3c7253cb1/osmtogeojson.js#L12-L22) of tag keys or a callback function. Will be used to deciding if a feature is *interesting*.
  * `polygonFeatures`: Either a [json object](https://github.com/tyrasd/osmtogeojson/blob/5d8684dc80712c3dc44d7a72692a2df3c7253cb1/osmtogeojson.js#L23-L103) or callback function that is used to determine if a closed way should be treated as a Polygon or LineString. [read more](https://wiki.openstreetmap.org/wiki/Overpass_turbo/Polygon_Features)

The result is a javascript object of GeoJSON data.
