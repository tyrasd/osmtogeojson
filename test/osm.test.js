describe("osm (xml)", function () {

  it('blank osm', function() {
    var xml = "<osm></osm>";
    xml = (new DOMParser()).parseFromString(xml, 'text/xml');

    expect(osmtogeojson.toGeojson(xml)).to.eql({
      type: 'FeatureCollection',
      features: []
    });
  });

  it('node', function() {
    var xml, geojson;

    xml = "<osm><node id='1' lat='1.234' lon='4.321' /></osm>";
    xml = (new DOMParser()).parseFromString(xml, 'text/xml');
    geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "node/1",
          properties: {
            type: "node",
            id: 1,
            tags: {},
            relations: [],
            meta: {}
          },
          geometry: {
            type: "Point",
            coordinates: [4.321, 1.234]
          }
        }
      ]
    };

    expect(osmtogeojson.toGeojson(xml)).to.eql(geojson);
  });

  it('way', function() {
    var xml, geojson;

    xml = "<osm><way id='1'><nd ref='2' /><nd ref='3' /><nd ref='4' /></way><node id='2' lat='0.0' lon='1.0' /><node id='3' lat='0.0' lon='1.1' /><node id='4' lat='0.1' lon='1.2' /></osm>";
    xml = (new DOMParser()).parseFromString(xml, 'text/xml');
    geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "way/1",
          properties: {
            type: "way",
            id: 1,
            tags: {},
            relations: [],
            meta: {}
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [1.0,0.0],
              [1.1,0.0],
              [1.2,0.1],
            ]
          }
        }
      ]
    };

    expect(osmtogeojson.toGeojson(xml)).to.eql(geojson);
  });

  it('relation', function() {
    var xml, geojson;

    xml = "<osm><relation id='1'><tag k='type' v='multipolygon' /><member type='way' ref='2' role='outer' /><member type='way' ref='3' role='inner' /></relation><way id='2'><tag k='area' v='yes' /><nd ref='4' /><nd ref='5' /><nd ref='6' /><nd ref='7' /><nd ref='4' /></way><way id='3'><nd ref='8' /><nd ref='9' /><nd ref='10' /><nd ref='8' /></way><node id='4' lat='-1.0' lon='-1.0' /><node id='5' lat='-1.0' lon='1.0' /><node id='6' lat='1.0' lon='1.0' /><node id='7' lat='1.0' lon='-1.0' /><node id='8' lat='-0.5' lon='0.0' /><node id='9' lat='0.5' lon='0.0' /><node id='10' lat='0.0' lon='0.5' /></osm>";
    xml = (new DOMParser()).parseFromString(xml, 'text/xml');
    
    geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "way/2",
          properties: {
            type: "way",
            id: 2,
            tags: {"area":"yes"},
            relations: [
              {
                rel: 1,
                role: "outer",
                reltags: {"type":"multipolygon"}
              }
            ],
            meta: {}
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-1.0,-1.0],
              [ 1.0,-1.0],
              [ 1.0, 1.0],
              [-1.0, 1.0],
              [-1.0,-1.0],
            ],[
              [0.0,-0.5],
              [0.0, 0.5],
              [0.5, 0.0],
              [0.0,-0.5]
            ]]
          }
        }
      ]
    };

    expect(osmtogeojson.toGeojson(xml)).to.eql(geojson);
  });


});

describe("osm (json)", function () {
  // check overpass*2geoJSON methods
  it("node", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type: "node",
          id:   1,
          lat:  1.234,
          lon:  4.321
        }
      ]
    };
    geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "node/1",
          properties: {
            type: "node",
            id: 1,
            tags: {},
            relations: [],
            meta: {}
          },
          geometry: {
            type: "Point",
            coordinates: [4.321, 1.234]
          }
        }
      ]
    };
    var result = osmtogeojson.toGeojson(json);
    expect(result).to.eql(geojson);
  });
  it("way", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type:  "way",
          id:    1,
          nodes: [2,3,4]
        },
        {
          type: "node",
          id:   2,
          lat:  0.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   3,
          lat:  0.0,
          lon:  1.1
        },
        {
          type: "node",
          id:   4,
          lat:  0.1,
          lon:  1.2
        }
      ]
    };
    geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "way/1",
          properties: {
            type: "way",
            id: 1,
            tags: {},
            relations: [],
            meta: {}
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [1.0,0.0],
              [1.1,0.0],
              [1.2,0.1],
            ]
          }
        }
      ]
    };
    var result = osmtogeojson.toGeojson(json);
    expect(result).to.eql(geojson);
  });
  it("polygon", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type:  "way",
          id:    1,
          nodes: [2,3,4,5,2],
          tags:  {area: "yes"}
        },
        {
          type: "node",
          id:   2,
          lat:  0.0,
          lon:  0.0
        },
        {
          type: "node",
          id:   3,
          lat:  0.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   4,
          lat:  1.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   5,
          lat:  1.0,
          lon:  0.0
        }
      ]
    };
    geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "way/1",
          properties: {
            type: "way",
            id: 1,
            tags: {area: "yes"},
            relations: [],
            meta: {}
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [0.0,0.0],
              [1.0,0.0],
              [1.0,1.0],
              [0.0,1.0],
              [0.0,0.0],
            ]]
          }
        }
      ]
    };
    var result = osmtogeojson.toGeojson(json);
    expect(result).to.eql(geojson);
  });
  it("simple multipolygon", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type:    "relation",
          id:      1,
          tags:    {"type":"multipolygon"},
          members: [
            {
              type: "way",
              ref:  2,
              role: "outer"
            },
            {
              type: "way",
              ref:  3,
              role: "inner"
            }
          ]
        },
        {
          type:  "way",
          id:    2,
          nodes: [4,5,6,7,4],
          tags:  {"area":"yes"},
        },
        {
          type:  "way",
          id:    3,
          nodes: [8,9,10,8]
        },
        {
          type: "node",
          id:   4,
          lat: -1.0,
          lon: -1.0
        },
        {
          type: "node",
          id:   5,
          lat: -1.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   6,
          lat:  1.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   7,
          lat:  1.0,
          lon: -1.0
        },
        {
          type: "node",
          id:   8,
          lat: -0.5,
          lon:  0.0
        },
        {
          type: "node",
          id:   9,
          lat:  0.5,
          lon:  0.0
        },
        {
          type: "node",
          id:   10,
          lat:  0.0,
          lon:  0.5
        }
      ]
    };
    geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "way/2",
          properties: {
            type: "way",
            id: 2,
            tags: {"area":"yes"},
            relations: [
              {
                rel: 1,
                role: "outer",
                reltags: {"type":"multipolygon"}
              }
            ],
            meta: {}
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-1.0,-1.0],
              [ 1.0,-1.0],
              [ 1.0, 1.0],
              [-1.0, 1.0],
              [-1.0,-1.0],
            ],[
              [0.0,-0.5],
              [0.0, 0.5],
              [0.5, 0.0],
              [0.0,-0.5]
            ]]
          }
        }
      ]
    };
    var result = osmtogeojson.toGeojson(json);
    expect(result).to.eql(geojson);
  });
  it("multipolygon", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type:    "relation",
          id:      1,
          tags:    {"type":"multipolygon", "building":"yes"},
          members: [
            {
              type: "way",
              ref:  2,
              role: "outer"
            },
            {
              type: "way",
              ref:  3,
              role: "inner"
            },
            {
              type: "way",
              ref:  4,
              role: "inner"
            },
            {
              type: "way",
              ref:  5,
              role: "outer"
            }
          ]
        },
        {
          type:  "way",
          id:    2,
          nodes: [4,5,6,7,4],
          tags:  {"building":"yes"}
        },
        {
          type:  "way",
          id:    3,
          nodes: [8,9,10,8],
          tags:  {"area":"yes"}
        },
        {
          type:  "way",
          id:    4,
          nodes: [11,12,13,11],
          tags:  {"barrier":"fence"}
        },
        {
          type:  "way",
          id:    5,
          nodes: [14,15,16,14],
          tags:  {"building":"yes", "area":"yes"}
        },
        {
          type: "node",
          id:   4,
          lat: -1.0,
          lon: -1.0
        },
        {
          type: "node",
          id:   5,
          lat: -1.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   6,
          lat:  1.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   7,
          lat:  1.0,
          lon: -1.0
        },
        {
          type: "node",
          id:   8,
          lat: -0.5,
          lon:  0.0
        },
        {
          type: "node",
          id:   9,
          lat:  0.5,
          lon:  0.0
        },
        {
          type: "node",
          id:   10,
          lat:  0.0,
          lon:  0.5
        },
        {
          type: "node",
          id:   11,
          lat:  0.1,
          lon:  -0.1
        },
        {
          type: "node",
          id:   12,
          lat:  -0.1,
          lon:  -0.1
        },
        {
          type: "node",
          id:   13,
          lat:  0.0,
          lon:  -0.2
        },
        {
          type: "node",
          id:   14,
          lat:  0.1,
          lon:  -1.1
        },
        {
          type: "node",
          id:   15,
          lat:  -0.1,
          lon:  -1.1
        },
        {
          type: "node",
          id:   16,
          lat:  0.0,
          lon:  -1.2
        }
      ]
    };
    geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "relation/1",
          properties: {
            type: "relation",
            id: 1,
            tags: {"type":"multipolygon","building":"yes"},
            relations: [],
            meta: {}
          },
          geometry: {
            type: "MultiPolygon",
            coordinates: [[[
              [-1.1, 0.1],
              [-1.1,-0.1],
              [-1.2, 0.0],
              [-1.1, 0.1]
            ]],
            [[
              [-1.0,-1.0],
              [ 1.0,-1.0],
              [ 1.0, 1.0],
              [-1.0, 1.0],
              [-1.0,-1.0],
            ],[
              [-0.1, 0.1],
              [-0.1,-0.1],
              [-0.2, 0.0],
              [-0.1, 0.1]
            ],[
              [0.0,-0.5],
              [0.0, 0.5],
              [0.5, 0.0],
              [0.0,-0.5]
            ]]]
          }
        },
        {
          type: "Feature",
          id: "way/3",
          properties: {
            type: "way",
            id: 3,
            tags: {"area":"yes"},
            relations: [
              {
                rel: 1,
                role: "inner",
                reltags: {"type":"multipolygon","building":"yes"}
              }
            ],
            meta: {},
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [0.0,-0.5],
              [0.0, 0.5],
              [0.5, 0.0],
              [0.0,-0.5]
            ]]
          }
        }, 
        {
          type: "Feature",
          id: "way/5",
          properties: {
            type: "way",
            id: 5,
            tags: {"building":"yes", "area":"yes"},
            relations: [
              {
                rel: 1,
                role: "outer",
                reltags: {"type":"multipolygon","building":"yes"}
              }
            ],
            meta: {},
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-1.1, 0.1],
              [-1.1,-0.1],
              [-1.2, 0.0],
              [-1.1, 0.1]
            ]]
          }
        },
        {
          type: "Feature",
          id: "way/4",
          properties: {
            type: "way",
            id: 4,
            tags: {"barrier":"fence"},
            relations: [
              {
                rel: 1,
                role: "inner",
                reltags: {"type":"multipolygon","building":"yes"}
              }
            ],
            meta: {},
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [-0.1, 0.1],
              [-0.1,-0.1],
              [-0.2, 0.0],
              [-0.1, 0.1]
            ]
          }
        }
      ]
    };
    var result = osmtogeojson.toGeojson(json);
    expect(result).to.eql(geojson);
  });
  // tainted geometries
  it("tainted geometries", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type:  "way",
          id:    10,
          nodes: [2,3,5]
        },
        {
          type:  "way",
          id:    11,
          nodes: [2,3,4,5,2],
          tags:  {"area":"yes"}
        },
        {
          type:  "way",
          id:    12,
          nodes: [2,3,4,2],
        },
        {
          type:    "relation",
          id:      100,
          tags:    {"type":"multipolygon"},
          members: [
            {
              type: "way",
              ref:  12,
              role: "outer"
            },
            {
              type: "way",
              ref:  13,
              role: "inner"
            }
          ]
        },
        {
          type: "node",
          id:   2,
          lat:  1.0,
          lon:  0.0
        },
        {
          type: "node",
          id:   3,
          lat:  0.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   4,
          lat:  1.0,
          lon:  1.0
        }
      ]
    };
    geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "way/12",
          properties: {
            type: "way",
            id: 12,
            tags: {},
            relations: [
              {
                rel: 100,
                role: "outer",
                reltags: {"type":"multipolygon"}
              }
            ],
            meta: {},
            tainted: true
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [0.0,1.0],
              [1.0,0.0],
              [1.0,1.0],
              [0.0,1.0]
            ]]
          }
        },
        {
          type: "Feature",
          id: "way/11",
          properties: {
            type: "way",
            id:   11,
            tags: {"area":"yes"},
            relations: [],
            meta: {},
            tainted: true
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [0.0,1.0],
              [1.0,0.0],
              [1.0,1.0],
              [0.0,1.0]
            ]]
          }
        },
        {
          type: "Feature",
          id: "way/10",
          properties: {
            type: "way",
            id: 10,
            tags: {},
            relations: [],
            meta: {},
            tainted: true
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [0.0,1.0],
              [1.0,0.0]
            ]
          }
        }
      ]
    };
    var result = osmtogeojson.toGeojson(json);
    expect(result).to.eql(geojson);
  });
  // tags & pois
  it("tags: ways and nodes / pois", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type:  "way",
          id:    1,
          nodes: [2,3,4],
          tags:  {"foo":"bar"}
        },
        {
          type: "node",
          id:   2,
          lat:  0.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   3,
          lat:  0.0,
          lon:  1.1,
          tags: {"asd":"fasd"}
        },
        {
          type: "node",
          id:   4,
          lat:  0.1,
          lon:  1.2,
          tags: {"created_by":"me"}
        },
        {
          type: "node",
          id:   5,
          lat:  0.0,
          lon:  0.0
        }
      ]
    };
    geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "way/1",
          properties: {
            type: "way",
            id: 1,
            tags: {"foo":"bar"},
            relations: [],
            meta: {}
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [1.0,0.0],
              [1.1,0.0],
              [1.2,0.1],
            ]
          }
        },
        {
          type: "Feature",
          id: "node/3",
          properties: {
            type: "node",
            id: 3,
            tags: {"asd":"fasd"},
            relations: [],
            meta: {}
          },
          geometry: {
            type: "Point",
            coordinates: [1.1,0.0]
          }
        },
        {
          type: "Feature",
          id: "node/5",
          properties: {
            type: "node",
            id: 5,
            tags: {},
            relations: [],
            meta: {}
          },
          geometry: {
            type: "Point",
            coordinates: [0.0,0.0]
          }
        }
      ]
    };
    var result = osmtogeojson.toGeojson(json);
    expect(result).to.eql(geojson);
  });
  // relations
  it("relations and id-spaces", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type:  "way",
          id:    1,
          nodes: [1,2]
        },
        {
          type: "node",
          id:   1,
          lat:  1.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   2,
          lat:  2.0,
          lon:  2.0
        },
        {
          type:    "relation",
          id:      1,
          tags:    {"foo":"bar"},
          members: [
            {
              type: "way",
              ref:  1,
              role: "asd"
            },
            {
              type: "node",
              ref:  1,
              role: "fasd"
            }
          ]
        }
      ]
    };
    geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "way/1",
          properties: {
            type: "way",
            id: 1,
            tags: {},
            relations: [
              {
                rel: 1,
                role: "asd",
                reltags: {"foo":"bar"}
              }
            ],
            meta: {}
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [1.0,1.0],
              [2.0,2.0]
            ]
          }
        },
        {
          type: "Feature",
          id: "node/1",
          properties: {
            type: "node",
            id: 1,
            tags: {},
            relations: [
              {
                rel: 1,
                role: "fasd",
                reltags: {"foo":"bar"}
              }
            ],
            meta: {}
          },
          geometry: {
            type: "Point",
            coordinates: [1.0,1.0]
          }
        }
      ]
    };
    var result = osmtogeojson.toGeojson(json);
    expect(result).to.eql(geojson);
  });
  // meta info // todo +lines, +polygons
  it("meta data", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type: "node",
          id:   1,
          lat:  1.234,
          lon:  4.321,
          timestamp: "2013-01-13T22:56:07Z",
          version:   7,
          changeset: 1234,
          user:      "johndoe",
          uid:       666
        }
      ]
    };
    geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "node/1",
          properties: {
            type: "node",
            id: 1,
            tags: {},
            relations: [],
            meta: {
              timestamp: "2013-01-13T22:56:07Z",
              version:   7,
              changeset: 1234,
              user:      "johndoe",
              uid:       666
            }
          },
          geometry: {
            type: "Point",
            coordinates: [4.321, 1.234]
          }
        }
      ]
    };
    var result = osmtogeojson.toGeojson(json);
    expect(result).to.eql(geojson);
  });
  // multipolygon detection corner case
  it("multipolygon detection corner case", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type:    "relation",
          id:      1,
          tags:    {"type":"multipolygon", "amenity":"xxx"},
          members: [
            {
              type: "way",
              ref:  2,
              role: "outer"
            },
            {
              type: "way",
              ref:  3,
              role: "inner"
            }
          ]
        },
        {
          type:  "way",
          id:    2,
          nodes: [4,5,6,7,4],
          tags:  {"amenity":"yyy"}
        },
        {
          type:  "way",
          id:    3,
          nodes: [8,9,10,8]
        },
        {
          type: "node",
          id:   4,
          lat: -1.0,
          lon: -1.0
        },
        {
          type: "node",
          id:   5,
          lat: -1.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   6,
          lat:  1.0,
          lon:  1.0
        },
        {
          type: "node",
          id:   7,
          lat:  1.0,
          lon: -1.0
        },
        {
          type: "node",
          id:   8,
          lat: -0.5,
          lon:  0.0
        },
        {
          type: "node",
          id:   9,
          lat:  0.5,
          lon:  0.0
        },
        {
          type: "node",
          id:   10,
          lat:  0.0,
          lon:  0.5
        }
      ]
    };
    var result = osmtogeojson.toGeojson(json);
    expect(result.features).to.have.length(2);
    expect(_.pluck(_.pluck(result.features,"properties"),"id")).to.eql([1,2]);
    expect(result.features[0].properties.id).to.eql(1);
    expect(result.features[1].properties.id).to.eql(2);
  });

});


describe("options", function () {
  // check API options
  it("flattened properties", function () {
    var json, geojson;
    json = {
      elements: [
        {
          type: "node",
          id:   1,
          tags: {"foo": "bar"},
          user: "johndoe",
          lat:  1.234,
          lon:  4.321
        }
      ]
    };
    geojson_properties= {
      id: "node/1",
      foo: "bar",
      user: "johndoe"
    };
    var result = osmtogeojson.toGeojson(json, {flatProperties: true});
    expect(result.features[0].properties).to.eql(geojson_properties);
  });

});
