/* converts OSM XML to OSM JSON using a fast streaming parser */
var htmlparser = require('htmlparser2');
var _ = require("./lodash.custom.js");

var json = {
    "version": 0.6,
    "elements": []
};
var buffer = {};
var tagStack = new Array();
var geomStack = [ {} ];
var p = new htmlparser.Parser({
    onopentag: function(name, attr) {
        switch (name) {
        case "node":
        case "way":
        case "relation":
            buffer = {
                type: name,
                tags: {}
            }
            _.merge(buffer, attr);
            if (name === "way") {
                buffer.nodes = [];
                buffer.geometry = [];
            }
            if (name === "relation") {
                buffer.members = [];
                buffer.nodes = [];
                buffer.geometry = [];
            }
        break;
        case "tag":
            buffer.tags[attr.k] = attr.v;
        break;
        case "nd":
            buffer.nodes.push(attr.ref);
            if (attr.lat) {
                buffer.geometry.push({
                    lat: attr.lat,
                    lon: attr.lon
                });
            } else {
                buffer.geometry.push(null);
            }
        break;
        case "member":
            buffer.members.push(attr);
        break;
        case "center":
            buffer.center = {
                lat: attr.lat,
                lon: attr.lon
            };
        break;
        case "bounds":
            buffer.bounds = {
                minlat: attr.minlat,
                minlon: attr.minlon,
                maxlat: attr.maxlat,
                maxlon: attr.maxlon
            };
        break;
        case "point":
            if (!Array.isArray(geomStack) || geomStack.length == 0)
                geomStack = [ {} ];
            geomStack[geomStack.length-1] = {
                "type":"Point",
                "coordinates":[ Number(attr.lon), Number(attr.lat) ]
            };
        break;
        case "vertex":
            if (!Array.isArray(geomStack) || geomStack.length == 0)
                geomStack = [ {} ];
            if (geomStack[geomStack.length-1].type !== "LineString" ||
                    !Array.isArray(geomStack[geomStack.length-1].coordinates))
                geomStack[geomStack.length-1] = {
                    "type":"LineString",
                    "coordinates":[]
                };
            geomStack[geomStack.length-1].coordinates.push([ Number(attr.lon), Number(attr.lat) ]);
        break;
        case "linestring":
            if (!Array.isArray(geomStack) || geomStack.length == 0)
                geomStack = [ {} ];
            if (geomStack[geomStack.length-1].type !== "Polygon" ||
                    !Array.isArray(geomStack[geomStack.length-1].coordinates))
                geomStack[geomStack.length-1] = {
                    "type":"Polygon",
                    "coordinates":[]
                };
            geomStack.push({});
        break;
        case "group":
            if (!Array.isArray(geomStack) || geomStack.length == 0)
                geomStack = [ {} ];
            if (geomStack[geomStack.length-1].type !== "GeometryCollection" ||
                    !Array.isArray(geomStack[geomStack.length-1].geometries))
                geomStack[geomStack.length-1] = {
                    "type":"GeometryCollection",
                    "geometries":[]
                };
            geomStack.push({});
        break;
        default:
            if (Array.isArray(tagStack) && !tagStack.length == 0 && tagStack[tagStack.length-1] === "osm")
            {
                buffer = {
                    type: name,
                    tags: {}
                }
                _.merge(buffer, attr);
            }
        }
        if (!tagStack || !Array.isArray(tagStack))
            tagStack = new Array();
        tagStack.push(name);
    },
    ontext: function(text) {
    },
    onclosetag: function(name) {
        if (Array.isArray(tagStack))
            tagStack.pop();
        if (Array.isArray(tagStack) && !tagStack.length == 0 && tagStack[tagStack.length-1] === "osm") {
            // remove empty geometry or nodes arrays
            if (buffer.geometry && buffer.geometry.every(function(g) {return g===null;}))
                delete buffer.geometry;
            if (name === "relation")
                delete buffer.nodes;
            buffer.type = name;
            if (Array.isArray(geomStack) && geomStack.length > 0 && geomStack[0].type)
                buffer.geometry = geomStack[0];
            json.elements.push(buffer);
            buffer = {};
            geomStack = [ {} ];
        }
        else if (name === "linestring")
        {
            if (Array.isArray(geomStack) && geomStack.length > 1
                && Array.isArray(geomStack[geomStack.length - 2].coordinates)
                && Array.isArray(geomStack[geomStack.length - 1].coordinates)
                && geomStack[geomStack.length - 1].type === "LineString")
            {
                geomStack[geomStack.length - 2].coordinates.push(geomStack[geomStack.length - 1].coordinates);
                geomStack.pop();
            }
        }
        else if (name === "group")
        {
            if (Array.isArray(geomStack) && geomStack.length > 1
                && Array.isArray(geomStack[geomStack.length - 2].geometries))
            {
                geomStack[geomStack.length - 2].geometries.push(geomStack[geomStack.length - 1]);
                geomStack.pop();
            }
        }
        if (name === "member") {
            if (buffer.geometry) {
                buffer.members[buffer.members.length-1].geometry = buffer.geometry;
                buffer.geometry = [];
            }
        }
    }
}, {
    decodeEntities: true,
    xmlMode: true
});

p.parseFromString = function(xml_str) { p.write(xml_str); p.end(); return json; }
p.getJSON = function() {
    return json;
}

module.exports = p;
