import {sdApi} from 'api';
import {dispatchInternalEvent} from 'core/internal-events';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button, Text} from 'superdesk-ui-framework/react';
import {markedForDesks} from './helper';

interface IProps {
    article: IArticle;
}

interface IState {
    selectedDeskIds: Array<string> | null;
}

export class DesksPopoverContent extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            selectedDeskIds: this.props.article?.marked_desks.map((x) => x.desk_id),
        };

        this.unMarkDesks = this.unMarkDesks.bind(this);
    }

    unMarkDesks(deskId: string): void {
        const deskIds = this.state.selectedDeskIds.filter((id) => id !== deskId);

        markedForDesks(deskIds, this.props.article._id).then(() => {
            this.setState({
                selectedDeskIds: deskIds,
            });
            dispatchInternalEvent('dangerouslyForceReloadAuthoring', undefined);
        });
    }

    render(): React.ReactNode {
        const allDesks = sdApi.desks.getAllDesks();
        const selectedDesks = (this.state.selectedDeskIds ?? []).map((id) => allDesks.get(id));

        return selectedDesks.map(({name, _id}) => (
            <Spacer gap="32" h key={_id} justifyContent="space-between" alignItems="stretch">
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
