import React from 'react';
import {IArticle} from 'superdesk-api';

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
    associations: Array<IArticle>;
}

/**
 * Render icon with count for each item type present in associations.
 */
export class AssociatedItemsList extends React.Component<IProps, IState> {
    readonly state = {associations: []};

    componentDidMount() {
        this.getAssociations();
    }

    getAssociations() {
        const {content} = this.props.svc;

        content.fetchAssociations(this.props.item).then((associations) => {
            this.setState({associations: Object.values(associations)});
        });
    }

    render() {
        const icons = Object.keys(TYPES_TO_ICONS).map((type) => ({
            type: type,
            icon: TYPES_TO_ICONS[type],
            count: this.state.associations.filter((assoc) => assoc != null && assoc.type === type).length,
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
