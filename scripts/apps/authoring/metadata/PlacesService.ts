import {omit} from 'lodash';
import {ILocated} from 'superdesk-api';

export interface IGeoName {
    /** name of the place, eg. Prague */
    name: string;

    /** geonames id, eg. "3073494" */
    code: string;

    state: string;
    state_code: string;
    region?: string;
    region_code?: string;

    country: string;
    country_code: string;
    feature_class?: string;

    location?: {
        lat: number;
        lan: number;
    };

    /** timezone identifier, eg. Europe/Prague */
    tz: string;

    scheme: 'geonames';
}

/**
 * Search service for populated places (city, village)
 */
export interface IPlacesService {

    /**
     * Search for dateline
     *
     * it will use geonames if available, cities cv otherwise
     *
     * @param query must be included in place name
     * @param lang ISO-639 2-letter language code (en)
     */
    searchDateline: (query: string, lang: string) => Promise<Array<IGeoName>>;

    /**
     * Search for place using geonames
     *
     * @param query must be included in place name
     * @param lang ISO-639 2-letter language code (en)
     */
    searchGeonames: (query: string, lang: string) => Promise<Array<ILocated>>;
}

PlacesServiceFactory.$inject = ['api', 'features', 'metadata'];
export default function PlacesServiceFactory(api, features, metadata) {
    const geoNameToCity = (data: IGeoName): ILocated => ({
        dateline: 'city',
        country_code: data.country_code,
        tz: data.tz,
        city_code: data.name,
        state_code: data.state_code,
        state: data.state,
        city: data.name,
        country: data.country,
        code: data.code,
        scheme: data.scheme,
        place: data,
    });

    class PlacesService implements IPlacesService {
        searchDateline(query: string, lang: string) {
            return this._searchGeonames(query, lang, true)
                .then((geonames) => geonames.map(geoNameToCity))
                .catch(() => this._searchCities(query));
        }

        searchGeonames(query: string, lang: string) {
            return this._searchGeonames(query, lang);
        }

        _searchCities(name: string) {
            return metadata.fetchCities().then((cities) =>
                name != null && name.length
                    ? cities.filter((t) => t.city.toLowerCase().indexOf(name.toLowerCase()) !== -1)
                    : cities,
            );
        }

        _searchGeonames(name: string, lang: string, dateline: boolean = false) {
            const params = {name, lang};

            if (name == null || name.length === 0) {
                return Promise.resolve([]);
            }

            if (dateline) {
                params['style'] = 'full';
                params['featureClass'] = 'P';
            }

            return features.places_autocomplete
                ? api.query('places_autocomplete', params)
                    .then((response) => response._items.map((place) => omit(place, ['_created', '_updated', '_etag'])))
                : Promise.reject();
        }
    }

    return new PlacesService();
}
