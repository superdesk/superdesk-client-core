import React from 'react';
import {IArticle} from 'superdesk-interfaces/Article';

const TYPES_TO_ICONS = {
    picture: 'icon-photo',
    graphic: 'icon-graphic',
    video: 'icon-video',
    audio: 'icon-audio',
};

interface IProps {
    svc: any;
    item: IArticle;
}

interface IState {
    types: Array<string>;
}

interface IRelatedArticle {
    _id: IArticle['_id'];
    type: IArticle['type'];
}

/**
 * Render icon with count for each item type present in associations.
 */
export class AssociatedItemsList extends React.Component<IProps, IState> {
    readonly state = {types: []};

    componentDidMount() {
        this.getAssociations();
    }

    getAssociations() {
        const {content} = this.props.svc;
        const associations = this.props.item.associations || {};
        const related = Object.values(associations)
            .filter((_related) => _related != null);
        const relatedTypes = related
            .map((_related: IRelatedArticle) => _related.type)
            .filter((type) => type != null);

        if (relatedTypes.length === related.length) { // types for all
            this.setState({types: relatedTypes});
            return;
        }

        content.fetchAssociations(this.props.item).then((_associations: Array<IArticle>) => {
            this.setState({
                types: Object.values(_associations)
                    .filter((assoc) => assoc != null)
                    .map((assoc) => assoc.type),
            });
        });
    }

    render() {
        const icons = Object.keys(TYPES_TO_ICONS).map((type) => ({
            type: type,
            icon: TYPES_TO_ICONS[type],
            count: this.state.types.filter((_type) => _type === type).length,
        }))
            .filter((data) => data.count > 0)
            .map((associatedType) => (
                <span key={associatedType.type} className="sd-text-icon sd-text-icon--aligned-r">
                    <i className={`${associatedType.icon} sd-opacity--40`} />
                    {associatedType.count}
                </span>
            ));

        return icons.length ? (
            <span style={{marginLeft: 'auto'}}> {/* push it right */}
                {icons}
            </span>
        ) : null;
    }
}
