/* eslint-disable react/display-name */
/* eslint-disable react/no-multi-comp */
import {
    IArticle,
    IAuthoringFieldV2,
    IFieldAdapter,
    IEditor3Config,
    IRestApiResponse,
    ITreeWithLookup,
    IUser,
    IEditor3ValueOperational,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {retrieveStoredValueEditor3Generic, storeEditor3ValueBase} from '.';
import {appConfig} from 'appConfig';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {ReactNode} from 'react';
import React from 'react';
import {MultiSelectTreeWithTemplate} from 'core/ui/components/MultiSelectTreeWithTemplate';
import {convertToRaw, ContentState} from 'draft-js';
import {editor3ToOperationalFormat} from '../fields/editor3';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {Spacer} from 'superdesk-ui-framework/react';

interface IProps {
    onChange: (value: IEditor3ValueOperational) => void;
    readOnly: boolean;
    language: string;
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
                        const val = editor3ToOperationalFormat(
                            {
                                rawContentState: convertToRaw(
                                    ContentState.createFromText(value[0][appConfig.user.sign_off_mapping]),
                                ),
                            },
                            this.props.language,
                        );

                        this.props.onChange(val);
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
    getFieldV2: (_, fieldSchema) => {
        const allowUserDropdown = appConfig.user != null && appConfig.user.sign_off_mapping;

        const fieldConfig: IEditor3Config = {
            minLength: fieldSchema?.minlength,
            maxLength: fieldSchema?.maxlength,
            singleLine: true,
            helperComponent: allowUserDropdown
                ? ({onChange, language, readOnly}) => {
                    return (
                        <UsersDropdown
                            onChange={onChange}
                            language={language}
                            readOnly={readOnly}
                        />
                    );
                } : undefined,
        };

        const fieldV2: IAuthoringFieldV2 = {
            id: 'sign_off',
            name: gettext('Sign Off'),
            fieldType: 'editor3',
            fieldConfig,
        };

        return fieldV2;
    },

    retrieveStoredValue: (item: IArticle, authoringStorage) => retrieveStoredValueEditor3Generic(
        'sign_off',
        item,
        authoringStorage,
    ),

    storeValue: (value, item, config) => {
        const result = storeEditor3ValueBase(
            'sign_off',
            item,
            value,
            config,
        );

        const articleUpdated = {...result.article};

        articleUpdated.sign_off = result.stringValue;

        return articleUpdated;
    },
};
