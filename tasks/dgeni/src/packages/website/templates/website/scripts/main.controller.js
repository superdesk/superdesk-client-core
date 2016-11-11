'use strict';

angular.module('docApp')
.controller('MainCtrl', function MainCtrl($mdSidenav){
    var main = this;

    main.toggleSidebar = function toggleSidebar(sidebar) {
        $mdSidenav(sidebar).toggle();
    }
});

