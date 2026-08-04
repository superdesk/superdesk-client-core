import React from 'react';
import {debounce} from 'lodash';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';
import {isMissingLink, shouldQueryRelatedItems, getRelatedItemsFromDateTime} from './missing-link';

interface IProps {
    item: IArticle;
}

interface IState {
    missingLink: boolean;
}

/**
 * State labels row, ported from authoring-header.html:60-66.
 *
 * Only "Missing Link" costs anything: it needs a search for same-slugline siblings created since
 * midnight. Debounced at 800ms as legacy was, because the slugline changes on every keystroke.
 */
export class HeaderStateLabels extends React.PureComponent<IProps, IState> {
    private mounted: boolean;
    private refreshMissingLink: (() => void) & {cancel(): void};

    constructor(props: IProps) {
        super(props);

        this.state = {missingLink: false};
        this.mounted = false;
        this.refreshMissingLink = debounce(() => this.updateMissingLink(), 800);
    }

    componentDidMount(): void {
        this.mounted = true;
        this.updateMissingLink();
    }

    componentDidUpdate(prevProps: IProps): void {
        if (
            prevProps.item._id !== this.props.item._id
            || prevProps.item.slugline !== this.props.item.slugline
            || prevProps.item.type !== this.props.item.type
        ) {
            this.refreshMissingLink();
        }
    }

    componentWillUnmount(): void {
        this.mounted = false;
        this.refreshMissingLink.cancel();
    }

    private setMissingLink(missingLink: boolean): void {
        if (this.mounted && this.state.missingLink !== missingLink) {
            this.setState({missingLink});
        }
    }

    private updateMissingLink(): void {
        const item = this.props.item;

        if (!shouldQueryRelatedItems(item)) {
            this.setMissingLink(false);

            return;
        }

        ng.get('archiveService').getRelatedItems(item, getRelatedItemsFromDateTime())
            .then((relatedItems) => {
                const hasRelatedItems = (relatedItems?._items?.length ?? 0) > 0;

                this.setMissingLink(
                    hasRelatedItems && isMissingLink(item, ng.get('authoringWorkspace').getAction()),
                );
            })
            .catch(() => {
                this.setMissingLink(false);
            });
    }

    render(): React.ReactNode {
        const {item} = this.props;
        const {missingLink} = this.state;
        const flags = item.flags ?? {};

        const anyLabel = missingLink
            || flags.marked_for_legal
            || flags.marked_for_sms
            || flags.marked_for_not_publication
            || item.rewritten_by;

        if (!anyLabel) {
            return null;
        }

        return (
            <span data-test-id="authoring-header-state-labels">
                {missingLink && (
                    <span className="state-label missing-link" data-test-id="authoring-header-missing-link">
                        {gettext('Missing Link')}
                    </span>
                )}
                {flags.marked_for_legal && (
                    <span className="state-label legal" data-test-id="authoring-header-legal">
                        {gettext('Legal')}
                    </span>
                )}
                {flags.marked_for_sms && (
                    <span className="state-label sms" data-test-id="authoring-header-sms">
                        {gettext('Sms')}
                    </span>
                )}
                {flags.marked_for_not_publication && (
                    <span
                        className="state-label not-for-publication"
                        data-test-id="authoring-header-not-for-publication"
                    >
                        {gettext('Not For Publication')}
                    </span>
                )}
                {item.rewritten_by && (
                    <span className="state-label updated" data-test-id="authoring-header-updated">
                        {gettext('Updated')}
                    </span>
                )}
            </span>
        );
    }
}
