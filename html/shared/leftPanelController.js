'use strict'
appControllers.controller('leftPanelCtrl',function($log,$state,$rootScope,$scope,Storage,$filter,$timeout){

    $scope.accesses = [];
		angular.forEach(Storage.get('user').access,function(value){
					if(value.show >0)
							$scope.accesses.push(value);
		})
    $timeout(function(){
		$("#left-panel ul.navigation").find("ul.subnavigation").addClass("hidden");
		$("#left-panel ul.navigation>li").on( "click", function( ) {
			$("#left-panel ul.navigation>li").find("ul.subnavigation").addClass("hidden");
			$(this).addClass("active open");
			$(this).find("ul.subnavigation").removeClass("hidden");
		});
    }, 100);
});