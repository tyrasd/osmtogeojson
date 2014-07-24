/** parses OSM PBF using osm-read and passes an osmtogeojson data object to the callback */
var pbfParser = require('osm-read');

// pbf: Node.js: file path; Browser: ArrayBuffer or URL
// callback: function(err, data)
function parse(pbf, callback) {
  var url, buffer;
  var data = {
    nodes: [],
    ways: [],
    rels: []
  };

  var formatTimestamp = function (entity) {
    if (entity.timestamp) {
      entity.timestamp = new Date(entity.timestamp).toISOString().substr(0, 19) + 'Z';
    }
  };
  // <= IE 8 not supported
  if (!Date.prototype.toISOString) {
    formatTimestamp = function () {
    };
  }

  if (pbf instanceof ArrayBuffer) {
    buffer = pbf;
  } else {
    url = pbf;
  }

  pbfParser.parse({
    filePath: url,
    buffer: buffer,
    format: 'pbf',
    endDocument: function () {
      callback(null, data);
    },
    bounds: function (bounds) {
    },
    node: function (node) {
      node.type = 'node';
      formatTimestamp(node);
      data.nodes.push(node);
    },
    way: function (way) {
      way.type = 'way';
      formatTimestamp(way);
      way.nodes = way.nodeRefs;
      delete way.nodeRefs;
      data.ways.push(way);
    },
    relation: function (relation) {
      relation.type = 'relation';
      formatTimestamp(relation);
      data.rels.push(relation);
    },
    error: function (msg) {
      callback(msg);
    }
  });
}

module.exports = parse;
