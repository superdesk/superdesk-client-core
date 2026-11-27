import React from 'react';
import {shallow} from 'enzyme';
import {IArticle, IMediaConfig} from 'superdesk-api';
import ng from 'core/services/ng';
import {Editor} from './editor';

const featureMediaConfig: IMediaConfig = {
    maxItems: 1,
    allowPicture: true,
    allowVideo: true,
    allowAudio: true,
    allowedWorkflows: {inProgress: true, published: true},
};

// the file picker's `accept` attribute; its order does not matter to browsers
const ACCEPT: {[allowed: string]: string} = {
    '{"allowPicture":false,"allowVideo":false,"allowAudio":false}': '',
    '{"allowPicture":false,"allowVideo":false,"allowAudio":true}': 'audio/*',
    '{"allowPicture":false,"allowVideo":true,"allowAudio":false}': 'video/*',
    '{"allowPicture":false,"allowVideo":true,"allowAudio":true}': 'video/*,audio/*',
    '{"allowPicture":true,"allowVideo":false,"allowAudio":false}': 'image/*',
    '{"allowPicture":true,"allowVideo":false,"allowAudio":true}': 'image/*,audio/*',
    '{"allowPicture":true,"allowVideo":true,"allowAudio":false}': 'image/*,video/*',
    '{"allowPicture":true,"allowVideo":true,"allowAudio":true}': 'image/*,video/*,audio/*',
};

describe('authoring-react media field editor', () => {
    let notifyError: jasmine.Spy;
    let dropItem: jasmine.Spy;
    let uploadIntent: jasmine.Spy;
    let onChange: jasmine.Spy;

    beforeEach(() => {
        notifyError = jasmine.createSpy('error');
        dropItem = jasmine.createSpy('dropItem');
        uploadIntent = jasmine.createSpy('intent').and.returnValue(new Promise(() => undefined));
        onChange = jasmine.createSpy('onChange');

        spyOn(ng, 'get').and.callFake((service: string) => {
            switch (service) {
                case 'notify':
                    return {error: notifyError};
                case 'content':
                    return {dropItem};
                case 'superdesk':
                    return {intent: uploadIntent};
                default:
                    return null;
            }
        });
    });

    function drop(config: IMediaConfig, dataTransfer: {types: Array<string>, files?: Array<File>, data?: {}}) {
        const props = {
            config,
            value: [],
            onChange,
            readOnly: false,
            container: ({children}) => <div>{children}</div>,
        } as any;
        const editor = shallow(<Editor {...props} />).instance() as any;

        editor.handleDragDrop({
            dataTransfer: {
                types: dataTransfer.types,
                files: dataTransfer.files ?? [],
                getData: () => JSON.stringify(dataTransfer.data),
            },
        });
    }

    function image(name: string): File {
        return new File([''], name, {type: 'image/jpeg'});
    }

    it('refuses more files than the field has room for', () => {
        drop(featureMediaConfig, {types: ['Files'], files: [image('a.jpg'), image('b.jpg')]});

        expect(notifyError).toHaveBeenCalledWith('Select at most 1 file to upload.', undefined, undefined);
        expect(uploadIntent).not.toHaveBeenCalled();
    });

    it('refuses a file that is not media', () => {
        drop(featureMediaConfig, {types: ['Files'], files: [new File([''], 'notes.txt', {type: 'text/plain'})]});

        expect(notifyError).toHaveBeenCalledWith(
            'Only the following media types are allowed: image, video, audio',
            undefined,
            undefined,
        );
        expect(uploadIntent).not.toHaveBeenCalled();
    });

    it('passes the allowed media types to the upload', () => {
        drop({...featureMediaConfig, allowAudio: false}, {types: ['Files'], files: [image('a.jpg')]});

        expect(uploadIntent).toHaveBeenCalledWith('upload', 'media', jasmine.objectContaining({
            allowPicture: true,
            allowVideo: true,
            allowAudio: false,
        }));
    });

    it('refuses a dropped item that is locked, judging by its current state rather than the drag payload', (done) => {
        const picture = {_id: 'picture1', _type: 'archive', type: 'picture', state: 'in_progress'} as IArticle;

        dropItem.and.returnValue(Promise.resolve({...picture, lock_user: 'user-2'}));

        drop(featureMediaConfig, {types: ['application/superdesk.item.picture'], data: picture});

        setTimeout(() => {
            expect(dropItem).toHaveBeenCalledWith(picture);
            expect(notifyError)
                .toHaveBeenCalledWith('Item is locked. Cannot associate media item.', undefined, undefined);
            expect(onChange).not.toHaveBeenCalled();
            done();
        });
    });

    describe('for every combination of allowed media kinds', () => {
        const combinations: Array<Pick<IMediaConfig, 'allowPicture' | 'allowVideo' | 'allowAudio'>> = [];

        [false, true].forEach((allowPicture) => {
            [false, true].forEach((allowVideo) => {
                [false, true].forEach((allowAudio) => {
                    combinations.push({allowPicture, allowVideo, allowAudio});
                });
            });
        });

        function getRefusalMessage(allowed: Pick<IMediaConfig, 'allowPicture' | 'allowVideo' | 'allowAudio'>): string {
            const types = [
                allowed.allowPicture ? 'image' : null,
                allowed.allowVideo ? 'video' : null,
                allowed.allowAudio ? 'audio' : null,
            ].filter((type) => type != null);

            return `Only the following media types are allowed: ${types.join(', ')}`;
        }

        combinations.forEach((allowed) => {
            const config = {...featureMediaConfig, ...allowed};
            const refusal = getRefusalMessage(allowed);
            const name = JSON.stringify(allowed);

            it(`accepts and refuses files by their type, ${name}`, () => {
                const files = [
                    {file: image('a.jpg'), allowed: allowed.allowPicture},
                    {file: new File([''], 'a.mp4', {type: 'video/mp4'}), allowed: allowed.allowVideo},
                    {file: new File([''], 'a.mp3', {type: 'audio/mpeg'}), allowed: allowed.allowAudio},
                    {file: new File([''], 'notes.txt', {type: 'text/plain'}), allowed: false},
                ];

                files.forEach(({file, allowed: isAllowed}) => {
                    notifyError.calls.reset();
                    uploadIntent.calls.reset();

                    drop(config, {types: ['Files'], files: [file]});

                    if (isAllowed) {
                        expect(uploadIntent).toHaveBeenCalled();
                        expect(notifyError).not.toHaveBeenCalled();
                    } else {
                        expect(uploadIntent).not.toHaveBeenCalled();
                        expect(notifyError).toHaveBeenCalledWith(refusal, undefined, undefined);
                    }
                });
            });

            it(`accepts and refuses dropped items by their type, ${name}`, () => {
                const items = [
                    {type: 'application/superdesk.item.picture', allowed: allowed.allowPicture},
                    {type: 'application/superdesk.item.graphic', allowed: allowed.allowPicture},
                    {type: 'application/superdesk.item.video', allowed: allowed.allowVideo},
                    {type: 'application/superdesk.item.audio', allowed: allowed.allowAudio},
                ];

                dropItem.and.returnValue(new Promise(() => undefined));

                items.forEach(({type, allowed: isAllowed}) => {
                    notifyError.calls.reset();
                    dropItem.calls.reset();

                    drop(config, {types: [type], data: {_id: 'item1'}});

                    if (isAllowed) {
                        expect(dropItem).toHaveBeenCalled();
                        expect(notifyError).not.toHaveBeenCalled();
                    } else {
                        expect(dropItem).not.toHaveBeenCalled();
                        expect(notifyError).toHaveBeenCalledWith(refusal, undefined, undefined);
                    }
                });
            });

            it(`offers the allowed file types to the file picker, ${name}`, () => {
                const props = {config, value: [], onChange, readOnly: false, container: () => null} as any;
                const editor = shallow(<Editor {...props} />).instance() as any;

                expect(editor.getAllowedMimeTypes()).toBe(ACCEPT[name]);
            });
        });
    });

    it('adds a dropped item that is not locked', (done) => {
        const picture = {_id: 'picture1', _type: 'archive', type: 'picture', state: 'in_progress'} as IArticle;

        dropItem.and.returnValue(Promise.resolve(picture));

        drop(featureMediaConfig, {types: ['application/superdesk.item.picture'], data: picture});

        setTimeout(() => {
            expect(notifyError).not.toHaveBeenCalled();
            expect(onChange).toHaveBeenCalledWith([picture]);
            done();
        });
    });
});
