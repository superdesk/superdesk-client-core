
describe('places service', () => {
    beforeEach(window.module('superdesk.apps.authoring.metadata'));

    it('can search for dateline using cities if geonames are unavailable', (done) => {
        inject((places, metadata) => {
            spyOn(metadata, 'fetchCities').and.returnValue(Promise.resolve([
                {city: 'Prague'},
                {city: 'Brno'},
            ]));

            places.searchDateline('br', 'en').then((cities) => {
                expect(cities.length).toBe(1);
                expect(cities[0].city).toBe('Brno');
                done();
            })
                .catch(done.fail);
        });
    });
});
