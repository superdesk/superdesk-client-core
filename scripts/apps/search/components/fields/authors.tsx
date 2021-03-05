/* eslint-disable react/no-multi-comp */

import React from 'react';

import {IUser, IVocabulary, IVocabularyItem, IArticle} from 'superdesk-api';
import {IPropsItemListInfo} from '../ListItemInfo';
import {SuperdeskReactComponent} from 'core/SuperdeskReactComponent';
import {getVocabularyItemNameTranslated, gettext} from 'core/utils';
import {Popover} from 'superdesk-ui-framework/react';
import {IRelatedEntitiesToFetch} from '.';

const SEPARATOR = <span style={{opacity: 0.5}}> / </span>;
const AUTHORS_TO_SHOW_AT_ONCE: number = 2;

export class Authors extends SuperdeskReactComponent<IPropsItemListInfo> {
    public static getRelatedEntities(item: IArticle): IRelatedEntitiesToFetch {
        if (item.authors == null) {
            return [];
        } else {
            const userIds = item.authors.map((author) => ({collection: 'users', id: author._id[0]}));

            return [
                ...userIds,
                {collection: 'vocabularies', id: 'author_roles'},
            ];
        }
    }

    private related: {
        getUser: (id: string) => IUser;
        getAuthorRole: (id: string) => IVocabularyItem;
    };

    constructor(props: IPropsItemListInfo) {
        super(props);

        this.related = {
            getUser: (id) => this.props.relatedEntities['users'].get(id),
            getAuthorRole: (qcode: string) => {
                const authorRoles: IVocabulary = this.props.relatedEntities['vocabularies'].get('author_roles');

                return authorRoles.items.find((role) => role.qcode === qcode);
            },
        };
    }

    render() {
        const {options} = this.props;

        if (this.props.item.authors == null || options == null) {
            return null;
        }

        const authors = this.props.item.authors
            .map(({_id}) => ({userId: _id[0], roleId: _id[1]}))
            .filter(({roleId}) => options.includeRoles.includes(roleId));

        if (authors.length < 1) {
            return null;
        }

        const renderAuthorRole = (roleQcode: string) => {
            return (
                <em style={{opacity: 0.85, fontWeight: 'normal'}}>
                    {getVocabularyItemNameTranslated(this.related.getAuthorRole(roleQcode))}:{' '}
                </em>
            );
        };

        const renderUser = (userId: string) => {
            const user = this.related.getUser(userId);

            return (
                <strong>{user[options.displayField] ?? user.display_name}</strong>
            );
        };

        return (
            <span className="container" style={{marginRight: '1.2rem'}}>
                {
                    authors.slice(0, AUTHORS_TO_SHOW_AT_ONCE).map(({userId, roleId}, index) => (
                        <span key={userId}>
                            {index > 0 && SEPARATOR}
                            <span>{renderAuthorRole(roleId)}</span>
                            <span>{renderUser(userId)}</span>{' '}
                        </span>
                    ))
                }

                {
                    authors.length > AUTHORS_TO_SHOW_AT_ONCE && (
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
                                            authors.map(({userId, roleId}) => (
                                                <tr key={userId}>
                                                    <td style={{paddingRight: 4, opacity: 0.6}}>
                                                        {renderAuthorRole(roleId)}
                                                    </td>
                                                    <td>{renderUser(userId)}</td>
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
