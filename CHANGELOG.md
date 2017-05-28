3.0.0-beta.2
------------
* output linestrings for waterway relations, too
* improve handling of data with duplicate osm objects

3.0.0-beta.1
------------
* make multipolygon/route handlers robust against empty members

3.0.0-beta.0
------------
* (breaking) objects are by default returned with flat (un-nested) properties ("flatProperties" option is enabled by default)
* create (Multi)LineString features for route relations
* add pbf file support
* add newline delimited GeoJSON output mode (ndjson compatible)
* new API option: feature callback for custom output
* new API option: allow customized object deduplication handling

2.2.12
------
backported from 3.0.0-dev: de-namespace full geometry content in output (internal state leak)

2.2.11
------
revert "use strict" because of some issues on older (0.…) nodejs

2.2.10
------
* fix another undeclared variable breaking the module in strict mode
* enable "use strict";

2.2.9
-----
split off polygon detection data: https://github.com/tyrasd/osm-polygon-features

2.2.8
-----
fix variable leaking into global scope

2.2.7
-----
fix a bug where loading certain complex `out geom` content resulted in invalid polygon geometries

2.2.6
-----
add bower support #45

2.2.5
-----
add `-m` parameter that minifies output json

2.2.4
-----
fixed a bug where full geometry information caused additional Point features in the output

2.2.3
-----
* updates to polygon detection: natural=cliff is not automatically an area, golf=* is rendered as polygons
* speed optimizations for xml input in CLI mode #34

2.2.1
-----
* fix bug with ref-less, clipped full geometry ways in JSON mode

2.2.0
-----
* support for Overpass API "full" geometry

2.1.0
-----
* implemented support for Overpass API geometry types "center" and "bounds"
* new command line option `-n` to make properties numeric
* added verbose option/mode that displays some debug info to the console/stderr

2.0.5
-----
* support input files larger than 256 MB. #17

2.0.4
-----
* fix unresolved xml entities in command line mode

2.0.2
-----
* fix a dangling dependency (which led fresh installations to crash prematurely)

2.0.0
-----
* simpler API (module exports as a plain function), old `.toGeojson` still available as a fallback
* output (multi)polygons with consistent winding orders
* improve handling of simple multipolygons
* use browserify for browser library (comes bundeled with dependencies)
* some minor speed improvements

1.4.0
-----
* fix various speed bottlenecks (xml parsing, geojson construction, …)
* better performance when handling large xml files with the cli tool: ![](https://f.cloud.github.com/assets/1927298/1461813/4a1ce53e-44ce-11e3-9a96-d600eb3aba9b.png)

1.3.1
-----
* add --help and --version parameters to cli tool
* fix bug with not automatically detected file formats in pipe mode (cli tool)

1.3.0
-----
* more versatile cli tool (can read osm json, optionally enhanced output)
* many more unit tests
* fixed bugs with some partially incomplete data

1.2.1
-----
* fix wrong (inverse) logic in uninterestingTags callback evaluation (backported from master)

1.2.0
-----
* add [demo](http://tyrasd.github.io/osmtogeojson/) page
* support for pipes in cli tool: `echo '<osm><node lat="1.23" lon="3.21" id="-1" /></osm>' | osmtogeojson`
* add flat-properties output mode (default for the cli tool)
* add options to override default `uninterestingTags` and `polygonFeatures`
* better documentation
* more test cases
* further improvements in polygon feature detection

1.1.1
-----
* bugfix: remove unneeded debugging code

1.1.0
-----
* command line tool added

1.0.0
-----
* initial release
