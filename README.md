osmtogeojson
============

Converts [OSM](http://openstreetmap.org) [data](http://wiki.openstreetmap.org/wiki/OSM_XML) to [GeoJSON](http://www.geojson.org/). Try the [demo](http://tyrasd.github.io/osmtogeojson/)!

* stable
* real OSM [polygon detection](https://wiki.openstreetmap.org/wiki/Overpass_turbo/Polygon_Features)
* proper OSM multipolygon support
* full support for extended Overpass API [geometry modes](http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#Print_.28out.29)
* well [tested](https://github.com/tyrasd/osmtogeojson/tree/gh-pages/test/) and proven
* fast

This code is used in and maintained by the [overpass turbo](http://github.com/tyrasd/overpass-ide) project.

[![Build Status](https://secure.travis-ci.org/tyrasd/osmtogeojson.png)](https://travis-ci.org/tyrasd/osmtogeojson)

Usage
-----

### command line tool
  
Installation:

      $ npm install -g osmtogeojson

Usage:

    $ osmtogeojson file.osm > file.geojson

Supported command line options are shown with:

    $ osmtogeojson --help

When working with extra large data files (≳ 100 MB) it is recommended to run the programm with a little extra memory to avoid *process out of memory* errors. The easiest way to do this is by running the command as `node <path-to-osmtogeojson>` and setting the `--max_old_space_size=…` parameter to the available memory size in MB (osmtogeojson typically needs about 4-5 times the input data size). On a Unix system, you can use the following command:

    $ node --max_old_space_size=8192 `which osmtogeojson` large.osm > large.geojson

### nodejs library

Installation:

    $ npm install osmtogeojson

Usage:

    var osmtogeojson = require('osmtogeojson');
    osmtogeojson(osm_data);

### browser library

    <script src='osmtogeojson.js'></script>

    osmtogeojson(osm_data);

API
---

### `osmtogeojson( data, options )`

Converts OSM data into GeoJSON.

* `data`: the OSM data. Either as a XML DOM or in [OSM JSON](http://overpass-api.de/output_formats.html#json).
* `options`: optional. The following options can be used:
  * `flatProperties`: If true, the resulting GeoJSON feature's properties will be a simple key-value list instead of a structured json object (with separate tags and metadata). default: false
  * `uninterestingTags`: Either a [blacklist](https://github.com/tyrasd/osmtogeojson/blob/2.0.0/index.js#L14-L24) of tag keys or a callback function. Will be used to decide if a feature is *interesting* enough for its own GeoJSON feature.
  * `polygonFeatures`: Either a [json object](https://github.com/tyrasd/osmtogeojson/blob/2.0.0/polygon_features.json) or callback function that is used to determine if a closed way should be treated as a Polygon or LineString. [read more](https://wiki.openstreetmap.org/wiki/Overpass_turbo/Polygon_Features)

The result is a javascript object of GeoJSON data:

GeoJSON
-------

The GeoJSON produced by this library will include exactly one GeoJSON-feature for each of the following OSM objects (that is everything that is also visible in overpass turbo's map view):

* all unconnected or [*interesting*](#api) tagged nodes (POIs)
* all ways (except [*uninteresting*](#api) multipolygon outlines)
* all multipolygons (simple multipolygons with exactly one closed outer way are present via their outer way)

All data is given as a FeatureCollection. Each Feature in the collection has an `id` property that is formed from the type and id of the original OSM object (e.g. `node/123`) and has the member `properties` containing the following data:

* `type`: the OSM data type
* `id`: the OSM id 
* `tags`: a collection of all tags
* `meta`: metainformaton about the feature (e.g. version, timestamp, user, etc.)
* `relations`: an array of relations the feature is member of. Each relation is encoded as an object literal containing the following properties: `role` (membership role), `rel` (the relation's id) and `reltags` (contains all tags of the relation)
* `tainted`: this flag is set when the feature's geometry is incomplete (e.g. missing nodes of a way or missing ways of a multipolygon)

If the [option](#api) `flatProperties` is set to true, the `properties` object will not contain any nested object literals, but directly provide a concise id, meta data and the tags of the respective OSM object.

