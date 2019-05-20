import {omit} from 'lodash';

interface IGeoname {
    /** name of the place, eg. Prague */
    name: string;

    state: string;
    state_code: string;

    country: string;
    country_code: string;

    /** timezone identifier, eg. Europe/Prague */
    tz: string;

    /** geonames id, eg. "3073494" */
    code: string;

    scheme: 'geonames';
}

interface ILocated {
    /** dateline format - list of fields which should be used to identify the place */
    dateline: 'city' | 'city,state' | 'city,country' | 'city,state,country';

    city: string;
    state: string;
    country: string;

    city_code: string;
    state_code: string;
    country_code: string;

    /** timezone identifier, eg. Europe/Prague  */
    tz: string;

    /** scheme identifier */
    scheme: string;

    /** code for place in the scheme */
    code: string;
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
    searchDateline: (query: string, lang: string) => Promise<Array<IGeoname>>;

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
    const geonameToCity = (data: IGeoname): ILocated => ({
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
    });

    class PlacesService implements IPlacesService {
        searchDateline(query: string, lang: string) {
            return this._searchGeonames(query, lang, true)
                .then((geonames) => geonames.map(geonameToCity))
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
