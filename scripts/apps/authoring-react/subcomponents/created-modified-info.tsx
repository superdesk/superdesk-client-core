import React from 'react';
import {IArticle} from 'superdesk-api';
import {CreatedInfo} from 'apps/authoring/authoring/created-info';
import {ModifiedInfo} from 'apps/authoring/authoring/modified-info';

interface IProps {
    article: IArticle;
}

export class CreatedModifiedInfo extends React.PureComponent<IProps> {
    render() {
        return (
            <div className="created-modified-info">
                <CreatedInfo entity={this.props.article} />
                <span className="created-modified-info--separator" />
                <ModifiedInfo entity={this.props.article} />
            </div>
        );
    }
}
