import React from 'react';
import {IconButton, Menu} from 'superdesk-ui-framework/react';

import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';

import {slugline as Slugline} from 'apps/search/components/fields/slugline';
import {headline as Headline} from 'apps/search/components/fields/headline';
import {state as State} from 'apps/search/components/fields/state';
import {versioncreated as VersionCreated} from 'apps/search/components/fields/versioncreated';

import {TypeIcon} from 'apps/search/components';
import {ListItemColumn, ListItemRow, ListItem} from 'core/components/ListItem';

interface IProps {
    article: IArticle;
    actionsMenu?: React.ComponentProps<typeof Menu>['items'];
    backgroundColor?: string;
}

export class ArticleItemConcise extends React.PureComponent<IProps> {
    render() {
        const {article, backgroundColor} = this.props;

        return (
            <div style={{backgroundColor: backgroundColor}}>
                <ListItem noBackground={backgroundColor != null}>
                    <ListItemColumn>
                        <div className="list-field type-icon">
                            <TypeIcon
                                type={article.type}
                                highlight={article.highlight}
                                contentProfileId={article.profile}
                            />
                        </div>
                    </ListItemColumn>

                    <ListItemColumn noBorder ellipsisAndGrow title={article.slugline || article.headline}>
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

                    {
                        this.props.actionsMenu != null && (
                            <ListItemColumn>
                                <div>
                                    <Menu
                                        items={this.props.actionsMenu}
                                    >
                                        {(toggle) => (
                                            <IconButton
                                                icon="dots-vertical"
                                                ariaValue={gettext('Item actions')}
                                                onClick={(event) => {
                                                    toggle(event);
                                                }}
                                            />
                                        )}
                                    </Menu>
                                </div>
                            </ListItemColumn>
                        )
                    }
                </ListItem>
            </div>
        );
    }
}
