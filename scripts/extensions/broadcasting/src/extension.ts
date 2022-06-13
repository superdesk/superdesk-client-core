import {IExtension} from 'superdesk-api';
import {superdesk} from './superdesk';

const {gettext} = superdesk.localization;

const str = gettext('Hello broadcasting');

const extension: IExtension = {
    activate: () => {
        superdesk.ui.alert(str);

        return Promise.resolve({});
    },
};

export default extension;
