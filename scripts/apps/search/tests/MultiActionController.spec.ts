import {MultiActionBarController} from '../controllers';
import {registerExtensions} from 'core/register-extensions';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import {ISuperdeskGlobalConfig} from 'superdesk-api';
import {appConfig} from 'appConfig';

describe('Multi Action Bar', () => {
    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.apps.archive'));
    beforeEach(window.module('superdesk.apps.search'));
    beforeEach(window.module('superdesk.apps.authoring'));

    beforeEach(() => {
        const testConfig: Partial<ISuperdeskGlobalConfig> = {
            model: {
                timeformat: 'HH:mm:ss',
                dateformat: 'DD/MM/YYYY',
            },
            view: {
                timeformat: 'HH:mm',
                dateformat: 'MM/DD/YYYY',
            },
            defaultTimezone: 'Europe/London',
            server: {url: undefined, ws: undefined},
        };

        Object.assign(appConfig, testConfig);
    });

    it('spike does not prompt if confirm_spike is to false',
        (done) => inject(($controller, $rootScope, multi, modal, $q, spike) => {
            const testConfig: Partial<ISuperdeskGlobalConfig> = {
                confirm_spike: false,
            };

            Object.assign(appConfig, testConfig);

            const itemlist = [
                {
                    _id: 'foo1',
                    _type: 'archive',
                    task: {desk: 'desk1', stage: 'stage1'},
                    type: 'text',
                },
                {
                    _id: 'foo2',
                    _type: 'archive',
                    task: {desk: 'desk1', stage: 'stage1'},
                    type: 'text',
                },
            ];

            spyOn(multi, 'getItems').and.returnValue(itemlist);
            spyOn(multi, 'reset');
            spyOn(modal, 'confirm').and.returnValue($q.when({}));
            spyOn(spike, 'spikeMultiple').and.returnValue($q.when({}));

            const ctrl = $controller(MultiActionBarController, {});

            ctrl.spikeItems();
            $rootScope.$digest();

            setTimeout(() => {
                expect(multi.getItems).toHaveBeenCalled();
                expect(modal.confirm).not.toHaveBeenCalled();
                expect(spike.spikeMultiple).toHaveBeenCalled();
                expect(multi.reset).toHaveBeenCalled();
                done();
            });
        }));

    it('onSpikeMultiple middleware is called',
        (done) => inject((
            superdesk,
            $controller,
            privileges,
            modal,
            lock,
            session,
            authoringWorkspace: AuthoringWorkspaceService,
            metadata,
        ) => {
            const testConfig: Partial<ISuperdeskGlobalConfig> = {
                confirm_spike: true,
            };

            Object.assign(appConfig, testConfig);

            const extensionDelay = 1000;

            const articleEntities = {
                onSpikeMultiple: () => {
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            resolve({});
                        }, extensionDelay);
                    });
                },
            };

            registerExtensions(
                [
                    {
                        id: 'test-extension',
                        activate: () => {
                            return Promise.resolve({
                                contributions: {
                                    entities: {
                                        article: articleEntities,
                                    },
                                },
                            });
                        },
                    },
                ],
                superdesk,
                modal,
                privileges,
                lock,
                session,
                authoringWorkspace,
                appConfig,
                metadata,
            ).then(() => {
                const ctrl = $controller(MultiActionBarController, {});

                spyOn(modal, 'createCustomModal').and.callThrough(); // called after middlewares;

                ctrl.spikeItems();

                setTimeout(() => {
                    expect(modal.createCustomModal).not.toHaveBeenCalled();
                }, extensionDelay - 50);

                setTimeout(() => {
                    expect(modal.createCustomModal).toHaveBeenCalled();
                    done();
                }, extensionDelay + 50);
            }).catch(done.fail);
        }));
});
