import {UploadController} from '../controllers/UploadController';
import {sdApi} from 'api';
import {extensions} from 'appConfig';
import {IExtensionActivationResult} from 'superdesk-api';

describe('upload controller staging', () => {
    beforeEach(() => {
        spyOn(sdApi.navigation, 'isPersonalSpace').and.returnValue(true);
    });

    afterEach(() => {
        delete extensions.uploadMetadataTest;
        delete extensions.uploadMetadataSecondTest;
    });

    function registerHook(name: string, hook: IExtensionActivationResult['contributions']['iptcMapping']) {
        const activationResult = {contributions: {iptcMapping: hook}};

        extensions[name] = {
            activationResult,
            extension: {activate: () => Promise.resolve(activationResult)},
            configuration: {},
        };
    }

    function staged(status = 'processing', metadataStatus = 'ready', meta = {}) {
        return {_id: 'staged-id', _etag: 'etag', status, metadata_status: metadataStatus, meta};
    }

    function setup() {
        const listeners = {};
        const scope = {
            $applyAsync: (callback) => callback(),
            $on: (event, callback) => listeners[event] = callback,
            resolve: jasmine.createSpy('resolve'),
            reject: jasmine.createSpy('reject'),
            imagesMetadata: [],
            pendingItems: [],
            items: [],
            processing: false,
            metadataPending: false,
            failed: false,
            saving: false,
            removing: false,
            addFiles: null,
            save: null,
            cancel: null,
            onRemoveItem: null,
            selectedDesk: undefined,
            parent: undefined,
        };
        const timers = [];
        const timeout = Object.assign(
            (callback) => {
                const timer = {callback};

                timers.push(timer);
                return timer;
            },
            {cancel: jasmine.createSpy('cancel')},
        );
        let respond;
        let onProgress;
        let uploadStarted;
        const upload = {start: () => {
            const response = new Promise((resolve) => respond = resolve);

            return {then: (success, failure, progress) => {
                onProgress = progress;
                uploadStarted();
                return response.then(success, failure);
            }};
        }};
        const save = jasmine.createSpy('save').and.returnValue(Promise.resolve({_id: 'archive-id'}));
        const api = Object.assign(
            () => ({url: () => Promise.resolve('/upload_staging'), save}),
            {
                archive: {getHeaders: () => ({})},
                find: jasmine.createSpy('find').and.callFake(() => Promise.resolve(staged('processing', 'pending'))),
                update: jasmine.createSpy('update').and.returnValue(Promise.resolve()),
                remove: jasmine.createSpy('remove').and.returnValue(Promise.resolve()),
            },
        );
        const notify = {error: jasmine.createSpy('error'), warning: jasmine.createSpy('warning')};
        const q = {
            all: (values) => Promise.all(values),
            reject: (reason) => Promise.reject(reason),
            defer: () => {
                let resolve;
                let reject;
                const promise = new Promise((res, rej) => {
                    resolve = res;
                    reject = rej;
                });

                return {promise, resolve, reject};
            },
        };

        const archiveService = {addTaskToArticle: jasmine.createSpy('addTaskToArticle')};

        UploadController(scope, q, upload, api, archiveService,
            {identity: {_id: 'user', byline: 'User'}}, {}, notify, {}, {}, timeout);

        async function add(
            response = staged('processing', 'pending'),
            type = 'audio/mpeg',
            cancel = false,
            uploading = () => undefined,
        ) {
            const started = new Promise<void>((resolve) => uploadStarted = resolve);
            const adding = scope.addFiles([new File(['binary'], 'media', {type})]);

            await started;
            uploading();
            if (cancel) {
                scope.cancel();
            }
            respond({data: response});
            await adding;
            await scope.items[0]?.refresh;
        }

        async function event(response, name = 'upload_staging:updated') {
            api.find.and.returnValue(Promise.resolve(response));
            listeners[name]({}, {user: 'user', staged_id: 'staged-id'});
            await scope.items[0]?.refresh;
        }

        return {
            scope, api, save, notify, timers, timeout, listeners, add, event, archiveService,
            progress: (loaded, total) => onProgress({loaded, total}),
        };
    }

    it('waits for metadata and uses websocket refreshes without polling or overwriting edits', async () => {
        const {scope, api, timers, add, event} = setup();

        await add();
        expect(scope.imagesMetadata).toEqual([]);
        expect(api.find.calls.count()).toBe(1);
        expect(timers.length).toBe(1); // Deadline only, no repeated polling timer.
        await event(staged('processing', 'ready', {headline: 'Embedded'}));
        expect(scope.imagesMetadata[0].headline).toBe('Embedded');
        scope.imagesMetadata[0].headline = 'Edited';
        await event(staged('ready', 'ready', {headline: 'Embedded'}));
        expect(scope.imagesMetadata[0].headline).toBe('Edited');
    });

    it('waits for hooks, runs them sequentially once, and saves their result without overwriting edits', async () => {
        let complete;
        const first = jasmine.createSpy('first').and.callFake((iptc, item) => new Promise((resolve) => {
            complete = () => resolve({...item, slugline: iptc.ObjectName});
        }));
        const second = jasmine.createSpy('second').and.callFake(async (_iptc, item) => ({
            ...item, headline: item.slugline + ' mapped',
        }));

        registerHook('uploadMetadataTest', first);
        registerHook('uploadMetadataSecondTest', second);
        const {scope, add, event, save} = setup();
        const parent = {language: 'it'};
        const iptc = {ObjectName: 'Photo'};

        scope.parent = parent;
        await add();
        await event({...staged('processing'), iptc_metadata: iptc});
        expect(scope.imagesMetadata).toEqual([]);
        await expectAsync(scope.save()).toBeRejected();
        expect(save).not.toHaveBeenCalled();
        expect(second).not.toHaveBeenCalled();
        expect(first.calls.mostRecent().args[0]).toEqual({...iptc, 'By-line': 'User'});
        expect(first.calls.mostRecent().args[2]).toBe(parent);
        await event(staged('ready'));
        await expectAsync(scope.save()).toBeRejected();
        complete();
        await scope.items[0].metadataMapping;
        expect(scope.imagesMetadata[0].headline).toBe('Photo mapped');
        scope.imagesMetadata[0].headline = 'Edited';
        await event(staged('ready', 'ready', {headline: 'Embedded'}));
        await scope.save();
        expect(first.calls.count()).toBe(1);
        expect(second.calls.count()).toBe(1);
        expect(save.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({
            headline: 'Edited', slugline: 'Photo',
        }));
    });

    it('reports rejected hooks and prevents committing incomplete metadata', async () => {
        registerHook('uploadMetadataTest', () => Promise.reject(new Error('Vocabulary unavailable')));
        const {scope, api, add, notify, save} = setup();

        api.find.and.returnValue(Promise.resolve(staged('ready')));
        await add(staged('ready'));
        await scope.items[0].metadataMapping;
        expect(scope.failed).toBe(true);
        expect(notify.error).toHaveBeenCalledWith('Upload Error: media: Vocabulary unavailable');
        await expectAsync(scope.save()).toBeRejected();
        expect(save).not.toHaveBeenCalled();
    });

    it('does not restore removed uploads when a hook finishes', async () => {
        let complete;

        registerHook('uploadMetadataTest', (_iptc, item) => new Promise((resolve) => {
            complete = () => resolve(item);
        }));
        const {scope, add, event} = setup();

        await add();
        await event(staged('processing'));
        const item = scope.items[0];

        await scope.onRemoveItem(item.meta);
        complete();
        await item.metadataMapping;
        expect(scope.items).toEqual([]);
        expect(scope.imagesMetadata).toEqual([]);
    });

    it('shows upload progress then a pending metadata preview without initializing the editor', async () => {
        const {scope, add, event, progress} = setup();

        await add(staged('processing', 'pending'), 'audio/mpeg', false, () => {
            expect(scope.pendingItems.length).toBe(1);
            expect(scope.pendingItems[0].file.name).toBe('media');
            expect(scope.pendingItems[0].staged).toBeUndefined();
            progress(45, 100);
            expect(scope.pendingItems[0].progress).toBe(45);
            expect(scope.imagesMetadata.length).toBe(0);
        });
        expect(scope.pendingItems.length).toBe(1);
        expect(scope.pendingItems[0].staged.metadata_status).toBe('pending');
        expect(scope.imagesMetadata.length).toBe(0);
        await event(staged('processing', 'ready', {headline: 'Extracted'}));
        expect(scope.pendingItems.length).toBe(0);
        expect(scope.imagesMetadata[0].headline).toBe('Extracted');
    });

    it('allows removal while waiting for metadata', async () => {
        const {scope, api, add} = setup();

        await add();
        await scope.onRemoveItem(scope.pendingItems[0].meta);
        expect(scope.pendingItems.length).toBe(0);
        expect(scope.items.length).toBe(0);
        expect(api.remove).not.toHaveBeenCalled();
    });

    it('removes an upload from the UI while its staging request is in flight', async () => {
        const {scope, api, add} = setup();
        let removing;

        await add(staged(), 'audio/mpeg', false, () => {
            removing = scope.onRemoveItem(scope.pendingItems[0].meta);
            expect(scope.items.length).toBe(0);
        });
        await removing;
        expect(api.remove).not.toHaveBeenCalled();
        expect(scope.items.length).toBe(0);
        expect(scope.processing).toBe(false);
    });

    it('accepts Upload while renditions run and commits exactly once on ready', async () => {
        const {scope, save, add, event} = setup();

        await add();
        await event(staged('processing', 'ready', {headline: 'Embedded'}));
        const saving = scope.save();

        await Promise.resolve();
        expect(scope.saving).toBe(true);
        expect(save).not.toHaveBeenCalled();
        await event(staged('ready'));
        await saving;
        expect(save.calls.count()).toBe(1);
        expect(scope.resolve).toHaveBeenCalled();
    });

    it('updates edited metadata and desk on retry after a partial batch failure', async () => {
        const {scope, api, save, notify, add, archiveService} = setup();
        const firstDesk = {_id: 'first-desk', working_stage: 'first-stage'};
        const retryDesk = {_id: 'retry-desk', working_stage: 'retry-stage'};
        const created = {
            _id: 'archive-id',
            _etag: 'created-etag',
            _links: {self: {href: '/archive/archive-id'}},
        };
        const reason = {data: {_message: 'Creation failed'}};

        api.find.and.returnValue(Promise.resolve(staged('ready')));
        await add(staged('ready', 'ready', {headline: 'First'}));
        await add({...staged('ready', 'ready', {headline: 'Second'}), _id: 'second-staged-id'});
        scope.items.reverse();
        scope.imagesMetadata.reverse();
        archiveService.addTaskToArticle.and.callFake((metadata, desk) => {
            if (metadata.task?.desk == null) {
                metadata.task = {desk: desk._id, stage: desk.working_stage, user: 'user'};
            }
        });
        scope.selectedDesk = firstDesk;
        save.and.callFake((model, metadata) => metadata.staged_id === 'second-staged-id'
            ? Promise.reject(reason) : Promise.resolve(created));

        await expectAsync(scope.save()).toBeRejectedWith(reason);
        expect(scope.resolve).not.toHaveBeenCalled();
        expect(notify.error).toHaveBeenCalledWith('Creation failed');
        expect(scope.saving).toBe(false);
        expect(scope.items[0].model).toBe(created);
        expect(scope.items[1].model).toBeUndefined();

        scope.imagesMetadata[0].headline = 'Edited first';
        scope.imagesMetadata[0].source = 'Edited source';
        scope.selectedDesk = retryDesk;
        save.and.callFake((model, metadata) => Promise.resolve({
            ...model,
            ...metadata,
            _id: model._id || 'second-archive-id',
            _etag: 'updated-etag',
        }));

        await scope.save();
        const task = {desk: 'retry-desk', stage: 'retry-stage', user: 'user'};

        expect(save.calls.count()).toBe(4);
        expect(save.calls.argsFor(2)).toEqual([
            created,
            {byline: 'User', headline: 'Edited first', source: 'Edited source', task},
        ]);
        expect(save.calls.argsFor(3)).toEqual([
            {},
            {byline: 'User', headline: 'Second', task, staged_id: 'second-staged-id'},
        ]);
        expect(scope.resolve).toHaveBeenCalledWith([
            {...created, _etag: 'updated-etag', byline: 'User',
                headline: 'Edited first', source: 'Edited source', task},
            {_id: 'second-archive-id', _etag: 'updated-etag', byline: 'User',
                headline: 'Second', task, staged_id: 'second-staged-id'},
        ]);
    });

    [true, false].forEach((lateSuccess) => {
        it(`waits for all archive requests after a failure (late success: ${lateSuccess})`, async () => {
            const {scope, save, add} = setup();
            const reason = {data: {_message: 'Creation failed'}};
            const created = {_id: 'late-archive-id', _etag: 'created-etag'};
            let finishLate: (model: typeof created) => void;
            let failLate: (reason: unknown) => void;
            const lateRequest = new Promise((resolve, reject) => {
                finishLate = resolve;
                failLate = reject;
            });

            await add(staged('ready'));
            await add({...staged('ready'), _id: 'second-staged-id'});
            let requestsStarted: () => void;
            const started = new Promise<void>((resolve) => requestsStarted = resolve);

            save.and.callFake((_model, metadata) => {
                if (metadata.staged_id === 'second-staged-id') {
                    return Promise.reject(reason);
                }
                requestsStarted();
                return lateRequest;
            });
            let settled = false;
            const saving = scope.save();
            const rejected = expectAsync(saving).toBeRejectedWith(reason);

            saving.then(() => settled = true, () => settled = true);
            await started;
            for (let i = 0; i < 10; i++) {
                await Promise.resolve();
            }
            expect(settled).toBe(false);
            expect(scope.saving).toBe(true);
            await expectAsync(scope.save()).toBeRejected();
            expect(save.calls.count()).toBe(2);

            if (lateSuccess) {
                finishLate(created);
            } else {
                failLate({data: {_message: 'Late failure'}});
            }
            await rejected;
            expect(scope.saving).toBe(false);
            expect(scope.resolve).not.toHaveBeenCalled();
            expect(scope.items[1].model).toEqual(lateSuccess ? created : undefined);

            save.and.callFake((model, metadata) => Promise.resolve({...model, ...metadata, _id: 'saved-id'}));
            await scope.save();
            expect(save.calls.argsFor(3)[0]).toEqual(lateSuccess ? created : {});
            expect(save.calls.argsFor(3)[1].staged_id).toBe(lateSuccess ? undefined : 'staged-id');
            expect(scope.resolve).toHaveBeenCalled();
        });
    });

    it('keeps an existing model retryable when its metadata update fails', async () => {
        const {scope, save, notify, add} = setup();
        const created = {_id: 'archive-id', _etag: 'created-etag'};
        const reason = {data: {_message: 'Update failed'}};

        await add(staged('ready'));
        scope.items[0].model = created;
        save.and.returnValue(Promise.reject(reason));
        await expectAsync(scope.save()).toBeRejectedWith(reason);
        expect(scope.resolve).not.toHaveBeenCalled();
        expect(notify.error).toHaveBeenCalledWith('Update failed');
        expect(scope.saving).toBe(false);
        expect(scope.items[0].model).toBe(created);

        save.and.returnValue(Promise.resolve({...created, _etag: 'updated-etag'}));
        await scope.save();
        expect(save.calls.count()).toBe(2);
        expect(save.calls.argsFor(1)[0]).toBe(created);
        expect(scope.items[0].model._etag).toBe('updated-etag');
    });

    it('always requests uncached processing snapshots', async () => {
        const {api, add, event} = setup();

        await add();
        await event(staged('processing'));
        await event(staged('ready'));
        expect(api.find.calls.count()).toBe(3);
        for (const args of api.find.calls.allArgs()) {
            expect(args).toEqual(['upload_staging', 'staged-id', {}, false]);
        }
    });

    it('waits for the digest to apply a snapshot before starting the next refresh', async () => {
        const {scope, api, add, listeners} = setup();

        await add();
        const callbacks = [];

        scope.$applyAsync = (callback) => callbacks.push(callback);
        api.find.and.returnValue(Promise.resolve(staged('ready')));
        listeners['upload_staging:updated']({}, {user: 'user', staged_id: 'staged-id'});
        listeners['upload_staging:updated']({}, {user: 'user', staged_id: 'staged-id'});
        for (let i = 0; i < 10; i++) {
            await Promise.resolve();
        }
        expect(api.find.calls.count()).toBe(2); // Initial GET plus the first event.
        expect(callbacks.length).toBe(1);
        callbacks.shift()();
        await scope.items[0].refresh;
        expect(scope.items[0].staged.status).toBe('ready');
        expect(api.find.calls.count()).toBe(2);
    });

    it('retries video confirmation with a fresh ETag', async () => {
        const {scope, api, add, event} = setup();

        await add(staged('awaiting_confirmation'), 'video/mp4');
        await event(staged('awaiting_confirmation'));
        const fresh = {...staged('awaiting_confirmation'), _etag: 'fresh'};
        let attempts = 0;

        api.update.and.callFake(() => ++attempts === 1
            ? Promise.reject({status: 412}) : Promise.resolve());
        api.find.and.returnValue(Promise.resolve(fresh));
        const saving = scope.save();

        for (let i = 0; i < 20; i++) {
            await Promise.resolve();
        }
        expect(api.update.calls.count()).toBe(2);
        expect(api.update.calls.mostRecent().args).toEqual(['upload_staging', fresh, {confirmed: true}]);
        await event(staged('ready'));
        await saving;
        expect(scope.resolve).toHaveBeenCalled();
    });

    it('removes the item from the UI without deleting its staging record', async () => {
        const {scope, api, add} = setup();

        await add();
        await scope.onRemoveItem(scope.pendingItems[0].meta);
        expect(scope.items.length).toBe(0);
        expect(scope.removing).toBe(false);
        expect(api.remove).not.toHaveBeenCalled();
    });

    it('does not confirm video again when the fresh snapshot is already ready', async () => {
        const {scope, api, add} = setup();

        await add(staged('awaiting_confirmation'), 'video/mp4');
        api.update.and.callFake(() => Promise.reject({status: 412}));
        api.find.and.returnValue(Promise.resolve({...staged('ready'), confirmed: true}));
        await scope.save();
        expect(api.update.calls.count()).toBe(1);
        expect(scope.resolve).toHaveBeenCalled();
    });

    it('confirms deferred video processing before waiting for ready', async () => {
        const {scope, api, save, add, event} = setup();

        await add(staged('awaiting_confirmation'), 'video/mp4');
        await event(staged('awaiting_confirmation'));
        api.find.and.returnValue(Promise.resolve(staged('processing')));
        const saving = scope.save();

        for (let i = 0; i < 5; i++) {
            await Promise.resolve();
        }
        expect(api.update).toHaveBeenCalledWith('upload_staging', staged('awaiting_confirmation'), {confirmed: true});
        expect(save).not.toHaveBeenCalled();
        await event(staged('ready'));
        await saving;
        expect(save.calls.count()).toBe(1);
    });

    it('does not time out video that is still waiting for user confirmation', async () => {
        const {scope, api, notify, timers, add} = setup();

        api.find.and.returnValue(Promise.resolve(staged('awaiting_confirmation')));
        await add(staged('awaiting_confirmation'), 'video/mp4');
        expect(scope.processing).toBe(false);
        timers[0].callback();
        expect(scope.failed).toBe(false);
        expect(scope.items[0].processingError).toBeUndefined();
        expect(notify.error).not.toHaveBeenCalled();
    });

    it('times out confirmed video still queued in awaiting_confirmation and releases Save', async () => {
        const {scope, api, save, notify, timers, add} = setup();
        const queued = {...staged('awaiting_confirmation'), confirmed: true};

        api.find.and.returnValue(Promise.resolve(staged('awaiting_confirmation')));
        await add(staged('awaiting_confirmation'), 'video/mp4');
        const refreshed = new Promise<void>((resolve) => {
            api.find.and.callFake(() => {
                resolve();
                return Promise.resolve(queued);
            });
        });
        const saving = scope.save();

        await refreshed;
        await scope.items[0].refresh;
        expect(api.update).toHaveBeenCalledWith('upload_staging', staged('awaiting_confirmation'), {confirmed: true});
        expect(scope.items[0].staged).toEqual(queued);
        expect(scope.processing).toBe(true);
        expect(scope.saving).toBe(true);
        expect(timers.length).toBe(2);
        timers[1].callback();

        await expectAsync(saving).toBeRejectedWithError('Media processing timed out. Remove the file and try again.');
        expect(scope.failed).toBe(true);
        expect(scope.saving).toBe(false);
        expect(scope.items[0].processingError).toBe('Media processing timed out. Remove the file and try again.');
        expect(notify.error).toHaveBeenCalled();
        expect(save).not.toHaveBeenCalled();
        expect(scope.resolve).not.toHaveBeenCalled();
    });

    it('times out successfully confirmed video even when the following status GET fails', async () => {
        const {scope, api, save, notify, timeout, timers, add} = setup();
        const unconfirmed = {...staged('awaiting_confirmation'), confirmed: false};

        api.find.and.returnValue(Promise.resolve(unconfirmed));
        await add(unconfirmed, 'video/mp4');
        expect(scope.items[0].processingConfirmed).toBe(false);
        const refreshed = new Promise<void>((resolve) => {
            api.find.and.callFake(() => {
                resolve();
                return Promise.reject({status: 503});
            });
        });
        const saving = scope.save();

        await refreshed;
        await scope.items[0].refresh;
        expect(api.update).toHaveBeenCalledWith('upload_staging', unconfirmed, {confirmed: true});
        expect(scope.items[0].processingConfirmed).toBe(true);
        expect(scope.items[0].staged.confirmed).toBe(false);
        expect(scope.items[0].staged.status).toBe('awaiting_confirmation');
        expect(scope.processing).toBe(true);
        expect(notify.warning).toHaveBeenCalledWith('Unable to check media processing status.');
        expect(scope.failed).toBe(false);
        expect(scope.saving).toBe(true);
        expect(timers.length).toBe(2);
        expect(timeout.cancel).not.toHaveBeenCalledWith(timers[1]);

        timers[1].callback();
        await expectAsync(saving).toBeRejectedWithError('Media processing timed out. Remove the file and try again.');
        expect(scope.failed).toBe(true);
        expect(scope.saving).toBe(false);
        expect(scope.items[0].processingError).toBe('Media processing timed out. Remove the file and try again.');
        expect(notify.error).toHaveBeenCalled();
        expect(save).not.toHaveBeenCalled();
        expect(scope.resolve).not.toHaveBeenCalled();
    });

    it('retains fetched confirmation when a later snapshot is unconfirmed', async () => {
        const {scope, api, add, event, timers} = setup();
        const queued = {...staged('awaiting_confirmation'), confirmed: true};

        api.find.and.returnValue(Promise.resolve(queued));
        await add(queued, 'video/mp4');
        expect(scope.items[0].processingConfirmed).toBe(true);
        expect(scope.processing).toBe(true);
        await event({...queued, confirmed: false});
        expect(scope.items[0].processingConfirmed).toBe(true);
        expect(scope.processing).toBe(true);

        const saving = scope.save();

        timers[0].callback();
        await expectAsync(saving).toBeRejected();
        expect(api.update).not.toHaveBeenCalled();
        expect(scope.failed).toBe(true);
        expect(scope.saving).toBe(false);
    });

    it('ignores a ready response arriving after the processing deadline', async () => {
        const {scope, api, add, listeners, timers, notify} = setup();

        await add(staged('processing'));
        let finishRead: (response: ReturnType<typeof staged>) => void;
        let readStarted: () => void;
        const started = new Promise<void>((resolve) => readStarted = resolve);

        api.find.and.callFake(() => {
            readStarted();
            return new Promise((resolve) => finishRead = resolve);
        });
        listeners['connected']();
        await started;
        timers[0].callback();
        const error = scope.items[0].processingError;

        finishRead(staged('ready'));
        await scope.items[0].refresh;
        expect(scope.items[0].staged.status).toBe('failed');
        expect(scope.items[0].processingError).toBe(error);
        expect(scope.failed).toBe(true);
        await expectAsync(scope.items[0].ready.promise).toBeRejectedWithError(error);
        await expectAsync(scope.save()).toBeRejected();
        const reads = api.find.calls.count();

        listeners['connected']();
        await scope.items[0].refresh;
        expect(api.find.calls.count()).toBe(reads);
        expect(notify.error.calls.count()).toBe(1);
    });

    it('does not refresh a terminal server processing failure', async () => {
        const {scope, api, add, event, notify} = setup();

        await add();
        await event({...staged('failed'), error: 'Worker failed'});
        const reads = api.find.calls.count();

        await event(staged('ready'));
        expect(api.find.calls.count()).toBe(reads);
        expect(scope.items[0].staged.status).toBe('failed');
        expect(scope.items[0].processingError).toBe('Worker failed');
        expect(scope.failed).toBe(true);
        expect(notify.error.calls.count()).toBe(1);
        await expectAsync(scope.items[0].ready.promise).toBeRejectedWithError('Worker failed');
    });

    it('recovers missed events on websocket reconnect', async () => {
        const {scope, add, event} = setup();

        await add();
        await event(staged('ready', 'ready', {headline: 'Recovered'}), 'connected');
        expect(scope.imagesMetadata[0].headline).toBe('Recovered');
        expect(scope.processing).toBe(false);
    });

    [-1, 503].forEach((status) => {
        it(`recovers pending metadata after an initial status GET fails with ${status}`, async () => {
            const {scope, api, notify, timeout, timers, add, event} = setup();

            api.find.and.callFake(() => Promise.reject({status}));
            await add();
            expect(notify.warning).toHaveBeenCalledWith('Unable to check media processing status.');
            expect(notify.error).not.toHaveBeenCalled();
            expect(scope.failed).toBe(false);
            expect(scope.items[0].processingError).toBeUndefined();
            expect(scope.items[0].staged.status).toBe('processing');
            expect(scope.pendingItems.length).toBe(1);
            expect(timers.length).toBe(1);
            expect(timeout.cancel).not.toHaveBeenCalledWith(timers[0]);

            await event(staged('ready', 'ready', {headline: 'Recovered'}), 'connected');
            expect(scope.pendingItems.length).toBe(0);
            expect(scope.imagesMetadata[0].headline).toBe('Recovered');
            await scope.save();
            expect(scope.resolve).toHaveBeenCalled();
        });
    });

    it('keeps Upload pending through a status read failure until a later refresh is ready', async () => {
        const {scope, api, save, notify, timeout, timers, listeners, add, event} = setup();

        await add(staged('processing'));
        const saving = scope.save();
        const deadline = timers[0];

        api.find.and.callFake(() => Promise.reject({status: 503, data: {_message: 'Service unavailable'}}));
        listeners['upload_staging:updated']({}, {user: 'user', staged_id: 'staged-id'});
        await scope.items[0].refresh;
        expect(notify.warning).toHaveBeenCalledWith('Service unavailable');
        expect(scope.saving).toBe(true);
        expect(scope.failed).toBe(false);
        expect(save).not.toHaveBeenCalled();
        expect(timeout.cancel).not.toHaveBeenCalledWith(deadline);
        expect(timers.length).toBe(1);

        await event(staged('ready'), 'connected');
        await saving;
        expect(save.calls.count()).toBe(1);
        expect(scope.resolve).toHaveBeenCalled();
        expect(timeout.cancel).toHaveBeenCalledWith(deadline);
    });

    it('still fails at the original deadline after a status read failure', async () => {
        const {scope, api, save, notify, timers, listeners, add} = setup();

        await add(staged('processing'));
        const saving = scope.save();

        api.find.and.callFake(() => Promise.reject({status: 503}));
        listeners['connected']();
        await scope.items[0].refresh;
        expect(scope.failed).toBe(false);
        expect(timers.length).toBe(1);
        timers[0].callback();
        await expectAsync(saving).toBeRejected();
        expect(scope.failed).toBe(true);
        expect(notify.error).toHaveBeenCalled();
        expect(save).not.toHaveBeenCalled();
    });

    it('allows manual entry after metadata failure', async () => {
        const {scope, notify, add, event} = setup();

        await add();
        await event(staged('ready', 'failed'));
        expect(notify.warning).toHaveBeenCalled();
        expect(scope.imagesMetadata.length).toBe(1);
        expect(scope.failed).toBe(false);
        await scope.save();
        expect(scope.resolve).toHaveBeenCalled();
    });

    it('rejects a confirmed upload when rendition generation fails', async () => {
        const {scope, notify, save, add, event} = setup();

        await add();
        await event(staged('processing'));
        const saving = scope.save().then(() => false, () => true);

        await event(staged('failed'));
        expect(await saving).toBe(true);
        expect(notify.error).toHaveBeenCalled();
        expect(save).not.toHaveBeenCalled();
    });

    it('cancels the processing deadline and removes the item from the UI', async () => {
        const {scope, api, timeout, add, event} = setup();

        await add();
        await event(staged('processing'));
        await scope.onRemoveItem(scope.imagesMetadata[0]);
        expect(timeout.cancel).toHaveBeenCalled();
        expect(api.remove).not.toHaveBeenCalled();
        expect(scope.imagesMetadata.length).toBe(0);
    });

    it('does not delete uploads whose POST finishes after cancelling the dialog', async () => {
        const {scope, api, timers, add} = setup();

        await add(staged(), 'audio/mpeg', true);
        expect(api.remove).not.toHaveBeenCalled();
        expect(scope.items.length).toBe(0);
        expect(scope.imagesMetadata.length).toBe(0);
        expect(timers.length).toBe(0);
    });

    it('surfaces a processing timeout without any periodic status queries', async () => {
        const {scope, timers, api, notify, add} = setup();

        await add();
        timers[0].callback();
        expect(scope.failed).toBe(true);
        expect(api.find.calls.count()).toBe(1);
        expect(notify.error).toHaveBeenCalled();
    });
});
