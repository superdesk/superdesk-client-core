import React from 'react';
import {IDifferenceComponentProps, IPackageItemsConfig, IPackageItemsValueOperational} from 'superdesk-api';
import {keyBy, uniq} from 'lodash';
import {getDifferenceStatistics} from '../difference-statistics';
import {ArticleItemConcise} from 'core/ui/components/article-item-concise';
import {WithArticles} from 'core/with-articles';

type IProps = IDifferenceComponentProps<IPackageItemsValueOperational, IPackageItemsConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        const value1Ids = (this.props.value1 ?? []).map(({guid}) => guid);
        const value2Ids = (this.props.value2 ?? []).map(({guid}) => guid);

        const allIds = uniq([...value1Ids, ...value2Ids]);

        const stats = getDifferenceStatistics(
            value1Ids,
            value2Ids,
            (id) => id,
            (a, b) => a === b,
        );

        return (
            <WithArticles ids={allIds}>
                {(items) => {
                    const keyed = keyBy(items, (item) => item._id);

                    return (
                        <div>
                            {
                                stats.removed.map((id, i) => (
                                    <ArticleItemConcise
                                        key={i}
                                        article={keyed[id]}
                                        backgroundColor="var(--diff-color-removal)"
                                    />
                                ))
                            }
                            {
                                value2Ids.map((id, i) => (
                                    <ArticleItemConcise
                                        key={i}
                                        article={keyed[id]}
                                        backgroundColor={(() => {
                                            if (stats.added.find((_id) => _id === id) != null) {
                                                return 'var(--diff-color-addition)';
                                            } else {
                                                return undefined;
                                            }
                                        })()}
                                    />
                                ))
                            }
                        </div>
                    );
                }}
            </WithArticles>
        );
    }
}
