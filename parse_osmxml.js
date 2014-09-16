/* converts OSM XML to OSM JSON using a fast streaming parser */
var htmlparser = require('htmlparser2');
var _ = require("./lodash.custom.js");

var json = {
    "version": 0.6,
    "elements": []
};
var buffer = {};
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
        }
    },
    ontext: function(text) {
    },
    onclosetag: function(name) {
        if (name === "node" || name === "way" || name === "relation" || name === "area") {
            // remove empty geometry or nodes arrays
            if (buffer.geometry && buffer.geometry.every(function(g) {return g===null;}))
                delete buffer.geometry;
            if (name === "relation")
                delete buffer.nodes;
            json.elements.push(buffer);
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
