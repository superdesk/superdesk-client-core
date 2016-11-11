'use strict';

angular.module('docApp').controller('NavbarCtrl', function ($scope, $location, NAV) {
	var navbar = this;
	navbar.areas = NAV;
/*
	angular.forEach(DOCS_NAVIGATION, function(v, k){
		navbar.areas.push({
			id: k,
			name: v.name,
			href: k
		});
	});
*/
        $scope.isActive = function isActive (area) {
            return $location.path().indexOf('/' + area.href) === 0;
        }

	$scope.date = new Date();
});
