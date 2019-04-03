import {omit} from 'lodash';

interface IGeoname {
    /** name of the place */
    name: string;

    state: string;
    state_code: string;

    country: string;
    country_code: string;

    /** timezone identifier, eg. Europe/Prague */
    tz: string;

    /** geonames id */
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

export interface IPlacesService {

    /**
     * Search for dateline
     *
     * it will use geonames if available, cities cv otherwise
     *
     * @param name part of the name to search for
     * @param lang language to use for search
     */
    searchDateline: (name: string, lang: string) => Promise<Array<IGeoname>>;

    /**
     * Search for place using geonames
     *
     * @param name part of the name to search for
     * @param lang language to use for search
     */
    searchGeonames: (name: string, lang: string) => Promise<Array<ILocated>>;
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

        searchDateline(name: string, lang: string) {
            return this._searchGeonames(name, lang, true)
                .then((geonames) => geonames.map(geonameToCity))
                .catch(() => this._searchCities(name));
        }

        searchGeonames(name: string, lang: string) {
            return this._searchGeonames(name, lang);
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

            if (dateline) {
                params['style'] = 'full';
                params['featureClass'] = 'P';
            }

            return name != null && name.length && features.places_autocomplete
                ? api.query('places_autocomplete', params)
                    .then((response) => response._items.map((place) => omit(place, ['_created', '_updated', '_etag'])))
                : Promise.reject();
        }
    }

    return new PlacesService();
}
