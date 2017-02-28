import {TransmissionDetailsDirective} from './TransmissionDetailsDirective';
import {VersioningHistoryDirective} from './VersioningHistoryDirective';
import {HistoryController} from './HistoryController';

angular.module('superdesk.apps.authoring.versioning.history', [])
    .directive('sdVersioningHistory', VersioningHistoryDirective)
    .directive('sdTransmissionDetails', TransmissionDetailsDirective)
    .controller('HistoryWidgetCtrl', HistoryController);
