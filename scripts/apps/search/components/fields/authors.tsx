/* eslint-disable react/no-multi-comp */

import React from 'react';

import {IUser, IRestApiResponse, IVocabulary, IVocabularyItem, IAuthorsFieldOptions} from 'superdesk-api';
import {IPropsItemListInfo} from '../ListItemInfo';
import {SuperdeskReactComponent} from 'core/SuperdeskReactComponent';
import {getVocabularyItemNameTranslated, gettext} from 'core/utils';
import {Popover} from 'superdesk-ui-framework/react';

interface IProps {
    authors: Array<{userId: IUser['_id'], roleId: string}>;
    options: IAuthorsFieldOptions;
}

interface IState {
    authors?: Array<{user: IUser, roleQcode: string}>;
    vocabularyItems?: Map<string, IVocabularyItem>; // indexed by qcode
}

const SEPARATOR = <span style={{opacity: 0.5}}> / </span>;
const AUTHORS_TO_SHOW_AT_ONCE: number = 2;

export class AuthorsComponent extends SuperdeskReactComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {};
    }
    componentDidMount() {
        const {authors} = this.props;

        const rolesByUserId = authors.reduce((acc, item) => {
            acc[item.userId] = item.roleId;

            return acc;
        }, {});

        const userIds = authors.map(({userId}) => userId);

        const getUsers = () => this.asyncHelpers.httpRequestJsonLocal<IRestApiResponse<IUser>>({
            method: 'GET',
            path: `/users?where=${JSON.stringify({_id: {$in: userIds}})}`,
        });

        const getAuthorRolesVocabulary = () => this.asyncHelpers.httpRequestJsonLocal<IVocabulary>({
            method: 'GET',
            path: '/vocabularies/author_roles',
        });

        Promise.all([
            getUsers(),
            getAuthorRolesVocabulary(),
        ]).then(([usersResponse, authorRolesVocabulary]) => {
            const vocabularyItems = new Map<string, IVocabularyItem>();

            authorRolesVocabulary?.items?.forEach((item) => {
                vocabularyItems.set(item.qcode, item);
            });

            this.setState({
                vocabularyItems,
                authors: usersResponse._items.map((user) => ({user, roleQcode: rolesByUserId[user._id]})),
            });
        });
    }
    render() {
        if (this.state.authors == null) {
            return null;
        }

        const {vocabularyItems} = this.state;
        const {options} = this.props;

        function renderAuthorRole(roleQcode: string) {
            return (
                <em style={{opacity: 0.85, fontWeight: 'normal'}}>
                    {getVocabularyItemNameTranslated(vocabularyItems.get(roleQcode))}:{' '}
                </em>
            );
        }

        function renderUser(user: IUser) {
            return (
                <strong>{user[options.displayField] ?? user.display_name}</strong>
            );
        }

        return (
            <span className="container" style={{marginRight: '1.2rem'}}>
                {
                    this.state.authors.slice(0, AUTHORS_TO_SHOW_AT_ONCE).map(({user, roleQcode}, index) => (
                        <span key={user._id}>
                            {index > 0 && SEPARATOR}
                            <span>{renderAuthorRole(roleQcode)}</span>
                            <span>{renderUser(user)}</span>{' '}
                        </span>
                    ))
                }

                {
                    this.state.authors.length > AUTHORS_TO_SHOW_AT_ONCE && (
                        <span>
                            {SEPARATOR}

                            <button
                                id="more-authors-button"
                                className="icon-button--small"
                                aria-label={gettext('All authors')}
                            >
                                <i className="icon-dots" />
                            </button>

                            <Popover
                                title={gettext('Authors')}
                                placement="bottom-end"
                                triggerSelector="#more-authors-button"
                                zIndex={1031}
                            >
                                <table style={{lineHeight: 1.5}}>
                                    <tbody>
                                        {
                                            this.state.authors.map(({user, roleQcode}) => (
                                                <tr key={user._id}>
                                                    <td style={{paddingRight: 4, opacity: 0.6}}>
                                                        {renderAuthorRole(roleQcode)}
                                                    </td>
                                                    <td>{renderUser(user)}</td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </Popover>
                        </span>
                    )
                }
            </span>
        );
    }
}

export class Authors extends React.PureComponent<IPropsItemListInfo> {
    render() {
        const options: IAuthorsFieldOptions = this.props.options;

        if ((this.props.item.authors) == null || options == null) {
            return null;
        }

        const allAuthors = this.props.item.authors.map(({_id}) => ({userId: _id[0], roleId: _id[1]}));
        const authors = allAuthors.filter(({roleId}) => options.includeRoles.includes(roleId));

        if (authors.length < 1) {
            return null;
        }

        return (
            <AuthorsComponent
                key={JSON.stringify(this.props.item.authors)} // force component to remount and re-initialize state
                authors={authors}
                options={options}
            />
        );
    }
}
