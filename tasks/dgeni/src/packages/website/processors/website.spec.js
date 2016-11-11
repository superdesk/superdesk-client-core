var mockPackage = require('../mocks/mockPackage');
var Dgeni = require('dgeni');

describe("generateWebsiteProcessor", function() {
  var processor;

  beforeEach(function() {
    var dgeni = new Dgeni([mockPackage()]);
    var injector = dgeni.configureInjector();
    processor = injector.get('generateWebsiteProcessor');
  });

  it("should append configured number of documents", function() {
    processor.templates = ["a", "b/c", ".d", "e/.f", "g/.h/.i.j"];

    var docs = [];
    processor.$process(docs);

    expect(docs.length).toEqual(processor.templates.length);


    expect(docs[0]).toEqual(jasmine.objectContaining({
        docType: 'website',
        area: 'website',
        id: jasmine.any(String),
        name: jasmine.any(String),
        locals: jasmine.any(Object)
      })
    );

    expect(docs[0].id).toEqual(processor.templates[0]);
    expect(docs[0].name).toEqual(processor.templates[0]);

    expect(docs[1].id).toEqual(processor.templates[1]);
    expect(docs[1].name).toEqual(processor.templates[1]);

    expect(docs[2].id).toEqual(processor.templates[2]);
    expect(docs[2].name).toEqual('dot' + processor.templates[2]);

    expect(docs[3].id).toEqual(processor.templates[3]);
    expect(docs[3].name).toEqual('e/dot.f');

    expect(docs[4].id).toEqual(processor.templates[4]);
    expect(docs[4].name).toEqual('g/dot.h/dot.i.j');
  });
});