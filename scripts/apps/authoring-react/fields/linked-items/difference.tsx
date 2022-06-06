import React from 'react';
import {IDifferenceComponentProps} from 'superdesk-api';
import {ILinkedItemsConfig, ILinkedItemsValueOperational} from './interfaces';
import {keyBy, uniq} from 'lodash';
import {WithArticles} from 'core/with-articles';
import {getDifferenceStatistics} from '../difference-statistics';
import {ArticleItemConcise} from 'core/ui/components/article-item-concise';

type IProps = IDifferenceComponentProps<ILinkedItemsValueOperational, ILinkedItemsConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        const value1Ids = (this.props.value1 ?? []).map(({id}) => id);
        const value2Ids = (this.props.value2 ?? []).map(({id}) => id);

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
