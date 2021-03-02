import React from 'react';

import {IArticle} from 'superdesk-api';
import {connectServices} from 'core/helpers/ReactRenderAsync';

import {slugline as Slugline} from 'apps/search/components/fields/slugline';
import {headline as Headline} from 'apps/search/components/fields/headline';
import {state as State} from 'apps/search/components/fields/state';
import {versioncreated as VersionCreated} from 'apps/search/components/fields/versioncreated';

import {TypeIcon} from 'apps/search/components';
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
                        <div className="list-field type-icon">
                            <TypeIcon
                                type={article.type}
                                highlight={article.highlight}
                            />
                        </div>
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
                                <VersionCreated item={article} />
                            </ListItemColumn>
                        </ListItemRow>
                        <ListItemRow justifyContent="flex-end">
                            <ListItemColumn>
                                <State item={article} />
                            </ListItemColumn>
                        </ListItemRow>
                    </ListItemColumn>
                </ListItem>
            </div>
        );
    }
}

export const ArticleItemConcise = connectServices<IProps>(ArticleItemConciseComponent, ['datetime']);
