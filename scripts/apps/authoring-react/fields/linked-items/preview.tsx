import React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {ILinkedItemsValueOperational, ILinkedItemsConfig} from './interfaces';
import {ArticleItemConcise} from 'core/ui/components/article-item-concise';
import {WithArticles} from 'core/with-articles';

type IProps = IPreviewComponentProps<ILinkedItemsValueOperational, ILinkedItemsConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        if (this.props.value == null || this.props.value.length < 1) {
            return null;
        }

        return (
            <WithArticles ids={this.props.value.map(({id}) => id)}>
                {
                    (articles) => (
                        <div>
                            {
                                articles.map((article, i) => (
                                    <ArticleItemConcise
                                        key={i}
                                        article={article}
                                    />
                                ))
                            }
                        </div>
                    )
                }
            </WithArticles>
        );
    }
}
