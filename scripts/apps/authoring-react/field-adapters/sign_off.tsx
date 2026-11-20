/* eslint-disable react/display-name */
/* eslint-disable react/no-multi-comp */
import {
    IArticle,
    IAuthoringFieldV2,
    IFieldAdapter,
    IPlainTextFieldConfig,
    IPlainTextFieldValueOperational,
    IRestApiResponse,
    ITreeWithLookup,
    IUser,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {ReactNode} from 'react';
import React from 'react';
import {MultiSelectTreeWithTemplate} from 'core/ui/components/MultiSelectTreeWithTemplate';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {Spacer} from 'superdesk-ui-framework/react';

interface IProps {
    onChange: (value: IPlainTextFieldValueOperational) => void;
    readOnly: boolean;
}

class UsersDropdown extends React.Component<IProps> {
    render(): ReactNode {
        return (
            <div
                style={{
                    marginBlockStart: 8,
                    marginBlockEnd: 8,
                }}
            >
                <MultiSelectTreeWithTemplate
                    kind="asynchronous"
                    searchOptions={(term, callback) => {
                        const abortController = new AbortController();

                        httpRequestJsonLocal<IRestApiResponse<IUser>>({
                            method: 'GET',
                            path: '/users',
                            urlParams: {
                                where: {display_name: term},
                                max_results: 50,
                            },
                            abortSignal: abortController.signal,
                        }).then((res) => {
                            const tree: ITreeWithLookup<IUser> = {
                                nodes: res._items.map((user) => ({value: user})),
                                lookup: {},
                            };

                            callback(tree);
                        });

                        return () => abortController.abort();
                    }}
                    values={[] as Array<IUser>}
                    onChange={(value) => {
                        this.props.onChange(value[0][appConfig.user.sign_off_mapping]);
                    }}
                    readOnly={this.props.readOnly}
                    optionTemplate={
                        ({item}) => (
                            <Spacer h gap="8" noGrow>
                                <UserAvatar user={item} size="small" />
                                <span>{item[appConfig.user.sign_off_mapping]}</span>
                            </Spacer>
                        )
                    }
                    getId={(option) => option._id}
                    getLabel={(option) => option[appConfig.user.sign_off_mapping]}
                />
            </div>
        );
    }
}

export const sign_off: IFieldAdapter<IArticle> = {
    getFieldV2: (_fieldEditor, fieldSchema) => {
        const allowUserDropdown = appConfig.user != null && appConfig.user.sign_off_mapping;

        const fieldConfig: IPlainTextFieldConfig = {
            lockable: true,
            maxLength: fieldSchema?.maxlength,
            helperComponent: allowUserDropdown
                ? ({onChange, readOnly}) => <UsersDropdown onChange={onChange} readOnly={readOnly} />
                : undefined,
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'sign_off',
            name: gettext('Sign Off'),
            fieldType: 'plain-text',
            fieldConfig,
        };

        return fieldV2;
    },

    retrieveStoredValue: (item: IArticle) => item.sign_off ?? null,

    storeValue: (value: IPlainTextFieldValueOperational, item) => {
        // a `null` written over a missing value would be sent on save, and the server skips the append
        // whenever `sign_off` is in the update
        const articleUpdated: IArticle = value == null && item.sign_off == null
            ? {...item}
            : {...item, sign_off: value};

        // Left over from when sign off was an editor3 field. The server rebuilds any field in `fields_meta`
        // as HTML on save, which would wrap sign off in `<p>` and skip the append.
        if (item.fields_meta?.sign_off != null) {
            const {sign_off: _removed, ...fieldsMetaRest} = item.fields_meta;

            articleUpdated.fields_meta = fieldsMetaRest;
        }

        return articleUpdated;
    },
};
