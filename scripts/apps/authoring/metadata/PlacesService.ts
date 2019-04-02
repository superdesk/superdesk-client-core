import {omit} from 'lodash';

interface IGeoname {
    name: string;
    code: string;

    state: string;
    country: string;

    state_code: string;
    country_code: string;

    tz: string;
    scheme: string;
}

interface ILocated {
    dateline: string;
    country_code: string;
    city_code: string;
    tz: string;
    state_code: string;
    state: string;
    city: string;
    alt_name: string;
    country: string;
    code: string;
    scheme: string;
}

export interface IPlacesService {
    searchDateline: (name: string, lang: string) => Promise<Array<IGeoname>>;
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
        alt_name: '',
        country: data.country,
        code: data.code,
        scheme: data.scheme,
    });

    class PlacesService implements IPlacesService {

        /**
         * Search for dateline
         *
         * it will use geonames if available, cities cv otherwise
         *
         * @param name
         * @param lang
         */
        searchDateline(name: string, lang: string) {
            return this._searchGeonames(name, lang, true)
                .then((geonames) => geonames.map(geonameToCity))
                .catch(() => this._searchCities(name));
        }

        /**
         * Search for place using geonames
         *
         * @param name
         * @param lang
         */
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
