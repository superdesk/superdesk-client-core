import React from 'react';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {sanitizeHtmlContent} from 'core/helpers/sanitize-html-input';
import {PackageGroupTitle} from './package-group-title';

interface IProps {
    packageId: IArticle['_id'];

    // the export is built from the saved package, so it is fetched again for every saved version
    savedVersion: IArticle['_current_version'];
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

    private fetchPreview() {
        const {packageId, savedVersion} = this.props;

        sdApi.highlights.prepareHighlightForPreview(packageId).then((html) => {
            // a slower response for an older version must not replace a newer one
            if (!this.unmounted && this.props.savedVersion === savedVersion) {
                // item bodies and highlight templates are user content
                this.setState({html: sanitizeHtmlContent(html ?? '')});
            }
        });
    }

    componentDidMount() {
        this.fetchPreview();
    }

    componentDidUpdate(prevProps: IProps) {
        if (prevProps.savedVersion !== this.props.savedVersion) {
            this.fetchPreview();
        }
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
