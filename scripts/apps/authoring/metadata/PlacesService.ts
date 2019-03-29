import {omit} from 'lodash';

export interface IPlacesService {
    search: (name: string, lang: string, format: 'geonames' | 'dateline') => Promise<Array<{}>>;
}

PlacesServiceFactory.$inject = ['api', 'features', 'metadata'];
export default function PlacesServiceFactory(api, features, metadata) {

    const geonameToCity = (data) => ({
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

        search(name: string, lang: string, format: 'geonames' | 'dateline') {
            return this.searchGeonames(name, lang, format === 'dateline')
                .then((geonames) => format === 'geonames' ? geonames : geonames.map(geonameToCity))
                .catch(() =>
                    format === 'dateline'
                        ? this.searchCities(name)
                        : Promise.reject(), // can't handle geonames via cities
                );
        }

        searchCities(name: string) {
            return metadata.fetchCities().then((cities) =>
                name != null && name.length
                    ? cities.filter((t) => t.city.toLowerCase().indexOf(name.toLowerCase()) !== -1)
                    : cities,
            );
        }

        searchGeonames(name: string, lang: string, dateline: boolean = false) {
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
