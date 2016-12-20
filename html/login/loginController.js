'use strict'

appControllers.controller('loginCtrl',function(userService,$log,$state,Storage,Notification,$scope,$rootScope,$stateParams,vcRecaptchaService){
    var isonline = window.globalVariable.is_online;
    var storageKey = 'user';
    var login = this;
    $scope.widgetId = null;
    $scope.response = null;
    $scope.setWidgetId = function (widgetId) {
        $scope.widgetId = widgetId;
    };
    $scope.setResponse = function (response) {
        $scope.response = response;
    };
     $scope.cbExpiration = function() {
        vcRecaptchaService.reload($scope.widgetId);
        $scope.response = null;
    };



    login.timeSignUp = 0;
    login.isOver3Times = false;
    login.lang = window.globalVariable.lang;
    login.signup = signup;
    login.forgotpassword = forgotpassword;
    login.resetpassword = resetpassword;
    if(Storage.get('token') != null){
        userService.singout().then(function(data){
            Storage.remove(storageKey);
            Storage.remove('token');
            if(!isonline){
                Storage.remove('userpass');
            }
            $rootScope.username = '';
        });
    }
    var user = {};
    if($rootScope.rootmessage){
        Notification.info({ message: $rootScope.rootmessage ,delay: 5000});
        $rootScope.rootmessage = '';
    }
    function signup(login){
         if(($scope.widgetId != null && $scope.response != null) || ($scope.widgetId == null && $scope.response == null))
         {
             userService.signup(login.username, login.password,login.lang).then(function(data) {
                if(data.success)
                {
                    user=data.data;
                    Storage.set(storageKey, user);
                    Storage.set('token',user.token);
                    if(!isonline){
                        Storage.set('userpass',login.password);
                    }
                    $rootScope.username = Storage.get('user').user_name||'';
                    $rootScope.userId = Storage.get('user').id_user||'';
                    $rootScope.accesses = Storage.get('user').access||'';
                    $state.go('home.dashboard');
                } else 
                {
                     login.errorMessage = data.message;
                    if($scope.widgetId != null && $scope.response != null){
                        vcRecaptchaService.reload($scope.widgetId);
                        $scope.response = null;
                    }else{
                        login.timeSignUp += 1;
                        if(login.timeSignUp >= 3) {
                            login.isOver3Times = true;
                        }
                    }
                }
            });
         }else{
             login.errorMessage = "Please fill the capcha below.";
         }
    }

    function forgotpassword() {
        userService.forgotpassword(login.email).then(function(data) {
            login.errorMessage = data.message;
        });
    }

    function resetpassword() {
        var params = $state.params;
        if(login.user_password === login.re_password) {
            userService.resetpassword(params.token, login.user_password).then(function(data) {
                if(data.success) {
                    login.errorMessage = data.message;
                    setTimeout(function() {
                        $state.go('login');
                    }, 1000);
                }
                else {
                    login.errorMessage = data.message;
                }
            });
        }
        else {
            login.errorMessage = "Confirm password not matching! Please try again.";
        }
        
    }
   
});