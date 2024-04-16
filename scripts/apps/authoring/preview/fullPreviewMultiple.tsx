import React from 'react';
import {Button} from 'superdesk-ui-framework';
import {IArticle} from 'superdesk-api';
import ng from 'core/services/ng';
import {FullPreview} from './fullPreview';
import {gettext} from 'core/utils';
import {IPropsPrintableModal, showPrintableModal} from 'core/services/modalService';

function getProfile(item: IArticle): Promise<{editor: any; fields: any}> {
    const fakeScope: any = {};

    const content = ng.get('content');

    return content.setupAuthoring(item.profile, fakeScope, item).then(() => {
        const {editor, fields} = fakeScope;

        return {editor, fields};
    });
}

interface IProps extends IPropsPrintableModal {
    items: Array<{article: IArticle; editor: any; fields: any}>;
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
        const {Wrapper, showPrintDialog, closeModal} = this.props;

        return (
            <Wrapper
                toolbar={(
                    <React.Fragment>
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
                                    showPrintDialog();
                                }}
                            />

                            <Button
                                text={gettext('Close')}
                                icon="close-small"
                                iconOnly
                                style="hollow"
                                onClick={() => {
                                    closeModal();
                                }}
                            />
                        </div>
                    </React.Fragment>
                )}
                contentSections={
                    this.props.items.map(({article, editor, fields}, i) => (
                        <FullPreview
                            key={i}
                            item={article}
                            editor={editor}
                            fields={fields}
                            hideMedia={this.state.hideMedia}
                        />
                    ))
                }
            />
        );
    }
}

/**
 * #ANGULAR_AUTHORING This is used from angular based authoring - leave it as it is for compatibility
 * and build a new one for authoring-react
 */
export function previewItems(articles: Array<IArticle>) {
    Promise.all(
        articles.map((article) => getProfile(article).then(({editor, fields}) => ({article, editor, fields}))),
    ).then((items) => {
        showPrintableModal((props) => (
            <FullPreviewMultiple
                {...props}
                items={items}
            />
        ));
    });
}
