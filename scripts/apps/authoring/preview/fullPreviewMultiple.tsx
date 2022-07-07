import React from 'react';
import ReactDOM from 'react-dom';
import {Button} from 'superdesk-ui-framework';
import {IArticle} from 'superdesk-api';
import ng from 'core/services/ng';
import {FullPreview} from './fullPreview';
import {gettext} from 'core/utils';

function getProfile(item: IArticle): Promise<{editor: any; fields: any}> {
    const fakeScope: any = {};

    const content = ng.get('content');

    return content.setupAuthoring(item.profile, fakeScope, item).then(() => {
        const {editor, fields} = fakeScope;

        return {editor, fields};
    });
}

function prepareAndPrint() {
    document.body.classList.add('prepare-to-print');

    const afterPrintFns: Array<() => void> = [
        () => document.body.classList.remove('prepare-to-print'),
    ];

    const afterPrint = () => {
        afterPrintFns.forEach((fn) => fn());
    };

    if (window.matchMedia) {
        var mediaQueryList = window.matchMedia('print');

        const handler = (mql) => {
            if (!mql.matches) {
                afterPrint();
            }
        };

        mediaQueryList.addListener(handler);
        afterPrintFns.push(() => mediaQueryList.removeListener(handler));
    }

    window.onafterprint = afterPrint;

    window.print();
}

interface IProps {
    items: Array<{article: IArticle; editor: any; fields: any}>;
    close(): void;
}

interface IState {
    hideMedia: boolean;
}

class FullPreviewMultiple extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            hideMedia: false,
        };
    }
    render() {
        return (
            <div className="sd-full-preview">
                <div className="sd-full-preview--header no-print">
                    <div>
                        <Button
                            text={gettext('Hide media')}
                            style={this.state.hideMedia ? 'filled' : 'hollow'}
                            type={this.state.hideMedia ? 'primary' : 'default'}
                            onClick={() => {
                                this.setState({hideMedia: !this.state.hideMedia});
                            }}
                        />
                    </div>

                    <div>
                        <Button
                            text={gettext('Print')}
                            icon="print"
                            iconOnly
                            style="hollow"
                            onClick={() => {
                                prepareAndPrint();
                            }}
                        />

                        <Button
                            text={gettext('Close')}
                            icon="close-small"
                            iconOnly
                            style="hollow"
                            onClick={() => {
                                this.props.close();
                            }}
                        />
                    </div>
                </div>

                <div className="sd-full-preview--content-wrapper">
                    {
                        this.props.items.map(({article, editor, fields}, i) => (
                            <div key={i}>
                                { // always start a new article on a new page in print mode
                                    i > 0 && (
                                        <div>
                                            <div style={{pageBreakAfter: 'always'}} />
                                            <hr className="no-print" />
                                        </div>
                                    )
                                }

                                <div className="sd-full-preview--content">
                                    <FullPreview
                                        item={article}
                                        editor={editor}
                                        fields={fields}
                                        hideMedia={this.state.hideMedia}
                                    />
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        );
    }
}

/**
 * ANGULAR-AUTHORING: This is used from angular based authoring - leave it as it is for compatibility
 * and build a new one for authoring-react
 */
export function previewItems(articles: Array<IArticle>) {
    const el = document.createElement('div');

    el.classList.add('print-container');
    document.body.appendChild(el);

    Promise.all(
        articles.map((article) => getProfile(article).then(({editor, fields}) => ({article, editor, fields}))),
    ).then((items) => {
        ReactDOM.render(
            (
                <FullPreviewMultiple
                    items={items}
                    close={() => {
                        ReactDOM.unmountComponentAtNode(el);
                        el.remove();
                    }}
                />
            ),
            el,
        );
    });
}
