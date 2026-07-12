export { GEO_ERRORS, GeoError, MapProviderError } from "./errors/geo.errors.js";
export type { GeoErrorCode } from "./errors/geo.errors.js";

export { GeoRepository } from "./repositories/geo.repository.js";

export { GeoService } from "./services/geo.service.js";
export {
	runDiseaseZoneCheck,
	type DiseaseZoneHit,
	type DiseaseZoneCheckResult,
	type DiseaseZoneQuery,
} from "./services/disease-zone.service.js";
export {
	MapTilerMapService,
	type GeoMapProvider,
	type GeocodeFeature,
	type GeocodeResult,
	type ForwardGeocodeOptions,
	type ReverseGeocodeOptions,
	type StaticMapOptions,
	type StaticMapMode,
	type GeolocationInfo,
	type MapTilerConfig,
} from "./services/map.service.js";
export {
	PolygonService,
	type LatLng,
	type LngLat,
	type GeometryClassification,
	POLYGON_AREA_THRESHOLD_HECTARES,
	MIN_POINT_DECIMAL_PRECISION,
} from "./services/polygon.service.js";
export {
	DeforestationMonitor,
	NoDataRasterSource,
	computeNdvi,
	forestMask,
	forestChange,
	lossYear,
	type RasterSourcePort,
	type RasterSourceKind,
	type RasterGrid,
	type DeforestationAssessment,
} from "./services/deforestation.service.js";
