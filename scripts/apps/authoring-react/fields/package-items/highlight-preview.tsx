import React from 'react';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {PackageGroupTitle} from './package-group-title';

interface IProps {
    packageId: IArticle['_id'];
}

interface IState {
    html: string | null;
}

// the server's export of the saved highlight package
export class HighlightPreview extends React.PureComponent<IProps, IState> {
    private unmounted = false;

    constructor(props: IProps) {
        super(props);

        this.state = {html: null};
    }

    componentDidMount() {
        sdApi.highlights.prepareHighlightForPreview(this.props.packageId).then((html) => {
            if (!this.unmounted) {
                this.setState({html: html ?? ''});
            }
        });
    }

    componentWillUnmount() {
        this.unmounted = true;
    }

    render() {
        return (
            <div data-test-id="package-highlight-preview">
                <PackageGroupTitle label={gettext('Highlight Preview')} />

                {
                    this.state.html != null && (
                        <div
                            className="sd-padding--1"
                            data-test-id="package-highlight-preview-content"
                            dangerouslySetInnerHTML={{__html: this.state.html}}
                        />
                    )
                }
            </div>
        );
    }
}
