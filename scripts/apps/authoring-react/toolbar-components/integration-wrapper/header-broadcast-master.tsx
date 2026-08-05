import React from 'react';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {notify} from 'core/notify/notify';
import ng from 'core/services/ng';

interface IProps {
    item: IArticle;
}

/**
 * Port of the MASTER block in authoring-header.html:67-78.
 *
 * `broadcast:preview` is only listened to by the monitoring list and search results, never by
 * authoring, so the master story opens in the list beside the editor. Same as legacy, but it means
 * the link does nothing if authoring ever runs without them.
 */
export class HeaderBroadcastMaster extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.previewMasterStory = this.previewMasterStory.bind(this);
    }

    private previewMasterStory(): void {
        ng.get('api').find('archive', this.props.item.broadcast.master_id)
            .then((masterItem: IArticle) => {
                ng.get('$rootScope').$broadcast('broadcast:preview', {item: masterItem});
            })
            .catch(() => {
                // legacy left this rejection unhandled, which made a failed click look like a no-op
                notify.error(gettext('Could not load the master story.'));
            });
    }

    render(): React.ReactNode {
        const {broadcast} = this.props.item;

        if (broadcast?.master_id == null) {
            return null;
        }

        const status = broadcast.status ?? '';

        return (
            <span data-test-id="authoring-header-broadcast-master">
                <span
                    className="authoring-header__label text-red"
                    title={status.length > 0 ? gettext(status) : ''}
                    data-test-id="authoring-header-broadcast-label"
                >
                    {gettext('MASTER')}
                    {status.length > 0 && (
                        <b style={{fontSize: 14}} data-test-id="authoring-header-broadcast-status">
                            {' !'}
                        </b>
                    )}
                </span>
                {' '}
                <a
                    className="open-item"
                    href=""
                    onClick={(event) => {
                        event.preventDefault();
                        this.previewMasterStory();
                    }}
                    title={gettext('Preview master story')}
                    aria-label={gettext('Preview master story')}
                    data-test-id="authoring-header-preview-master"
                >
                    <i className="icon-external" />
                </a>
            </span>
        );
    }
}
