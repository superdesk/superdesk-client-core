import React, {ReactNode} from 'react';
import {IRelatedEntities} from './getRelatedEntities';
import {logger} from './services/logger';

interface IProps {
    entities: IRelatedEntities;
    collection: string;
    entityId: string | undefined | null;
    children: (entity: any) => ReactNode;
}

export class WithRelatedEntity extends React.Component<IProps> {
    render() {
        if (this.props.entityId == null) {
            return null;
        }

        const {entities, collection, entityId} = this.props;
        const entity: any = entities?.[collection]?.get(entityId);

        if (entity == null) {
            logger.warn('Related entity could not be retrieved.', {collection, entityId});

            return null;
        } else {
            return this.props.children(entity);
        }
    }
}
