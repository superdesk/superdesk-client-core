import React from 'react';
import {noop} from 'lodash';

import {IArticle} from 'superdesk-api';
import {connectServices} from 'core/helpers/ReactRenderAsync';

import {
    slugline as Slugline,
    headline as Headline,
    state as State,
    versioncreated as VersionCreated,
} from 'apps/search/components/fields';
import {ListTypeIcon} from 'apps/search/components';
import {ListItemColumn, ListItemRow, ListItem} from 'core/components/ListItem';

interface IProps {
    article: IArticle;
    datetime?: any;
}

class ArticleItemConciseComponent extends React.PureComponent<IProps> {
    render() {
        const {article} = this.props;

        return (
            <div>
                <ListItem>
                    <ListItemColumn>
                        <ListTypeIcon
                            svc={{}}
                            item={article}
                            onMultiSelect={noop}
                            selectingDisabled={true}
                        />
                    </ListItemColumn>

                    <ListItemColumn noBorder ellipsisAndGrow>
                        {
                            article.slugline == null ? null : (
                                <ListItemRow>
                                    <ListItemColumn ellipsisAndGrow>
                                        <Slugline item={article} />
                                    </ListItemColumn>
                                </ListItemRow>
                            )
                        }
                        <ListItemRow>
                            <ListItemColumn ellipsisAndGrow>
                                <Headline item={article} />
                            </ListItemColumn>
                        </ListItemRow>
                    </ListItemColumn>

                    <ListItemColumn>
                        <ListItemRow justifyContent="flex-end">
                            <ListItemColumn>
                                <VersionCreated item={article} svc={{datetime: this.props.datetime}} />
                            </ListItemColumn>
                        </ListItemRow>
                        <ListItemRow justifyContent="flex-end">
                            <ListItemColumn>
                                <State item={article} svc={{datetime: this.props.datetime}} style={{margin: 0}} />
                            </ListItemColumn>
                        </ListItemRow>
                    </ListItemColumn>
                </ListItem>
            </div>
        );
    }
}

export const ArticleItemConcise = connectServices<IProps>(ArticleItemConciseComponent, ['datetime']);
