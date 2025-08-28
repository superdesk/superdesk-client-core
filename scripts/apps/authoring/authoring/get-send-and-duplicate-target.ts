import {IDesk, IStage} from 'superdesk-api';
import {sdApi} from 'api';
import {appConfig} from 'appConfig';

export function getSendAndDuplicateTarget(): null | {deskId: IDesk['_id']; stageId: IStage['_id']} {
    const desk = sdApi.desks.getAllDesks().find(
        (desk) => desk.name === appConfig.features.customAuthoringTopbar.sendAndDuplicate.deskName,
    );

    if (desk == null) {
        return null;
    }

    const stageFromConfig = sdApi.desks.getDeskStages(desk._id).find(
        (desk) => desk.name === appConfig.features.customAuthoringTopbar.sendAndDuplicate.stageName,
    );

    return {
        deskId: desk._id,
        stageId: stageFromConfig != null ? stageFromConfig._id : desk.incoming_stage,
    };
}
