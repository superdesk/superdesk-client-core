import {IExtensionActivationResult, IArticleAction} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {gettext} from 'core/utils';
import {runTansa} from '../editor3-tansa-integration';
import {getEditor3Field} from './editor3';
import {registerInternalExtension} from 'core/helpers/register-internal-extension';

export function registerAuthoringReactFields() {
    const result: IExtensionActivationResult = {
        contributions: {
            getAuthoringActions: (article, contentProfile, fieldsData) => {
                if (appConfig.features.useTansaProofing === true) {
                    const checkSpellingAction: IArticleAction = {
                        label: gettext('Check spelling'),
                        onTrigger: () => {
                            runTansa(contentProfile, fieldsData);
                        },
                    };

                    return Promise.resolve([checkSpellingAction]);
                } else {
                    return Promise.resolve([]);
                }
            },
            customFieldTypes: [
                getEditor3Field(),
            ],
        },
    };

    registerInternalExtension('authoring-react--fields', result);
}
