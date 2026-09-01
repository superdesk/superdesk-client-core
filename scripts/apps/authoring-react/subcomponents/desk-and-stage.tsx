import React from 'react';
import {IArticle} from 'superdesk-api';
import {sdApi} from 'api';

interface IProps {
    article: IArticle;
}

export class DeskAndStage extends React.PureComponent<IProps> {
    render() {
        const {article} = this.props;
        const deskId = article.task?.desk;
        const stageId = article.task?.stage;

        if (deskId == null || stageId == null) {
            return null;
        }

        const desk = sdApi.desks.getAllDesks().get(deskId);
        const stage = sdApi.desks.getDeskStages(deskId).get(stageId);

        // the desks store may still be loading, and it never holds a desk the user can not see
        if (desk == null || stage == null) {
            return null;
        }

        return (
            <div className="desk-and-stage" title={`${desk.name} / ${stage.name}`}>
                <span className="desk-and-stage--desk">{desk.name}</span>
                <span className="desk-and-stage--stage">&nbsp;/ {stage.name}</span>
            </div>
        );
    }
}
