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
            buffer.nodes.push(attr.ref);
        } else if (name === "member") {
            if (!buffer.members) buffer.members = [];
            buffer.members.push(attr);
        }
    },
    ontext: function(text) {
    },
    onclosetag: function(name) {
        if (name === "node" || name === "way" || name === "relation" || name === "area") {
            json.elements.push(buffer);
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
