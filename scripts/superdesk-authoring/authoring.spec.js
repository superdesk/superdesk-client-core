fdescribe('authoring', function() {
    'use strict';

    beforeEach(module('superdesk.vocabularies'));
    beforeEach(module('superdesk.archive'));

    it('set anpa category value for required subservice',
            inject(function($httpBackend, $q, $rootScope, $compile, vocabularies, archiveService, content) {
        $httpBackend.expectGET("scripts/superdesk-authoring/views/authoring-header.html");
        $httpBackend.whenGET("scripts/superdesk-authoring/views/authoring-header.html").respond('');

        var vocabulariesData = [
            {
                "_id": "categories",
                "display_name": "Categories",
                "type": "manageable",
                "items": [{"is_active": true, "name": "Motoring", "qcode": "paservice:motoring"}]
            },
            {
                "_id": "subservice_motoring",
                "display_name": "Motoring sub-service",
                "type": "manageable",
                "service": {"paservice:motoring": 1},
                "priority": 2,
                "items": [{"is_active": true, "name": "News", "qcode": "paservice:motoring:news"}]
            }
        ];
        var schema = {
            "subject": {
                "mandatory_in_list": {
                    "scheme": {
                        "subservice_motoring": "subservice_motoring",
                    }
                }
            }
        };

        spyOn(archiveService, 'isLegal').and.returnValue(false);
        spyOn(content, 'getType').and.returnValue('motoring');
        spyOn(content, 'editor').and.returnValue({});
        spyOn(content, 'schema').and.returnValue(schema);
        spyOn(vocabularies, 'getVocabularies').and.returnValue($q.when({_items: vocabulariesData}));

        var scope = $rootScope.$new();
        var element = $compile('<sd-authoring-header></sd-authoring-header>')(scope);
        scope.item = {"profile": "motoring"};
        element.scope().$apply();

        expect(scope.item.anpa_category).toBe({'name': 'Motoring', 'qcode': 'paservice:motoring', scheme: null});
    }));
});
