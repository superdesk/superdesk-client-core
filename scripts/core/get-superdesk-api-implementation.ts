import {ISuperdesk, IExtensions} from 'superdesk-api';
import {gettext} from 'core/utils';
import {getGenericListPageComponent} from './ui/components/ListPage/generic-list-page';
import {ListItem, ListItemColumn, ListItemActionsMenu} from './components/ListItem';
import {getFormFieldPreviewComponent} from './ui/components/generic-form/form-field';
import {
    isIFormGroupCollapsible,
    isIFormGroup,
    isIFormField,
    FormFieldType,
} from './ui/components/generic-form/interfaces/form';
import {UserHtmlSingleLine} from './helpers/UserHtmlSingleLine';
import {Row, Item, Column} from './ui/components/List';
import {connectCrudManager} from './helpers/CrudManager';
import {generateFilterForServer} from './ui/components/generic-form/generate-filter-for-server';

export function getSuperdeskApiImplementation(
    requestingExtensionId: string,
    extensions: IExtensions,
    modal,
): ISuperdesk {
    return {
        helpers: {
            getGenericListPageComponent,
            getFormFieldPreviewComponent,
            ListItem,
            List: {
                Item,
                Row,
                Column,
            },
            ListItemColumn,
            ListItemActionsMenu,
            isIFormGroupCollapsible,
            isIFormGroup,
            isIFormField,
            FormFieldType,
            UserHtmlSingleLine,
            connectCrudManager,
            generateFilterForServer,
        },
        ui: {
            alert: (message: string) => modal.alert({bodyText: message}),
            confirm: (message: string) => new Promise((resolve) => {
                modal.confirm(message, gettext('Cancel'))
                    .then(() => resolve(true))
                    .catch(() => resolve(false));
            }),
        },
        localization: {
            gettext: (message) => gettext(message),
        },
        extensions: {
            getExtension: (id: string) => {
                const extension = extensions[id].extension;

                if (extension == null) {
                    return Promise.reject('Extension not found.');
                }

                const {manifest} = extensions[requestingExtensionId];

                if (
                    manifest.superdeskExtension != null
                    && Array.isArray(manifest.superdeskExtension.dependencies)
                    && manifest.superdeskExtension.dependencies.includes(id)
                ) {
                    const extensionShallowCopy = {...extension};

                    delete extensionShallowCopy['activate'];

                    return Promise.resolve(extensionShallowCopy);
                } else {
                    return Promise.reject('Not authorized.');
                }
            },
        },
    };
}
