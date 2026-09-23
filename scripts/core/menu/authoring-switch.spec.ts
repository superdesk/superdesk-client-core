import {getField} from 'apps/fields';
import {
    AUTHORING_REACT_FIELDS,
} from 'apps/authoring-react/fields/register-fields';
import {authoringReactWidgetsExtension} from 'apps/authoring-react/manage-widget-registration';
import {unregisterInternalExtension} from 'core/helpers/register-internal-extension';
import {setupAuthoringReact} from './authoring-switch';

describe('setupAuthoringReact', () => {
    afterEach(() => {
        unregisterInternalExtension(authoringReactWidgetsExtension);
        unregisterInternalExtension(AUTHORING_REACT_FIELDS);
    });

    it('keeps field types registered after navigating away from Planning', () => {
        setupAuthoringReact('http://localhost/#/planning');
        expect(getField('editor3')).not.toBeNull();

        setupAuthoringReact('http://localhost/#/dashboard');
        expect(getField('editor3')).not.toBeNull();
    });
});