import {sdApi} from 'api';
import {dispatchInternalEvent} from 'core/internal-events';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button, Text} from 'superdesk-ui-framework/react';
import {setMarkedDesks} from './helper';

interface IProps {
    article: IArticle;
}

export class MarkedDesks extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.unMarkDesks = this.unMarkDesks.bind(this);
        this.getSelectedDeskIds = this.getSelectedDeskIds.bind(this);
    }

    private getSelectedDeskIds(): Array<string> | null {
        return (this.props.article.marked_desks ?? []).map((x) => x.desk_id);
    }

    private unMarkDesks(deskId: string): void {
        const deskIds = this.getSelectedDeskIds().filter((id) => id !== deskId);

        setMarkedDesks(deskIds, this.props.article._id).then(() => {
            this.setState({
                selectedDeskIds: deskIds,
            });
            dispatchInternalEvent('dangerouslyForceReloadAuthoring', undefined);
        });
    }

    render(): React.ReactNode {
        const allDesks = sdApi.desks.getAllDesks();
        const selectedDesks = this.getSelectedDeskIds().map((id) => allDesks.get(id));

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
