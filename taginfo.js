var poly_tags = require("osm-polygon-features");

var structure = {
    "data_format": 1,
    "data_url": "https://raw.githubusercontent.com/tyrasd/osm-polygon-features/taginfo/project.json",
    "data_updated": (new Date()).toISOString().replace(/[-:]|\.\d+/g,''),
    "project": {
        "name": "Polygon Features",
        "description": "Tags used to detect if an OSM object is to be considered a polygon or a line. (As implemented in osmtogeojson and overpass turbo.)",
        "project_url": "https://wiki.openstreetmap.org/wiki/Overpass_turbo/Polygon_Features",
        //"doc_url": "...",
        //"icon_url": "...",
        "contact_name": "Martin Raifer",
        "contact_email": "tyr.asd@gmail.com"
    },
    "tags": [
        {
            "key": "area",
            "value": "no",
            "object_types": ["way"],
            "description": "if area=no is present, a closed way is never be considered a polygon."
        },
        {
            "key": "type",
            "value": "multipolygon",
            "object_types": ["relation"],
            "description": "Multipolygon relations are always polygons."
        },
        {
            "key": "type",
            "value": "boundary",
            "object_types": ["relation"],
            "description": "Boundary relations are always polygons."
        }
    ]
};

poly_tags.forEach(function(tag) {
    var key = tag.key;
    switch (tag.polygon) {
    case "all":
        structure.tags.push({
            "key": key,
            "object_types": ["area"],
            "description": "if this tag key is present, a closed way will be considered a polygon."
        });
    break;
    case "whitelist":
        tag.values.forEach(function(value) {
            structure.tags.push({
                "key": key,
                "value": value,
                "object_types": ["area"],
                "description": "if this tag is present, a closed way will be considered a polygon."
            });
        });
    break;
    case "blacklist":
        structure.tags.push({
            "key": key,
            "object_types": ["area"],
            "description": "if this tag key is present, a closed way will be considered a polygon (except for some specific tag values)."
        });
        tag.values.forEach(function(value) {
            structure.tags.push({
                "key": key,
                "value": value,
                "object_types": ["way"],
                "description": "doesn't trigger polygon detection, even though other values of the same tag key do."
            });
        });
    break;
    default:
        console.error("invalid rule for key", key);
    }
});

process.stdout.write(
    JSON.stringify(structure, null, 4)
);
