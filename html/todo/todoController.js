"use strict";
app.controller('todoListing', ['$rootScope', '$compile', '$http', '$scope', '$timeout', 'ENV', 'DTOptionsBuilder', 'DTColumnBuilder', 'Notification', 'todoService', function($rootScope, $compile, $http, $scope, $timeout, ENV, DTOptionsBuilder, DTColumnBuilder, Notification, todoService) {

    $scope.todoList = {
        "english_name": "",
        "updateby": $rootScope.username,
        "active": ""
    };
    $scope.checkShow = $rootScope.pageAccess.add;
    $scope.is_offline= window.globalVariable.is_online;
    $scope.isEdit = false;
    $scope.reset = function() {
        $scope.todoList = {
            "english_name": "",
            "updateby": $rootScope.username,
            "active": ""
        };
        $scope.isEdit = false;
        $scope.checkShow = $rootScope.pageAccess.add;
    }
    $scope.saveTodo = function() {

        var valid = false;
        var messageValid = 'Please, Input data fields: </br>';
        if ($scope.todoList.english_name == '') {
            messageValid += '- Input Name. </br>';
            valid = true;
        }
        if (valid) {
            Notification.error({ message: messageValid, delay: 5000 });
        } else {
            if ($scope.isEdit) {
                todoService.edit($scope.todoList).$promise.then(function(response) {
                    if (response['success']) {
                        Notification.success({ message: response['message'] || 'Updated record To do success.', delay: 2000 });
                        $scope.reset();
                        $scope.dtInstance.reloadData();
                        $scope.isEdit = false;
                    } else {
                        Notification.error({ message: response['message'] || 'Update record failed', delay: 2000 });
                    }
                });
            } else {

                todoService.save($scope.todoList).$promise.then(function(response) {
                    if (response['success']) {
                        Notification.success({ message: response['message'] || 'Insert new record success.', delay: 2000 });
                        $scope.reset();
                        $scope.dtInstance.reloadData();
                    } else {
                        Notification.error({ message: response['message'] || 'Insert record failed', delay: 2000 });
                    }
                });
            }
        }
    }


    $scope.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
            return todoService.getAll().$promise.then(function(data) {
                $scope.toDoList = data;
                return $scope.toDoList;

            })
        })
        .withOption('createdRow', function(row, data, dataIndex) {
            // Recompiling so we can bind Angular directive to the DT
            $compile(angular.element(row).contents())($scope);
        })
        .withButtons([
            // 'print',
            'excel'
        ])
        .withPaginationType('full_numbers')
        .withColumnFilter({
            sPlaceHolder: 'head:before',
            aoColumns: [{
                type: 'text'
            }]
        });

    $scope.dtColumns = [
        DTColumnBuilder.newColumn('english_name').withTitle('Name English'),
        DTColumnBuilder.newColumn('active').withTitle('Status').renderWith(renderComposition),
        DTColumnBuilder.newColumn('').notSortable().withTitle('Edit').renderWith(renderData)
    ];

    $scope.dtInstance = {};

    function status(data, type, full, meta) {
        return '<i class="fa fa-pencil-square-o"></i>';
    }

    function renderComposition(data) {
        var active = "";
        if (data === 1) {
            active = '<i class="fa fa-check-square-o" aria-hidden="true"></i>';
        }
        return active;
    }

    function renderData(data, type, full, meta) {
        return '<a class="cursor" ng-click="editTodo(' + meta.row + ')"><i class="fa fa-pencil-square-o"></i></a>';
    }
    $scope.changeActive = changeActive;
    function changeActive(id_active){
       
        if(id_active)
            $scope.todoList.active = true;
        else
            $scope.todoList.active = false;
    }
    $scope.editTodo = function(index) {
        $scope.checkShow = $rootScope.pageAccess.edit;
        $scope.isEdit = true;
        var value = $scope.toDoList[index];
        $scope.todoList = {
            "todo_id":value.todo_id,
            "english_name": value.english_name,
            "updateby": $rootScope.username,
            "active": value.active
        };
        if($scope.todoList.active == 1)
            $scope.todoList.active = true;
        else
            $scope.todoList.active = false

        $("html, body").animate({ scrollTop: 0 }, "slow");
    }
}]);
