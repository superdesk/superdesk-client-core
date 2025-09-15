import { IContentProfileType } from 'apps/workspace/content/controllers/ContentProfilesController';
import {DuplicateController} from '../controllers';
import * as UploadController from '../controllers/UploadController';
import {isPublished} from '../utils';

describe('content', () => {
    var item: any = {_id: 1};

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.apps.archive'));
    beforeEach(window.module('superdesk.apps.publish'));
    beforeEach(window.module('superdesk.apps.vocabularies'));
    beforeEach(window.module('superdesk.apps.searchProviders'));
    beforeEach(window.module('superdesk.apps.authoring'));

    describe('archive service', () => {
        beforeEach(inject((desks, session, preferencesService) => {
            session.identity = {_id: 'user:1'};

            spyOn(preferencesService, 'update').and.returnValue(true);

            desks.userDesks = {_items: [{_id: '1', name: 'sport', working_stage: '2', incoming_stage: '3'},
                {_id: '2', name: 'news', working_stage: '4', incoming_stage: '5'}]};
            desks.setCurrentDeskId('2');

            item = {_id: '123'};
        }));

        it('can add an item to personal workspace', inject(($location, archiveService, desks) => {
            spyOn(desks, 'getCurrentDesk').and.returnValue({_id: '2', working_stage: '4'});
            $location.path('/workspace/personal');
            archiveService.addTaskToArticle(item);
            expect(item.task).not.toBeDefined();
        }));

        it('can add an item to user\'s active desk', inject((archiveService, desks) => {
            spyOn(desks, 'getCurrentDesk').and.returnValue({_id: '2', working_stage: '4'});
            archiveService.addTaskToArticle(item);
            expect(item.task.desk).toBe('2');
            expect(item.task.stage).toBe('4');
        }));

        it('can add an item to a desk', inject((archiveService, desks) => {
            archiveService.addTaskToArticle(item, desks.userDesks._items[0]);

            expect(item.task.desk).toBe('1');
            expect(item.task.stage).toBe('2');
        }));

        it('verifies if item is from Legal Archive or not', inject((archiveService) => {
            expect(archiveService.isLegal(item)).toBe(false);

            item._type = 'legal_archive';
            expect(archiveService.isLegal(item)).toBe(true);
        }));

        it('verifies if item is from Archived repo or not', inject((archiveService) => {
            expect(archiveService.isArchived(item)).toBe(false);

            item._type = 'archived';
            expect(archiveService.isArchived(item)).toBe(true);
        }));

        it('returns the related items', inject((archiveService, api, $q) => {
            spyOn(api, 'query').and.returnValue($q.when());
            archiveService.getRelatedItems({slugline: 'test'});
            expect(api.query).toHaveBeenCalled();
            var criteria = api.query.calls.mostRecent().args[1];

            expect(criteria.source.query.filtered.query.query_string.query).toBe('slugline.phrase:"test"');
        }));

        it('can verify if the item is published or not', inject(() => {
            item.state = 'submitted';
            expect(isPublished(item)).toBe(false);

            item.state = 'corrected';
            expect(isPublished(item)).toBe(true);
        }));

        it('return type based on state and repository', inject((archiveService) => {
            item.state = 'spiked';
            expect(archiveService.getType(item)).toBe('spike');

            item.state = 'ingested';
            expect(archiveService.getType(item)).toBe('ingest');

            item.state = 'submitted';
            expect(archiveService.getType(item)).toBe('archive');

            item._type = 'archived';
            item.state = 'published';
            expect(archiveService.getType(item)).toBe('archived');

            item._type = 'published';
            expect(archiveService.getType(item)).toBe('archive');

            item._type = 'legal_archive';
            expect(archiveService.getType(item)).toBe('legal_archive');

            item._type = 'externalsource';
            expect(archiveService.getType(item)).toBe('externalsource');
        }));

        it('can fetch version history', inject((archiveService, api, $q) => {
            spyOn(api, 'find').and.returnValue($q.when());
            spyOn(api.legal_archive_versions, 'getByUrl').and.returnValue($q.when());

            item._links = {_id: '123'};
            archiveService.getVersions(item, {}, 'versions');
            expect(api.find).toHaveBeenCalledWith('archive', '123',
                {version: 'all', embedded: {user: 1}, max_results: 200});

            item._type = 'legal_archive';
            item._links = {collection: {href: '/legal_archive'}};
            archiveService.getVersions(item, {}, 'versions');
            expect(api.find).toHaveBeenCalledWith('legal_archive', '123', {version: 'all', max_results: 200});
        }));
    });

    describe('multi service', () => {
        it('can reset on route change', inject((multi, $rootScope) => {
            multi.toggle({_id: 1, selected: true});
            expect(multi.count).toBe(1);
            expect(multi.getIds()).toEqual([1]);

            $rootScope.$broadcast('$routeChangeStart');
            $rootScope.$digest();

            expect(multi.count).toBe(0);
        }));

        it('can get list of items', inject((multi) => {
            var items = [{_id: 1, selected: true}, {_id: 2, selected: true}];

            multi.toggle(items[0]);
            multi.toggle(items[1]);
            expect(multi.getItems()).toEqual(items);
        }));

        it('can check if item is selected', inject((multi) => {
            var items = [{_id: 1, selected: true}];

            multi.toggle(items[0]);
            expect(multi.isSelected(items[0])).toEqual(true);
            expect(multi.isSelected({_id: 2})).toEqual(false);
        }));
    });

    describe('item preview header', () => {
        it('on toggle sets the header state in local storage', inject(($rootScope, $compile, storage) => {
            storage.clear();
            var firstScope = $rootScope.$new();

            firstScope.selected = {preview: item};
            $compile('<div sd-media-preview></div>')(firstScope);
            firstScope.$digest();

            const expectValues = (directiveScope, value) => {
                expect(directiveScope.previewState.toggleHeader).toBe(value);
                expect(storage.getItem('item_preview:header_state')).toBe(value);
            };

            expectValues(firstScope, false);
            firstScope.togglePreviewHeader();
            expectValues(firstScope, true);

            var secondScope = $rootScope.$new();

            secondScope.selected = {preview: item};
            $compile('<div sd-media-preview></div>')(secondScope);
            expectValues(secondScope, true);
        }));
    });

    describe('duplicate', () => {
        it('can duplicate item to current desk', inject(($controller, desks, workspaces, session, api, $q) => {
            spyOn(workspaces, 'isCustom').and.returnValue(true);
            spyOn(desks, 'getCurrentDeskId').and.returnValue('sports');
            spyOn(api, 'save').and.returnValue($q.when({}));
            session.identity = {};

            let data = {item: {item_id: 'foo', _type: 'archive', task: {}}};

            $controller(DuplicateController, {data: data});

            expect(api.save).toHaveBeenCalledWith('duplicate', {}, {
                desk: 'sports',
                type: 'archive',
                item_id: 'foo',
            }, data.item);
        }));
    });

    fdescribe('process item metadata', () => {
        const exiftoolReturnData = [{
            "XMP:XMPToolkit": "Image::ExifTool 9.85",
            "XMP:CountryCode": "R14",
            "XMP:CreatorCity": "Creator's CI: City (ref2014)",
            "XMP:CreatorCountry": "Creator's CI: Country (ref2014)",
            "XMP:CreatorAddress": "Creator's CI: Address, line 1 (ref2014)",
            "XMP:CreatorPostalCode": "Creator's CI: Postcode (ref2014)",
            "XMP:CreatorRegion": "Creator's CI: State/Province (ref2014)",
            "XMP:CreatorWorkEmail": "Creator's CI: Email@1, Email@2 (ref2014)",
            "XMP:CreatorWorkTelephone": "Creator's CI: Phone # 1, Phone # 2 (ref2014)",
            "XMP:CreatorWorkURL": "http://www.Creators.CI/WebAddress/ref2014",
            "XMP:IntellectualGenre": "A Genre (ref2014)",
            "XMP:Location": "Sublocation (Core) (ref2014)",
            "XMP:Scene": ["IPTC-Scene-Code1 (ref2014)","IPTC-Scene-Code2 (ref2014)"],
            "XMP:SubjectCode": ["1ref2014","2ref2014","3ref2014"],
            "XMP:AboutCvTermCvId": "http://example.com/cv/test1/ref2014",
            "XMP:AboutCvTermId": "http://example.com/cv/test1/code987/ref2014",
            "XMP:AboutCvTermName": "CV-Term Name 1 (ref2014)",
            "XMP:AboutCvTermRefinedAbout": "http://example.com/cv/refinements2/codeX145/ref2014",
            "XMP:AdditionalModelInformation": "Additional Model Info (ref2014)",
            "XMP:ArtworkCircaDateCreated": "AO Circa Date: between 1550 and 1600 (ref2014)",
            "XMP:ArtworkContentDescription": "AO Content Description 1 (ref2014)",
            "XMP:ArtworkContributionDescription": "AO Contribution Description 1 (ref2014)",
            "XMP:ArtworkCopyrightNotice": "AO Copyright Notice 1 (ref2014)",
            "XMP:ArtworkCreator": ["AO Creator Name 1a (ref2014)","AO Creator Name 1b (ref2014)"],
            "XMP:ArtworkCreatorID": ["AO Creator Id 1a (ref2014)","AO Creator Id 1b (ref2014)"],
            "XMP:ArtworkCopyrightOwnerID": "AO Current Copyright Owner ID 1 (ref2014)",
            "XMP:ArtworkCopyrightOwnerName": "AO Current Copyright Owner Name 1 (ref2014)",
            "XMP:ArtworkLicensorID": "AO Current Licensor ID 1 (ref2014)",
            "XMP:ArtworkLicensorName": "AO Current Licensor Name 1 (ref2014)",
            "XMP:ArtworkDateCreated": "1914:10:22 12:13:14+00:00",
            "XMP:ArtworkPhysicalDescription": "AO Physical Description 1 (ref2014)",
            "XMP:ArtworkSource": "AO Source 1 (ref2014)",
            "XMP:ArtworkSourceInventoryNo": "AO Source Inventory No 1 (ref2014)",
            "XMP:ArtworkSourceInvURL": "AO Source Inventory URL (ref2014)",
            "XMP:ArtworkStylePeriod": ["AO Style Baroque (ref2014)","AO Style Italian Baroque (ref2014)"],
            "XMP:ArtworkTitle": "AO Title 1 (ref2014)",
            "XMP:DigitalImageGUID": "http://example.com/imageGUIDs/TestGUID12345/ref2014",
            "XMP:DigitalSourceType": "http://cv.iptc.org/newscodes/digitalsourcetype/softwareImage",
            "XMP:EmbeddedEncodedRightsExpr": "The Encoded Rights Expression (ref2014)",
            "XMP:EmbeddedEncodedRightsExprType": "IANA Media Type of ERE (ref2014)",
            "XMP:EmbeddedEncodedRightsExprLangID": "http://example.org/RELids/id4711/ref2014",
            "XMP:Event": "An Event (ref2014)",
            "XMP:LinkedEncodedRightsExpr": "http://example.org/linkedrightsexpression/id986/ref2014",
            "XMP:LinkedEncodedRightsExprType": "IANA Media Type of ERE (ref2014)",
            "XMP:LinkedEncodedRightsExprLangID": "http://example.org/RELids/id4712/ref2014",
            "XMP:LocationCreatedCity": "City (Location created1) (ref2014)",
            "XMP:LocationCreatedCountryCode": "R14",
            "XMP:LocationCreatedCountryName": "CountryName (Location created1) (ref2014)",
            "XMP:LocationCreatedLocationId": "Location Id (Location created1) (ref2014)",
            "XMP:LocationCreatedProvinceState": "Province/State (Location created1) (ref2014)",
            "XMP:LocationCreatedSublocation": "Sublocation (Location created1) (ref2014)",
            "XMP:LocationCreatedWorldRegion": "Worldregion (Location created1) (ref2014)",
            "XMP:LocationShownCity": ["City (Location shown1) (ref2014)","City (Location shown2) (ref2014)"],
            "XMP:LocationShownCountryCode": ["R14","r14"],
            "XMP:LocationShownCountryName": ["CountryName (Location shown1) (ref2014)","CountryName (Location shown2) (ref2014)"],
            "XMP:LocationShownLocationId": ["Location Id 1a(Location shown1) (ref2014)","Location Id 1b(Location shown1) (ref2014)","Location Id 2a(Location shown2) (ref2014)","Location Id 2b(Location shown2) (ref2014)"],
            "XMP:LocationShownProvinceState": ["Province/State (Location shown1) (ref2014)","Province/State (Location shown2) (ref2014)"],
            "XMP:LocationShownSublocation": ["Sublocation (Location shown1) (ref2014)","Sublocation (Location shown2) (ref2014)"],
            "XMP:LocationShownWorldRegion": ["Worldregion (Location shown1) (ref2014)","Worldregion (Location shown2) (ref2014)"],
            "XMP:MaxAvailHeight": 14,
            "XMP:MaxAvailWidth": 20,
            "XMP:ModelAge": [25,27,30],
            "XMP:OrganisationInImageCode": ["Organisation Code 1 (ref2014)","Organisation Code 2 (ref2014)","Organisation Code 3 (ref2014)"],
            "XMP:OrganisationInImageName": ["Organisation Name 1 (ref2014)","Organisation Name 2 (ref2014)","Organisation Name 3 (ref2014)"],
            "XMP:PersonInImage": ["Person Shown 1 (ref2014)","Person Shown 2 (ref2014)"],
            "XMP:PersonInImageCvTermCvId": "http://example.com/cv/test99/ref2014",
            "XMP:PersonInImageCvTermId": "http://example.com/cv/test99/code987/ref2014",
            "XMP:PersonInImageCvTermName": "Person Characteristic Name 1 (ref2014)",
            "XMP:PersonInImageCvTermRefinedAbout": "http://example.com/cv/refinements987/codeY765/ref2014",
            "XMP:PersonInImageDescription": "Person Description 1 (ref2014)",
            "XMP:PersonInImageId": ["http://wikidata.org/item/Q123456789/ref2014","http://freebase.com/m/987654321/ref2014"],
            "XMP:PersonInImageName": "Person Name 1 (ref2014)",
            "XMP:ProductInImageDescription": "Product Description 1 (ref2014)",
            "XMP:ProductInImageGTIN": 123456782014,
            "XMP:ProductInImageName": "Product Name 1 (ref2014)",
            "XMP:RegistryItemID": ["Registry Image ID 1 (ref2014)","Registry Image ID 2 (ref2014)"],
            "XMP:RegistryOrganisationID": ["Registry Organisation ID 1 (ref2014)","Registry Organisation ID 2 (ref2014)"],
            "XMP:Creator": ["Creator1 (ref2014)","Creator2 (ref2014)"],
            "XMP:Description": "The description aka caption (ref2014)",
            "XMP:Rights": "Copyright (Notice) 2014 IPTC - www.iptc.org  (ref2014)",
            "XMP:Subject": ["Keyword1ref2014","Keyword2ref2014","Keyword3ref2014"],
            "XMP:Title": "The Title (ref2014)",
            "XMP:AuthorsPosition": "Creator's Job Title  (ref2014)",
            "XMP:CaptionWriter": "Description Writer (ref2014)",
            "XMP:City": "City (Core) (ref2014)",
            "XMP:Country": "Country (Core) (ref2014)",
            "XMP:Credit": "Credit Line (ref2014)",
            "XMP:DateCreated": "2015:02:17 17:30:01+00:00",
            "XMP:Headline": "The Headline (ref2014)",
            "XMP:Instructions": "An Instruction (ref2014)",
            "XMP:Source": "Source (ref2014)",
            "XMP:State": "Province/State (Core) (ref2014)",
            "XMP:TransmissionReference": "Job Id (ref2014)",
            "XMP:CopyrightOwnerID": ["Copyright Owner Id 1 (ref2014)","Copyright Owner Id 2 (ref2014)"],
            "XMP:CopyrightOwnerName": ["Copyright Owner Name 1 (ref2014)","Copyright Owner Name 2 (ref2014)"],
            "XMP:ImageCreatorID": ["Image Creator Id 1 (ref2014)","Image Creator Id 2 (ref2014)"],
            "XMP:ImageCreatorName": ["Image Creator Name 1 (ref2014)","Image Creator Name 2 (ref2014)"],
            "XMP:ImageCreatorImageID": "Image Creator Image ID (ref2014)",
            "XMP:ImageSupplierID": "Image Supplier Id (ref2014)",
            "XMP:ImageSupplierName": "Image Supplier Name (ref2014)",
            "XMP:ImageSupplierImageID": "Image Supplier Image ID (ref2014)",
            "XMP:LicensorCity": ["Licensor City 1 (ref2014)","Licensor City 2 (ref2014)"],
            "XMP:LicensorCountry": ["Licensor Country 1 (ref2014)","Licensor Country 2 (ref2014)"],
            "XMP:LicensorEmail": ["Licensor Email 1 (ref2014)","Licensor Email 2 (ref2014)"],
            "XMP:LicensorExtendedAddress": ["Licensor Ext Addr 1 (ref2014)","Licensor Ext Addr 2 (ref2014)"],
            "XMP:LicensorID": ["Licensor ID 1 (ref2014)","Licensor ID 2 (ref2014)"],
            "XMP:LicensorName": ["Licensor Name 1 (ref2014)","Licensor Name 2 (ref2014)"],
            "XMP:LicensorPostalCode": ["Licensor Postcode 1 (ref2014)","Licensor Postcode 2 (ref2014)"],
            "XMP:LicensorRegion": ["Licensor Region 1 (ref2014)","Licensor Region 2 (ref2014)"],
            "XMP:LicensorStreetAddress": ["Licensor Street Addr 1 (ref2014)","Licensor Street Addr 2 (ref2014)"],
            "XMP:LicensorTelephone1": ["Licensor Phone1 1 (ref2014)","Licensor Phone1 2 (ref2014)"],
            "XMP:LicensorTelephone2": ["Licensor Phone2 1 (ref2014)","Licensor Phone2 2 (ref2014)"],
            "XMP:LicensorURL": ["Licensor URL 1 (ref2014)","Licensor URL 2 (ref2014)"],
            "XMP:MinorModelAgeDisclosure": "Age 25 or Over",
            "XMP:ModelReleaseID": ["Model Release ID 1 (ref2014)","Model Release ID 2 (ref2014)"],
            "XMP:ModelReleaseStatus": "Not Applicable",
            "XMP:PropertyReleaseID": ["Property Release ID 1 (ref2014)","Property Release ID 2 (ref2014)"],
            "XMP:PropertyReleaseStatus": "Not Applicable",
            "XMP:UsageTerms": "Rights Usage Termns (ref2014)",
            "IPTC:ObjectAttributeReference": "A Genre (ref2014)",
            "IPTC:ObjectName": "The Title (ref2014)",
            "IPTC:SubjectReference": ["IPTC:1ref2014","IPTC:2ref2014","IPTC:3ref2014"],
            "IPTC:Keywords": ["Keyword1ref2014","Keyword2ref2014","Keyword3ref2014"],
            "IPTC:SpecialInstructions": "An Instruction (ref2014)",
            "IPTC:DateCreated": "2015:02:17",
            "IPTC:TimeCreated": "17:30:01+00:00",
            "IPTC:By-line": "Creator1 (ref2014)",
            "IPTC:By-lineTitle": "Creator's Job Title  (ref2014)",
            "IPTC:City": "City (Core) (ref2014)",
            "IPTC:Sub-location": "Sublocation (Core) (ref2014)",
            "IPTC:Province-State": "Province/State (Core) (ref2014)",
            "IPTC:Country-PrimaryLocationCode": "R14",
            "IPTC:Country-PrimaryLocationName": "Country (Core) (ref2014)",
            "IPTC:OriginalTransmissionReference": "Job Id (ref2014)",
            "IPTC:Headline": "The Headline (ref2014)",
            "IPTC:Credit": "Credit Line (ref2014)",
            "IPTC:Source": "Source (ref2014)",
            "IPTC:CopyrightNotice": "Copyright (Notice) 2014 IPTC - www.iptc.org  (ref2014)",
            "IPTC:Caption-Abstract": "The description aka caption (ref2014)",
            "IPTC:Writer-Editor": "Description Writer (ref2014)",
            "IPTC:ApplicationRecordVersion": 4,
            "Composite:ImageSize": "2100x1050",
            "Composite:Megapixels": 2.2,
            "Composite:DateTimeCreated": "2015:02:17 17:30:01+00:00",
            "Composite:City": "City (Core) (ref2014)",
            "Composite:Copyright": "Copyright (Notice) 2014 IPTC - www.iptc.org  (ref2014)",
            "Composite:Country": "Country (Core) (ref2014)",
            "Composite:Creator": "Creator1 (ref2014)",
            "Composite:DateTimeOriginal": "2011:10:28 12:00:00",
            "Composite:Description": "The description aka caption (ref2014)",
            "Composite:Keywords": ["Keyword1ref2014","Keyword2ref2014","Keyword3ref2014"],
            "Composite:Location": "Sublocation (Core) (ref2014)",
            "Composite:ModifyDate": "2015:02:10 08:56:56",
            "Composite:Orientation": "Horizontal (normal)",
            "Composite:State": "Province/State (Core) (ref2014)"
        }]

        it('composite tags', async () => {
            const file = new File([''], 'image.png', { type: 'image/png' });
            const expected = {
                "City": "City (Core) (ref2014)",
                "CopyrightNotice": "Copyright (Notice) 2014 IPTC - www.iptc.org  (ref2014)",
                "Country-PrimaryLocationName": "Country (Core) (ref2014)",
                "By-line": "Creator1 (ref2014)",
                "Caption-Abstract": "The description aka caption (ref2014)",
                "Keywords": ["Keyword1ref2014","Keyword2ref2014","Keyword3ref2014"],
                "Sub-location": "Sublocation (Core) (ref2014)",
            };

            spyOn(UploadController, 'getPictureMetadata').and.returnValue(
                Promise.resolve({
                    success: true,
                    data: exiftoolReturnData,
                    error: "",
                    exitCode: 0,
                    contentType: IContentProfileType.picture,
                })
            );
            const metadata = await UploadController.getPictureMetadata(file);
            const stripped = UploadController.stripGroupNames(metadata.data[0])
            const compare = {
                City: stripped.City,
                CopyrightNotice: stripped.CopyrightNotice,
                "Country-PrimaryLocationName": stripped['Country-PrimaryLocationName'],
                "By-line": stripped['By-line'],
                "Caption-Abstract": stripped['Caption-Abstract'],
                Keywords: stripped.Keywords,
                "Sub-location": stripped['Sub-location']
            }
            expect(compare).toEqual(expected)
        });

        it('empty metadata', async () => {
            let file = new File([''], 'empty.png', { type: 'image/png' });

            spyOn(UploadController, 'getPictureMetadata').and.returnValue(
                Promise.resolve({ success: true, data: [{}], error: "", exitCode: 0, contentType: IContentProfileType.picture })
            );

            let metadata = await UploadController.getPictureMetadata(file);
            let stripped = UploadController.stripGroupNames(metadata.data[0]);

            expect(stripped).toEqual({});

            file = new File([''], 'empty.mp4', { type: 'video/mp4' });

            spyOn(UploadController, "getVideoMetadata").and.returnValue(
                Promise.resolve({ success: true, data: [{}], error: "", exitCode: 0, contentType: IContentProfileType.video })
            );

            metadata = await UploadController.getPictureMetadata(file);
            stripped = UploadController.stripGroupNames(metadata.data[0]);

            expect(stripped).toEqual({});
        });
    });

});
