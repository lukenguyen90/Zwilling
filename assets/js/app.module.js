'use strict'
//Global variable use for setting color, start page, message, oAuth key.
window.globalVariable = {
    startPage:{
        url:'/login',
        state: 'login'
    },
    lang:'eng',
    company_kind:{
        customer: 3,
        supplier :2
    },
    document_type:{
        product_item:1,
        product_segment:2
    },
    is_online : false
};

window.IR = localStorage.getItem('IR');
if( window.IR == null ){
    window.IR = {} ;
    localStorage.setItem('IR',JSON.stringify(window.IR));
}else{
    window.IR = JSON.parse(window.IR);
}

var app = angular.module('zwillingApp', ['zwilling.controllers','checklist-model','angular.filter','zwilling.services','ui.router','ngResource','ui-notification','ui.select2','ui.select2.sortable','datatables','datatables.buttons','datatables.columnfilter','naif.base64', 'ui.autocomplete','chart.js','angular-loading-bar', 'vcRecaptcha'])
.run(function($rootScope, $state,$timeout,Storage){
    if(Storage.get('user')){
        $rootScope.username = Storage.get('user').user_name;
        $rootScope.userId = Storage.get('user').id_user;
    }
    else{
        $rootScope.username = '';
         $rootScope.userId = '';
    }
    $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
        if(toState.name == "home")
             $state.go("home.dashboard");
        if(toState.authenticate){
            if(Storage.get('token')==null)
            {
                $state.go("login");
                event.preventDefault(); 
            }
            var accesses = Storage.get('user').access||'';
            if(accesses){
                var check = false;
                var defaultState = "";
                angular.forEach(accesses,function(value){
                    if(toState.name == value.url){
                        $rootScope.pageAccess = value
                    }    
                    if(value.url && !defaultState && value.view == 1 && value.show == 1)
                        defaultState = value.url;
                    if(!check){
                        if(value.url == toState.name && value.view == 1)
                             check = true;
                    }
                })
                if(!check)
                {
                    if(fromState.name){
                        if(fromState.name == 'login')
                            $state.go(defaultState);
                        else
                            $state.go(fromState.name);
                        event.preventDefault();
                    }
                    else{
                        $state.go(defaultState);
                        event.preventDefault();
                    }
                }
            }
            else{
                $state.go("login");
                event.preventDefault();
            }

        }
        
    })
    
    $timeout(function () {
        var currentURl = window.location.hash;
        if(currentURl != '') {
            var subnavigation   = $("#left-panel").find("[href='"+currentURl+"']").parent().parent();
            var navigation      = subnavigation.parent();
            subnavigation.removeClass("hidden");
            navigation.addClass("active open");
        }
    }, 200)

})
.config(function($httpProvider){
    
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};    
    }    
    $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';

    //interceptors every HTTP request and inject it with an Authorization header
    $httpProvider.interceptors.push(['$q', '$location', 'Storage','$rootScope', function ($q, $location, Storage,$rootScope) {
        return {
            'request': function (config) {
                config.headers = config.headers || {};
                if (Storage.get('token')!=null) {
                    config.headers.Authorization = Storage.get('token');
                }
                return config;
            },
            'response': function(response) {
                if(!angular.isUndefined(response.data.tokenTimeout) && !response.data.tokenTimeout){
                    Storage.remove('user');
                    Storage.remove('token');
                    $rootScope.username = '';
                    $rootScope.rootmessage = 'User informations have been changed or expired, Please try login again';
                    $location.path('/login');
                }
                return response;
            },
            'responseError': function (response) {
                if (response.status === 401 || response.status === 403) {
                    $location.path('/login');
                }
                return $q.reject(response);
            }
        };
    }]);
})
.config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
}])
.factory('DTLoadingTemplate', dtLoadingTemplate);
function dtLoadingTemplate() {
    return {
        html: '<img src="assets/img/icon/loading.gif">'
    };
}