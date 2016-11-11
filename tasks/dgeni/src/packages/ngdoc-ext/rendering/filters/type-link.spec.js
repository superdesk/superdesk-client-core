var filterFactory = require('./type-link');

describe("type-link filter", function() {
  it("should call getTypeLink", function() {
    var getTypeLinkSpy = jasmine.createSpy('getTypeLink');
    var filter = filterFactory(getTypeLinkSpy);

    filter.process('object');
    expect(getTypeLinkSpy).toHaveBeenCalled();
  });
});