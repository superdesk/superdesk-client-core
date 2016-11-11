var mockPackage = require('../mocks/mockPackage');
var Dgeni = require('dgeni');

describe("generateErrorsGroupAreaProcessor", function() {
  var processor, moduleMap;

  beforeEach(function() {
    var dgeni = new Dgeni([mockPackage()]);
    var injector = dgeni.configureInjector();
    processor = injector.get('generateErrorsGroupArea');
    moduleMap = injector.get('moduleMap');
  });

  it("should create a new error doc for each module where errors found", function() {
    var docs = [];
    moduleMap.set('mod1', {
      id: 'mod1',
      name: 'mod1',
      components: [
        { docType: 'a', id: 'a1' },
        { docType: 'b', id: 'b1' },
        { docType: 'error', id: 'error1'}
      ]
    });
    moduleMap.set('mod2', {
      id: 'mod2',
      name: 'mod2',
      components: [
        { docType: 'a', id: 'a2' },
        { docType: 'b', id: 'b2' },
        { docType: 'error', id: 'error2'}
      ]
    });
    moduleMap.set('mod3', {
      id: 'mod3',
      name: 'mod3',
      components: [
        { docType: 'a', id: 'a3' },
        { docType: 'b', id: 'b3' },
      ]
    });
    processor.$process(docs);

    expect(docs.length).toEqual(2);

    expect(docs[0].name).toEqual('mod1');
    expect(docs[0].moduleName).toEqual('mod1');
    expect(docs[0].id).toEqual('mod1.error');
    expect(moduleMap.get('mod1').components).not.toContain(jasmine.objectContaining({'docType': 'error'}));
    expect(moduleMap.get('mod1').components.length).toEqual(2);

    expect(docs[1].name).toEqual('mod2');
    expect(docs[1].moduleName).toEqual('mod2');
    expect(docs[1].id).toEqual('mod2.error');
    expect(moduleMap.get('mod2').components).not.toContain(jasmine.objectContaining({'docType': 'error'}));
    expect(moduleMap.get('mod3').components.length).toEqual(2);

    expect(moduleMap.get('mod3').components).toContain(jasmine.objectContaining({'docType': 'a'}), jasmine.objectContaining({'docType': 'b'}));
    expect(moduleMap.get('mod3').components.length).toEqual(2);
  });

});