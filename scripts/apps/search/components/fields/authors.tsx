import React from 'react';

import {IUser, IRestApiResponse, IVocabulary, IVocabularyItem} from 'superdesk-api';
import {IPropsItemListInfo} from '../ListItemInfo';
import {SuperdeskReactComponent} from 'core/SuperdeskReactComponent';
import {getVocabularyItemNameTranslated} from 'core/utils';

interface IProps {
    authors: Array<{userId: IUser['_id'], roleId: string}>;
}

interface IState {
    authors?: Array<{user: IUser, roleQcode: string}>;
    vocabularyItems?: Map<string, IVocabularyItem>; // indexed by qcode
}

interface ISettings {
    displayField: keyof IUser;
    includeRoles: Array<string>; // qcodes
}

const settings: ISettings = {
    displayField: 'display_name',
    includeRoles: ['photographer', 'writer', 'translator'],
};

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
            path: `/vocabularies/author_roles`,
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
        }) ;
    }
    render() {
        if (this.state.authors == null) {
            return null;
        }

        const {vocabularyItems} = this.state;

        return (
            <span>
                {
                    this.state.authors.map(({user, roleQcode}) => (
                        <span key={user._id} style={{marginRight: '0.4rem'}}>
                            <span>USER: {user[settings.displayField]}</span>{' '}
                            <span>ROLE: {getVocabularyItemNameTranslated(vocabularyItems.get(roleQcode))}</span>
                        </span>
                    ))
                }
            </span>
        );
    }
}

export class Authors extends React.PureComponent<IPropsItemListInfo> {
    render() {
        if ((this.props.item.authors) == null) {
            return null;
        }

        const allAuthors = this.props.item.authors.map(({_id}) => ({userId: _id[0], roleId: _id[1]}));
        const authors = allAuthors.filter(({roleId}) => settings.includeRoles.includes(roleId));

        if (authors.length < 1) {
            return null;
        }

        return (
            <AuthorsComponent
                key={JSON.stringify(this.props.item.authors)} // force component to remount and re-initialize state
                authors={authors}
            />
        );
    }
}
