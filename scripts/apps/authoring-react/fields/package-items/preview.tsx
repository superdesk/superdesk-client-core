import React from 'react';
import {IPreviewComponentProps, IPackageItemsConfig, IPackageItemsValueOperational} from 'superdesk-api';
import {ArticleItemConcise} from 'core/ui/components/article-item-concise';
import {WithArticles} from 'core/with-articles';

type IProps = IPreviewComponentProps<IPackageItemsValueOperational, IPackageItemsConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        if (this.props.value == null || this.props.value.length < 1) {
            return null;
        }

        return (
            <WithArticles ids={this.props.value.map(({guid}) => guid)}>
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
