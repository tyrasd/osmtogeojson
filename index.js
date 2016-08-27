var _ = require("./lodash.custom.js");
var rewind = require("geojson-rewind");

// see https://wiki.openstreetmap.org/wiki/Overpass_turbo/Polygon_Features
var polygonFeatures = {};
require("osm-polygon-features").forEach(function(tags) {
  if (tags.polygon === "all")
    polygonFeatures[tags.key] = true;
  else {
    var list = (tags.polygon === "whitelist") ? "included_values" : "excluded_values",
        tagValuesObj = {};
    tags.values.forEach(function(value) { tagValuesObj[value] = true; });
    polygonFeatures[tags.key] = {};
    polygonFeatures[tags.key][list] = tagValuesObj;
  }
});

var osmtogeojson = {};

osmtogeojson = function( data, options ) {

  options = _.merge(
    {
      verbose: false,
      flatProperties: false,
      uninterestingTags: {
        "source": true,
        "source_ref": true,
        "source:ref": true,
        "history": true,
        "attribution": true,
        "created_by": true,
        "tiger:county": true,
        "tiger:tlid": true,
        "tiger:upload_uuid": true
      },
      polygonFeatures: polygonFeatures,
    },
    options
  );

  var result;
  if ( ((typeof XMLDocument !== "undefined") && data instanceof XMLDocument ||
        (typeof XMLDocument === "undefined") && data.childNodes) )
    result = _osmXML2geoJSON(data);
  else
    result = _overpassJSON2geoJSON(data);
  return result;

  function _overpassJSON2geoJSON(json) {
    // sort elements
    var nodes = new Array();
    var ways  = new Array();
    var rels  = new Array();
    // helper functions
    function centerGeometry(object) {
      var pseudoNode = _.clone(object);
      pseudoNode.lat = object.center.lat;
      pseudoNode.lon = object.center.lon;
      pseudoNode.__is_center_placeholder = true;
      nodes.push(pseudoNode);
    }
    function boundsGeometry(object) {
      var pseudoWay = _.clone(object);
      pseudoWay.nodes = [];
      function addPseudoNode(lat,lon,i) {
        var pseudoNode = {
          type:"node",
          id:  "_"+pseudoWay.type+"/"+pseudoWay.id+"bounds"+i,
          lat: lat,
          lon: lon
        }
        pseudoWay.nodes.push(pseudoNode.id);
        nodes.push(pseudoNode);
      }
      addPseudoNode(pseudoWay.bounds.minlat,pseudoWay.bounds.minlon,1);
      addPseudoNode(pseudoWay.bounds.maxlat,pseudoWay.bounds.minlon,2);
      addPseudoNode(pseudoWay.bounds.maxlat,pseudoWay.bounds.maxlon,3);
      addPseudoNode(pseudoWay.bounds.minlat,pseudoWay.bounds.maxlon,4);
      pseudoWay.nodes.push(pseudoWay.nodes[0]);
      pseudoWay.__is_bounds_placeholder = true;
      ways.push(pseudoWay);
    }
    function fullGeometryWay(way) {
      function addFullGeometryNode(lat,lon,id) {
        var geometryNode = {
          type:"node",
          id:  id,
          lat: lat,
          lon: lon,
          __is_uninteresting: true
        }
        nodes.push(geometryNode);
      }
      if (!_.isArray(way.nodes)) {
        way.nodes = way.geometry.map(function(nd) {
          if (nd !== null) // have to skip ref-less nodes
            return "_anonymous@"+nd.lat+"/"+nd.lon;
          else
            return "_anonymous@unknown_location";
        });
      }
      way.geometry.forEach(function(nd, i) {
        if (nd) {
          addFullGeometryNode(
            nd.lat,
            nd.lon,
            way.nodes[i]
          );
        }
      });
    }
    function fullGeometryRelation(rel) {
      function addFullGeometryNode(lat,lon,id) {
        var geometryNode = {
          type:"node",
          id:  id,
          lat: lat,
          lon: lon
        }
        nodes.push(geometryNode);
      }
      function addFullGeometryWay(geometry,id) {
        // shared multipolygon ways cannot be defined multiple times with the same id.
        if (ways.some(function (way) { // todo: this is slow :(
          return way.type == "way" && way.id == id;
        })) return;
        var geometryWay = {
          type: "way",
          id:   id,
          nodes:[]
        }
        function addFullGeometryWayPseudoNode(lat,lon) {
          // todo? do not save the same pseudo node multiple times
          var geometryPseudoNode = {
            type:"node",
            id:  "_anonymous@"+lat+"/"+lon,
            lat: lat,
            lon: lon,
            __is_uninteresting: true
          }
          geometryWay.nodes.push(geometryPseudoNode.id);
          nodes.push(geometryPseudoNode);
        }
        geometry.forEach(function(nd) {
          if (nd) {
            addFullGeometryWayPseudoNode(
              nd.lat,
              nd.lon
            );
          } else {
            geometryWay.nodes.push(undefined);
          }
        });
        ways.push(geometryWay);
      }
      rel.members.forEach(function(member, i) {
        if (member.type == "node") {
          if (member.lat) {
            addFullGeometryNode(
              member.lat,
              member.lon,
              member.ref
            );
          }
        } else if (member.type == "way") {
          if (member.geometry) {
            member.ref = "_fullGeom"+member.ref;
            addFullGeometryWay(
              member.geometry,
              member.ref
            );
          }
        }
      });
    }
    // create copies of individual json objects to make sure the original data doesn't get altered
    // todo: cloning is slow: see if this can be done differently!
    for (var i=0;i<json.elements.length;i++) {
      switch (json.elements[i].type) {
      case "node":
        var node = json.elements[i];
        nodes.push(node);
      break;
      case "way":
        var way = _.clone(json.elements[i]);
        way.nodes = _.clone(way.nodes);
        ways.push(way);
        if (way.center)
          centerGeometry(way);
        if (way.geometry)
          fullGeometryWay(way);
        else if (way.bounds)
          boundsGeometry(way);
      break;
      case "relation":
        var rel = _.clone(json.elements[i]);
        rel.members = _.clone(rel.members);
        rels.push(rel);
        var has_full_geometry = rel.members && rel.members.some(function (member) {
          return member.type == "node" && member.lat ||
                 member.type == "way"  && member.geometry && member.geometry.length > 0
        });
        if (rel.center)
          centerGeometry(rel);
        if (has_full_geometry)
          fullGeometryRelation(rel);
        else if (rel.bounds)
          boundsGeometry(rel);
      break;
      default:
      // type=area (from coord-query) is an example for this case.
      }
    }
    return _convert2geoJSON(nodes,ways,rels);
  }
  function _osmXML2geoJSON(xml) {
    // sort elements
    var nodes = new Array();
    var ways  = new Array();
    var rels  = new Array();
    // helper function
    function copy_attribute( x, o, attr ) {
      if (x.hasAttribute(attr))
        o[attr] = x.getAttribute(attr);
    }
    function centerGeometry(object, centroid) {
      var pseudoNode = _.clone(object);
      copy_attribute(centroid, pseudoNode, 'lat');
      copy_attribute(centroid, pseudoNode, 'lon');
      pseudoNode.__is_center_placeholder = true;
      nodes.push(pseudoNode);
    }
    function boundsGeometry(object, bounds) {
      var pseudoWay = _.clone(object);
      pseudoWay.nodes = [];
      function addPseudoNode(lat,lon,i) {
        var pseudoNode = {
          type:"node",
          id:  "_"+pseudoWay.type+"/"+pseudoWay.id+"bounds"+i,
          lat: lat,
          lon: lon
        }
        pseudoWay.nodes.push(pseudoNode.id);
        nodes.push(pseudoNode);
      }
      addPseudoNode(bounds.getAttribute('minlat'),bounds.getAttribute('minlon'),1);
      addPseudoNode(bounds.getAttribute('maxlat'),bounds.getAttribute('minlon'),2);
      addPseudoNode(bounds.getAttribute('maxlat'),bounds.getAttribute('maxlon'),3);
      addPseudoNode(bounds.getAttribute('minlat'),bounds.getAttribute('maxlon'),4);
      pseudoWay.nodes.push(pseudoWay.nodes[0]);
      pseudoWay.__is_bounds_placeholder = true;
      ways.push(pseudoWay);
    }
    function fullGeometryWay(way, nds) {
      function addFullGeometryNode(lat,lon,id) {
        var geometryNode = {
          type:"node",
          id:  id,
          lat: lat,
          lon: lon,
          __is_uninteresting: true
        }
        nodes.push(geometryNode);
        return geometryNode.id;
      }
      if (!_.isArray(way.nodes)) {
        way.nodes = [];
        _.each( nds, function( nd, i ) {
          way.nodes.push("_anonymous@"+nd.getAttribute('lat')+"/"+nd.getAttribute('lon'));
        });
      }
      _.each( nds, function( nd, i ) {
        if (nd.getAttribute('lat')) {
          addFullGeometryNode(
            nd.getAttribute('lat'),
            nd.getAttribute('lon'),
            way.nodes[i]
          );
        }
      });
    }
    function fullGeometryRelation(rel, members) {
      function addFullGeometryNode(lat,lon,id) {
        var geometryNode = {
          type:"node",
          id:  id,
          lat: lat,
          lon: lon
        }
        nodes.push(geometryNode);
      }
      function addFullGeometryWay(nds,id) {
        // shared multipolygon ways cannot be defined multiple times with the same id.
        if (ways.some(function (way) { // todo: this is slow :(
          return way.type == "way" && way.id == id;
        })) return;
        var geometryWay = {
          type: "way",
          id:   id,
          nodes:[]
        }
        function addFullGeometryWayPseudoNode(lat,lon) {
          // todo? do not save the same pseudo node multiple times
          var geometryPseudoNode = {
            type:"node",
            id:  "_anonymous@"+lat+"/"+lon,
            lat: lat,
            lon: lon,
            __is_uninteresting: true
          }
          geometryWay.nodes.push(geometryPseudoNode.id);
          nodes.push(geometryPseudoNode);
        }
        _.each(nds, function(nd) {
          if (nd.getAttribute('lat')) {
            addFullGeometryWayPseudoNode(
              nd.getAttribute('lat'),
              nd.getAttribute('lon')
            );
          } else {
            geometryWay.nodes.push(undefined);
          }
        });
        ways.push(geometryWay);
      }
      _.each( members, function( member, i ) {
        if (rel.members[i].type == "node") {
          if (member.getAttribute('lat')) {
            addFullGeometryNode(
              member.getAttribute('lat'),
              member.getAttribute('lon'),
              rel.members[i].ref
            );
          }
        } else if (rel.members[i].type == "way") {
          if (member.getElementsByTagName('nd').length > 0) {
            rel.members[i].ref = "_fullGeom"+rel.members[i].ref;
            addFullGeometryWay(
              member.getElementsByTagName('nd'),
              rel.members[i].ref
            );
          }
        }
      });
    }
    // nodes
    _.each( xml.getElementsByTagName('node'), function( node, i ) {
      var tags = {};
      _.each( node.getElementsByTagName('tag'), function( tag ) {
        tags[tag.getAttribute('k')] = tag.getAttribute('v');
      });
      var nodeObject = {
        'type': 'node'
      };
      copy_attribute( node, nodeObject, 'id' );
      copy_attribute( node, nodeObject, 'lat' );
      copy_attribute( node, nodeObject, 'lon' );
      copy_attribute( node, nodeObject, 'version' );
      copy_attribute( node, nodeObject, 'timestamp' );
      copy_attribute( node, nodeObject, 'changeset' );
      copy_attribute( node, nodeObject, 'uid' );
      copy_attribute( node, nodeObject, 'user' );
      if (!_.isEmpty(tags))
        nodeObject.tags = tags;
      nodes.push(nodeObject);
    });
    // ways
    var centroid,bounds;
    _.each( xml.getElementsByTagName('way'), function( way, i ) {
      var tags = {};
      var wnodes = [];
      _.each( way.getElementsByTagName('tag'), function( tag ) {
        tags[tag.getAttribute('k')] = tag.getAttribute('v');
      });
      var has_full_geometry = false;
      _.each( way.getElementsByTagName('nd'), function( nd, i ) {
        var id;
        if (id = nd.getAttribute('ref'))
          wnodes[i] = id;
        if (!has_full_geometry && nd.getAttribute('lat'))
          has_full_geometry = true;
      });
      var wayObject = {
        "type": "way"
      };
      copy_attribute( way, wayObject, 'id' );
      copy_attribute( way, wayObject, 'version' );
      copy_attribute( way, wayObject, 'timestamp' );
      copy_attribute( way, wayObject, 'changeset' );
      copy_attribute( way, wayObject, 'uid' );
      copy_attribute( way, wayObject, 'user' );
      if (wnodes.length > 0)
        wayObject.nodes = wnodes;
      if (!_.isEmpty(tags))
        wayObject.tags = tags;
      if (centroid = way.getElementsByTagName('center')[0])
        centerGeometry(wayObject,centroid);
      if (has_full_geometry)
        fullGeometryWay(wayObject, way.getElementsByTagName('nd'));
      else if (bounds = way.getElementsByTagName('bounds')[0])
        boundsGeometry(wayObject,bounds);
      ways.push(wayObject);
    });
    // relations
    _.each( xml.getElementsByTagName('relation'), function( relation, i ) {
      var tags = {};
      var members = [];
      _.each( relation.getElementsByTagName('tag'), function( tag ) {
        tags[tag.getAttribute('k')] = tag.getAttribute('v');
      });
      var has_full_geometry = false;
      _.each( relation.getElementsByTagName('member'), function( member, i ) {
        members[i] = {};
        copy_attribute( member, members[i], 'ref' );
        copy_attribute( member, members[i], 'role' );
        copy_attribute( member, members[i], 'type' );
        if (!has_full_geometry &&
             (members[i].type == 'node' && member.getAttribute('lat')) ||
             (members[i].type == 'way'  && member.getElementsByTagName('nd').length>0) )
          has_full_geometry = true;
      });
      var relObject = {
        "type": "relation"
      }
      copy_attribute( relation, relObject, 'id' );
      copy_attribute( relation, relObject, 'version' );
      copy_attribute( relation, relObject, 'timestamp' );
      copy_attribute( relation, relObject, 'changeset' );
      copy_attribute( relation, relObject, 'uid' );
      copy_attribute( relation, relObject, 'user' );
      if (members.length > 0)
        relObject.members = members;
      if (!_.isEmpty(tags))
        relObject.tags = tags;
      if (centroid = relation.getElementsByTagName('center')[0])
        centerGeometry(relObject,centroid);
      if (has_full_geometry)
        fullGeometryRelation(relObject, relation.getElementsByTagName('member'));
      else if (bounds = relation.getElementsByTagName('bounds')[0])
        boundsGeometry(relObject,bounds);
      rels.push(relObject);
    });
    return _convert2geoJSON(nodes,ways,rels);
  }
  function _convert2geoJSON(nodes,ways,rels) {

    // helper function that checks if there are any tags other than "created_by", "source", etc. or any tag provided in ignore_tags
    function has_interesting_tags(t, ignore_tags) {
      if (typeof ignore_tags !== "object")
        ignore_tags={};
      if (typeof options.uninterestingTags === "function")
        return !options.uninterestingTags(t, ignore_tags);
      for (var k in t)
        if (!(options.uninterestingTags[k]===true) &&
            !(ignore_tags[k]===true || ignore_tags[k]===t[k]))
          return true;
      return false;
    };
    // helper function to extract meta information
    function build_meta_information(object) {
      var res = {
        "timestamp": object.timestamp,
        "version": object.version,
        "changeset": object.changeset,
        "user": object.user,
        "uid": object.uid
      };
      for (var k in res)
        if (res[k] === undefined)
          delete res[k];
      return res;
    }

    // some data processing (e.g. filter nodes only used for ways)
    var nodeids = new Object();
    for (var i=0;i<nodes.length;i++) {
      if (nodes[i].lat === undefined) {
        if (options.verbose) console.warn('Node',nodes[i].type+'/'+nodes[i].id,'ignored because it has no coordinates');
        continue; // ignore nodes without coordinates (e.g. returned by an ids_only query)
      }
      nodeids[nodes[i].id] = nodes[i];
    }
    var poinids = new Object();
    for (var i=0;i<nodes.length;i++) {
      if (typeof nodes[i].tags != 'undefined' &&
          has_interesting_tags(nodes[i].tags)) // this checks if the node has any tags other than "created_by"
        poinids[nodes[i].id] = true;
    }
    for (var i=0;i<rels.length;i++) {
      if (!_.isArray(rels[i].members)) {
        if (options.verbose) console.warn('Relation',rels[i].type+'/'+rels[i].id,'ignored because it has no members');
        continue; // ignore relations without members (e.g. returned by an ids_only query)
      }
      for (var j=0;j<rels[i].members.length;j++) {
        if (rels[i].members[j].type == "node")
          poinids[rels[i].members[j].ref] = true;
      }
    }
    var wayids = new Object();
    var waynids = new Object();
    for (var i=0;i<ways.length;i++) {
      if (!_.isArray(ways[i].nodes)) {
        if (options.verbose) console.warn('Way',ways[i].type+'/'+ways[i].id,'ignored because it has no nodes');
        continue; // ignore ways without nodes (e.g. returned by an ids_only query)
      }
      wayids[ways[i].id] = ways[i];
      for (var j=0;j<ways[i].nodes.length;j++) {
        waynids[ways[i].nodes[j]] = true;
        ways[i].nodes[j] = nodeids[ways[i].nodes[j]];
      }
    }
    var pois = new Array();
    for (var i=0;i<nodes.length;i++) {
      if (((!waynids[nodes[i].id]) ||
          (poinids[nodes[i].id])) &&
          !nodes[i].__is_uninteresting)
        pois.push(nodes[i]);
    }
    var relids = new Array();
    for (var i=0;i<rels.length;i++) {
      if (!_.isArray(rels[i].members)) {
        if (options.verbose) console.warn('Relation',rels[i].type+'/'+rels[i].id,'ignored because it has no members');
        continue; // ignore relations without members (e.g. returned by an ids_only query)
      }
      relids[rels[i].id] = rels[i];
    }
    var relsmap = {node: {}, way: {}, relation: {}};
    for (var i=0;i<rels.length;i++) {
      if (!_.isArray(rels[i].members)) {
        if (options.verbose) console.warn('Relation',rels[i].type+'/'+rels[i].id,'ignored because it has no members');
        continue; // ignore relations without members (e.g. returned by an ids_only query)
      }
      for (var j=0;j<rels[i].members.length;j++) {
        var m_type = rels[i].members[j].type;
        var m_ref = rels[i].members[j].ref;
        if (typeof m_ref !== "number") {
          // de-namespace full geometry content
          m_ref = m_ref.replace("_fullGeom", "");
        }
        if (!relsmap[m_type]) {
          if (options.verbose) console.warn('Relation',rels[i].type+'/'+rels[i].id,'member',m_type+'/'+m_ref,'ignored because it has an invalid type');
          continue;
        }
        if (typeof relsmap[m_type][m_ref] === "undefined")
          relsmap[m_type][m_ref] = [];
        relsmap[m_type][m_ref].push({
          "role" : rels[i].members[j].role,
          "rel" : rels[i].id,
          "reltags" : rels[i].tags,
        });
      }
    }
    // construct geojson
    var geojson;
    var geojsonnodes = {
      "type"     : "FeatureCollection",
      "features" : new Array()};
    for (i=0;i<pois.length;i++) {
      if (typeof pois[i].lon == "undefined" || typeof pois[i].lat == "undefined") {
        if (options.verbose) console.warn('POI',pois[i].type+'/'+pois[i].id,'ignored because it lacks coordinates');
        continue; // lon and lat are required for showing a point
      }
      var feature = {
        "type"       : "Feature",
        "id"         : pois[i].type+"/"+pois[i].id,
        "properties" : {
          "type" : pois[i].type,
          "id"   : pois[i].id,
          "tags" : pois[i].tags || {},
          "relations" : relsmap["node"][pois[i].id] || [],
          "meta": build_meta_information(pois[i])
        },
        "geometry"   : {
          "type" : "Point",
          "coordinates" : [+pois[i].lon, +pois[i].lat],
        }
      };
      if (pois[i].__is_center_placeholder)
        feature.properties["geometry"] = "center";
      geojsonnodes.features.push(feature);
    }
    var geojsonlines = {
      "type"     : "FeatureCollection",
      "features" : new Array()};
    var geojsonpolygons = {
      "type"     : "FeatureCollection",
      "features" : new Array()};
    // process multipolygons
    for (var i=0;i<rels.length;i++) {
      if ((typeof rels[i].tags != "undefined") &&
          (rels[i].tags["type"] == "multipolygon" || rels[i].tags["type"] == "boundary")) {
        if (!_.isArray(rels[i].members)) {
          if (options.verbose) console.warn('Multipolygon',rels[i].type+'/'+rels[i].id,'ignored because it has no members');
          continue; // ignore relations without members (e.g. returned by an ids_only query)
        }
        var outer_count = 0;
        for (var j=0;j<rels[i].members.length;j++)
          if (rels[i].members[j].role == "outer")
            outer_count++;
          else if (options.verbose && rels[i].members[j].role != "inner")
            console.warn('Multipolygon',rels[i].type+'/'+rels[i].id,'member',rels[i].members[j].type+'/'+rels[i].members[j].ref,'ignored because it has an invalid role: "' + rels[i].members[j].role + '"');
        rels[i].members.forEach(function(m) {
          if (wayids[m.ref]) {
            // this even works in the following corner case:
            // a multipolygon amenity=xxx with outer line tagged amenity=yyy
            // see https://github.com/tyrasd/osmtogeojson/issues/7
            if (m.role==="outer" && !has_interesting_tags(wayids[m.ref].tags,rels[i].tags))
              wayids[m.ref].is_multipolygon_outline = true;
            if (m.role==="inner" && !has_interesting_tags(wayids[m.ref].tags))
              wayids[m.ref].is_multipolygon_outline = true;
          }
        });
        if (outer_count == 0) {
          if (options.verbose) console.warn('Multipolygon relation',rels[i].type+'/'+rels[i].id,'ignored because it has no outer ways');
          continue; // ignore multipolygons without outer ways
        }
        var simple_mp = false;
        var mp_geometry = '';
        if (outer_count == 1 && !has_interesting_tags(rels[i].tags, {"type":true}))
          simple_mp = true;
        var feature = null;
        if (!simple_mp) {
          feature = construct_multipolygon(rels[i], rels[i]);
        } else {
          // simple multipolygon
          var outer_way = rels[i].members.filter(function(m) {return m.role === "outer";})[0];
          outer_way = wayids[outer_way.ref];
          if (outer_way === undefined) {
            if (options.verbose) console.warn('Multipolygon relation',rels[i].type+'/'+rels[i].id,'ignored because outer way', outer_way.type+'/'+outer_way.ref,'is missing');
            continue; // abort if outer way object is not present
          }
          outer_way.is_multipolygon_outline = true;
          feature = construct_multipolygon(outer_way, rels[i]);
        }
        if (feature === false) {
          if (options.verbose) console.warn('Multipolygon relation',rels[i].type+'/'+rels[i].id,'ignored because it has invalid geometry');
          continue; // abort if feature could not be constructed
        }
        geojsonpolygons.features.push(feature);
        function construct_multipolygon(tag_object, rel) {
          var is_tainted = false;
          var mp_geometry = simple_mp ? 'way' : 'relation',
              mp_id = typeof tag_object.id === "number" ? tag_object.id : +(tag_object.id.replace("_fullGeom", ""));
          // prepare mp members
          var members;
          members = rel.members.filter(function(m) {return m.type === "way";});
          members = members.map(function(m) {
            var way = wayids[m.ref];
            if (way === undefined) { // check for missing ways
              if (options.verbose) console.warn('Multipolygon', mp_geometry+'/'+mp_id, 'tainted by a missing way', m.type+'/'+m.ref);
              is_tainted = true;
              return;
            }
            return { // TODO: this is slow! :(
              id: m.ref,
              role: m.role || "outer",
              way: way,
              nodes: way.nodes.filter(function(n) {
                if (n !== undefined)
                  return true;
                is_tainted = true;
                if (options.verbose) console.warn('Multipolygon', mp_geometry+'/'+mp_id,  'tainted by a way', m.type+'/'+m.ref, 'with a missing node');
                return false;
              })
            };
          });
          members = _.compact(members);
          // construct outer and inner rings
          var outers, inners;
          function join(ways) {
            var _first = function(arr) {return arr[0]};
            var _last  = function(arr) {return arr[arr.length-1]};
            // stolen from iD/relation.js
            var joined = [], current, first, last, i, how, what;
            while (ways.length) {
              current = ways.pop().nodes.slice();
              joined.push(current);
              while (ways.length && _first(current) !== _last(current)) {
                first = _first(current);
                last  = _last(current);
                for (i = 0; i < ways.length; i++) {
                  what = ways[i].nodes;
                  if (last === _first(what)) {
                    how  = current.push;
                    what = what.slice(1);
                    break;
                  } else if (last === _last(what)) {
                    how  = current.push;
                    what = what.slice(0, -1).reverse();
                    break;
                  } else if (first == _last(what)) {
                    how  = current.unshift;
                    what = what.slice(0, -1);
                    break;
                  } else if (first == _first(what)) {
                    how  = current.unshift;
                    what = what.slice(1).reverse();
                    break;
                  } else {
                    what = how = null;
                  }
                }
                if (!what) {
                  if (options.verbose) console.warn('Multipolygon', mp_geometry+'/'+mp_id, 'contains unclosed ring geometry');
                  break; // Invalid geometry (dangling way, unclosed ring)
                }
                ways.splice(i, 1);
                how.apply(current, what);
              }
            }
            return joined;
          }
          outers = join(members.filter(function(m) {return m.role==="outer";}));
          inners = join(members.filter(function(m) {return m.role==="inner";}));
          // sort rings
          var mp;
          function findOuter(inner) {
            var polygonIntersectsPolygon = function(outer, inner) {
              for (var i=0; i<inner.length; i++)
                if (pointInPolygon(inner[i], outer))
                  return true;
              return false;
            }
            var mapCoordinates = function(from) {
              return from.map(function(n) {
                return [+n.lat,+n.lon];
              });
            }
            // stolen from iD/geo.js,
            // based on https://github.com/substack/point-in-polygon,
            // ray-casting algorithm based on http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
            var pointInPolygon = function(point, polygon) {
              var x = point[0], y = point[1], inside = false;
              for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                var xi = polygon[i][0], yi = polygon[i][1];
                var xj = polygon[j][0], yj = polygon[j][1];
                var intersect = ((yi > y) != (yj > y)) &&
                  (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
              }
              return inside;
            };
            // stolen from iD/relation.js
            var o, outer;
            // todo: all this coordinate mapping makes this unneccesarily slow.
            // see the "todo: this is slow! :(" above.
            inner = mapCoordinates(inner);
            /*for (o = 0; o < outers.length; o++) {
              outer = mapCoordinates(outers[o]);
              if (polygonContainsPolygon(outer, inner))
                return o;
            }*/
            for (o = 0; o < outers.length; o++) {
              outer = mapCoordinates(outers[o]);
              if (polygonIntersectsPolygon(outer, inner))
                return o;
            }
          }
          mp = outers.map(function(o) {return [o];});
          for (var j=0; j<inners.length; j++) {
            var o = findOuter(inners[j]);
            if (o !== undefined)
              mp[o].push(inners[j]);
            else
              if (options.verbose) console.warn('Multipolygon', mp_geometry+'/'+mp_id, 'contains an inner ring with no containing outer');
              // so, no outer ring for this inner ring is found.
              // We're going to ignore holes in empty space.
              ;
          }
          // sanitize mp-coordinates (remove empty clusters or rings, {lat,lon,...} to [lon,lat]
          var mp_coords = [];
          mp_coords = _.compact(mp.map(function(cluster) {
            var cl = _.compact(cluster.map(function(ring) {
              if (ring.length < 4) { // todo: is this correct: ring.length < 4 ?
                if (options.verbose) console.warn('Multipolygon', mp_geometry+'/'+mp_id, 'contains a ring with less than four nodes');
                return;
              }
              return _.compact(ring.map(function(node) {
                return [+node.lon,+node.lat];
              }));
            }));
            if (cl.length == 0) {
              if (options.verbose) console.warn('Multipolygon', mp_geometry+'/'+mp_id, 'contains an empty ring cluster');
              return;
            }
            return cl;
          }));

          if (mp_coords.length == 0) {
            if (options.verbose) console.warn('Multipolygon', mp_geometry+'/'+mp_id, 'contains no coordinates');
            return false; // ignore multipolygons without coordinates
          }
          var mp_type = "MultiPolygon";
          if (mp_coords.length === 1) {
            mp_type = "Polygon";
            mp_coords = mp_coords[0];
          }
          // mp parsed, now construct the geoJSON
          var feature = {
            "type"       : "Feature",
            "id"         : tag_object.type+"/"+mp_id,
            "properties" : {
              "type" : tag_object.type,
              "id"   : mp_id,
              "tags" : tag_object.tags || {},
              "relations" :  relsmap[tag_object.type][tag_object.id] || [],
              "meta": build_meta_information(tag_object)
            },
            "geometry"   : {
              "type" : mp_type,
              "coordinates" : mp_coords,
            }
          }
          if (is_tainted) {
            if (options.verbose) console.warn('Multipolygon', mp_geometry+'/'+mp_id, 'is tainted');
            feature.properties["tainted"] = true;
          }
          return feature;
        }
      }
    }
    // process lines and polygons
    for (var i=0;i<ways.length;i++) {
      if (!_.isArray(ways[i].nodes)) {
        if (options.verbose) console.warn('Way',ways[i].type+'/'+ways[i].id,'ignored because it has no nodes');
        continue; // ignore ways without nodes (e.g. returned by an ids_only query)
      }
      if (ways[i].is_multipolygon_outline)
        continue; // ignore ways which are already rendered as (part of) a multipolygon
      if (typeof ways[i].id !== "number") {
        // remove full geometry namespace for output
        ways[i].id = +ways[i].id.replace("_fullGeom", "");
      }
      ways[i].tainted = false;
      ways[i].hidden = false;
      var coords = new Array();
      for (j=0;j<ways[i].nodes.length;j++) {
        if (typeof ways[i].nodes[j] == "object")
          coords.push([+ways[i].nodes[j].lon, +ways[i].nodes[j].lat]);
        else {
          if (options.verbose) console.warn('Way',ways[i].type+'/'+ways[i].id,'is tainted by an invalid node');
          ways[i].tainted = true;
        }
      }
      if (coords.length <= 1) { // invalid way geometry
        if (options.verbose) console.warn('Way',ways[i].type+'/'+ways[i].id,'ignored because it contains too few nodes');
        continue;
      }
      var way_type = "LineString"; // default
      if (typeof ways[i].nodes[0] != "undefined" && // way has its nodes loaded
        ways[i].nodes[0] === ways[i].nodes[ways[i].nodes.length-1] && // ... and forms a closed ring
        (
          typeof ways[i].tags != "undefined" && // ... and has tags
          _isPolygonFeature(ways[i].tags) // ... and tags say it is a polygon
          || // or is a placeholder for a bounds geometry
          ways[i].__is_bounds_placeholder
        )
      ) {
        way_type = "Polygon";
        coords = [coords];
      }
      var feature = {
        "type"       : "Feature",
        "id"         : ways[i].type+"/"+ways[i].id,
        "properties" : {
          "type" : ways[i].type,
          "id"   : ways[i].id,
          "tags" : ways[i].tags || {},
          "relations" : relsmap["way"][ways[i].id] || [],
          "meta": build_meta_information(ways[i])
        },
        "geometry"   : {
          "type" : way_type,
          "coordinates" : coords,
        }
      }
      if (ways[i].tainted) {
        if (options.verbose) console.warn('Way',ways[i].type+'/'+ways[i].id,'is tainted');
        feature.properties["tainted"] = true;
      }
      if (ways[i].__is_bounds_placeholder)
        feature.properties["geometry"] = "bounds";
      if (way_type == "LineString")
        geojsonlines.features.push(feature);
      else
        geojsonpolygons.features.push(feature);
    }

    geojson = {
      "type": "FeatureCollection",
      "features": []
    };
    geojson.features = geojson.features.concat(geojsonpolygons.features);
    geojson.features = geojson.features.concat(geojsonlines.features);
    geojson.features = geojson.features.concat(geojsonnodes.features);
    // optionally, flatten properties
    if (options.flatProperties) {
      geojson.features.forEach(function(f) {
        f.properties = _.merge(
          f.properties.meta,
          f.properties.tags,
          {id: f.properties.type+"/"+f.properties.id}
        );
      });
    }
    // fix polygon winding
    geojson = rewind(geojson, true /*remove for geojson-rewind >0.1.0*/);
    return geojson;
  }
  function _isPolygonFeature( tags ) {
    var polygonFeatures = options.polygonFeatures;
    if (typeof polygonFeatures === "function")
      return polygonFeatures(tags);
    // explicitely tagged non-areas
    if ( tags['area'] === 'no' )
      return false;
    // assuming that a typical OSM way has in average less tags than
    // the polygonFeatures list, this way around should be faster
    for ( var key in tags ) {
      var val = tags[key];
      var pfk = polygonFeatures[key];
      // continue with next if tag is unknown or not "categorizing"
      if ( typeof pfk === 'undefined' )
        continue;
      // continue with next if tag is explicitely un-set ("building=no")
      if ( val === 'no' )
        continue;
      // check polygon features for: general acceptance, included or excluded values
      if ( pfk === true )
        return true;
      if ( pfk.included_values && pfk.included_values[val] === true )
        return true;
      if ( pfk.excluded_values && pfk.excluded_values[val] !== true )
        return true;
    }
    // if no tags matched, this ain't no area.
    return false;
  }
};

// for backwards compatibility
osmtogeojson.toGeojson = osmtogeojson;

module.exports = osmtogeojson;
