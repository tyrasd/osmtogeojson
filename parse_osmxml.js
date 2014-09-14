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
        if (name === "node" || name === "way" || name === "relation" || name === "area") {
            buffer = {
                type: name
            }
            _.merge(buffer, attr);
        } else if (name === "tag") {
            if (!buffer.tags) buffer.tags = {};
            buffer.tags[attr.k] = attr.v;
        } else if (name === "nd") {
            if (!buffer.nodes) buffer.nodes = [];
            var index = buffer.nodes.push(attr.ref)-1;
            if (attr.lat) {
                if (!buffer.geometry) buffer.geometry = [];
                buffer.geometry[index] = {
                    lat: attr.lat,
                    lon: attr.lon
                }
            }
        } else if (name === "member") {
            if (!buffer.members) buffer.members = [];
            buffer.members.push(attr);
        } else if (name === "center") {
            buffer.center = {
                lat: attr.lat,
                lon: attr.lon
            };
        } else if (name === "bounds") {
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
            json.elements.push(buffer);
        }
        if (name === "member") {
            if (buffer.geometry) {
                buffer.members[buffer.members.length-1].geometry = buffer.geometry;
                delete buffer.geometry;
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
