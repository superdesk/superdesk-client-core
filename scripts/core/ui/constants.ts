export const LEFT_SIDEBAR_WIDTH = 48;
import {getGenericErrorMessage} from 'core/ui/constants';
import {gettext} from 'core/ui/components/utils';

export const getGenericErrorMessage = () =>
    gettext('Unknow error occured. Try repeating the action or reloading the page.');
