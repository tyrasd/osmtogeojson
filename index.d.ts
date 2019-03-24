import { FeatureCollection, Feature, GeometryObject } from 'geojson';

export = osmtogeojson;
export as namespace osmtogeojson;

declare var osmtogeojson: osmtogeojson.OsmToGeoJsonStatic;

declare namespace osmtogeojson {
    interface OsmToGeoJSONOptions {
        verbose?: boolean;
        flatProperties?: boolean;
        // tslint:disable-next-line:no-any
        uninterestingTags?: any;
        // tslint:disable-next-line:no-any
        polygonFeatures?: any;
        // tslint:disable-next-line:no-any
        deduplicator?: any;
    }

    export interface OsmToGeoJsonStatic {
        // tslint:disable-next-line:no-any
        (data: any, options?: OsmToGeoJSONOptions): FeatureCollection<GeometryObject>;
    }
}
