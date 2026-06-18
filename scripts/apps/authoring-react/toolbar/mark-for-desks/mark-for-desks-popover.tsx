import {sdApi} from 'api';
import {dispatchInternalEvent} from 'core/internal-events';
import {notify} from 'core/notify/notify';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button, Text} from 'superdesk-ui-framework/react';
import {resolveDesks, toggleMarkedDesk} from './helper';

interface IProps {
    article: IArticle;
}

export class MarkedDesks extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.unMarkDesks = this.unMarkDesks.bind(this);
        this.getSelectedDeskIds = this.getSelectedDeskIds.bind(this);
    }

    private getSelectedDeskIds(): Array<string> {
        return (this.props.article.marked_desks ?? []).map((x) => x.desk_id);
    }

    private unMarkDesks(deskId: string): void {
        const articleId = this.props.article._id;

        toggleMarkedDesk(deskId, articleId).then(() => {
            // Read the marks here, not at call time, so fast repeated removals do not start from stale
            // props and bring a removed desk back. Patch state directly instead of reloading; a reload
            // would race the index and read stale data.
            const nextMarks = (this.props.article.marked_desks ?? []).filter((m) => m.desk_id !== deskId);

            dispatchInternalEvent('dangerouslyOverwriteAuthoringData', {
                item: {
                    _id: articleId,
                    marked_desks: nextMarks,
                },
            });
        }).catch(() => {
            notify.error(gettext('Could not remove desk.'));
        });
    }

    render(): React.ReactNode {
        const allDesks = sdApi.desks.getAllDesks();
        const selectedDesks = resolveDesks(this.getSelectedDeskIds(), allDesks);

        return selectedDesks.map(({name, _id}) => (
            <Spacer
                gap="32"
                h
                key={_id}
                justifyContent="space-between"
                alignItems="stretch"
                data-test-id="marked-desk"
                data-test-value={name}
            >
                <Text size="small">{name}</Text>
                <Button
                    size="small"
                    style="hollow"
                    type="primary"
                    text={gettext('Remove')}
                    onClick={() => this.unMarkDesks(_id)}
                />
            </Spacer>
        ));
    }
}
