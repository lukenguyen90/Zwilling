"use strict";
app.controller('orderImport', function($http, $rootScope, $log, $scope, $timeout, ENV, DTOptionsBuilder, DTColumnBuilder, orderService, Notification, $q, $compile) {

    var displays = [];
    $scope.isShow1 = true;
    $scope.isShow2 = false;
    $scope.typeImportype = "";
    $scope.countSuccess = 0;
    $scope.countFail = 0;
    $scope.histories = [];
    $scope.checkSAP = false;
    $scope.is_offline = window.globalVariable.is_online;
    $scope.dtOptions = DTOptionsBuilder.fromSource('');
    $scope.dtColumns = [
        DTColumnBuilder.newColumn(null)
    ];
    $scope.dtInstance = {};

    $timeout(function() {
        switchTable($scope.typeImport);
    }, 1000)


    function status(data, type, full, meta) {
        var status = data;
        var strStatus = "<i class='fa fa-exclamation-circle'></i><span ng-click=retry('" + full.id + "')>&nbsp&nbsp<i class='fa fa-retweet cursor'></i></span>";
        if (status == true) {
            strStatus = "<i class='fa fa-check-square-o'></i>";
        }
        return strStatus;
    }

    function statusSAP(data) {
        var status = data;
        var strStatus = "<i class='fa fa-exclamation-triangle'></i>";
        if (status == true) {
            strStatus = "<i class='fa fa-check-square-o'></i>";
        }
        return strStatus;
    }

    //get import history
    $http.get(ENV.domain + 'order.getImportHistoryByUser/?userid=' + $rootScope.userId).then(function(res) {
        $scope.histories = res.data;
        if (res.data.length > 0) {
            $scope.hitoryItem = res.data[0].import_id + "";
            // $scope.showHistory();
        }
    });

    $http.get(ENV.domain + 'order.getImportSapHistoryList/').then(function(res) {
        $scope.historiesSAP = res.data;
        if ($scope.historiesSAP.length > 0) {
            $scope.historySAP = res.data[0].import_sap_id + "";
            $scope.countSuccess = res.data[0].success;
            $scope.countFail = res.data[0].fail;
            // $scope.showHistory();
        }
    });

    $scope.showHistorySAP = function() {
        if ($scope.historySAP != '') {
            $scope.historiesSAP.map(function(value) {
                if (value.import_sap_id + "" == $scope.historySAP) {
                    $scope.countSuccess = value.success;
                    $scope.countFail = value.fail;
                }
            });
            switchTable($scope.typeImportype);
        }
    }

    $scope.showHistory = function() {
        if ($scope.hitoryItem != '') {
            switchTable($scope.typeImportype);
        }
    }

    $scope.changeTypeImport = function() {
        if ($scope.typeImport == "1") {
            $scope.checkSAP = true;
        } else {
            $scope.checkSAP = false;
        }
        switchTable($scope.typeImport);
    };

    $scope.retry = function(id) {
            $http.get(ENV.domain + 'order.reImportOrder/?id=' + id).then(function() {
                switchTable($scope.typeImport);
            })
        }
        //end get



    $scope.uploadfile = function() {
        if (angular.isUndefined($scope.file)) {
            Notification.error({ message: 'Please select file to upload first', delay: 2000 });
        } else {
            if ($scope.checkSAP) {
                $log.debug($scope.file.filetype);
                if ($scope.file.filetype == 'text/plain') {

                } else {
                    Notification.error({ message: 'File type not support', delay: 2000 });
                }
            } else {
                if ($scope.file.filetype == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || $scope.file.filetype == 'application/vnd.ms-excel') {
                    var data = XLSX.read($scope.file.base64);
                    var sheets = data.Sheets['Import-order-template'];
                    if (sheets) {
                        var sheettojson = XLSX.utils.sheet_to_json(sheets);
                        $http.post(ENV.domain + 'order.importOrder', { data: sheettojson, user: $rootScope.userId }).then(function(data) {
                            if (data.data.success) {
                                displays = data.data.data;
                                $scope.dtInstance.reloadData();
                                Notification.success({ message: 'Import success', delay: 2000 });
                                $http.get(ENV.domain + 'order.getImportHistoryByUser/?userid=' + $rootScope.userId).then(function(res) {
                                    $scope.histories = res.data;
                                })
                                delete $scope.file;
                                $(".input_upload_file").html("File");
                            } else {
                                Notification.error({ message: 'Import unsuccessful, reload page and try again', delay: 2000 });
                            }
                        });
                    } else {
                        Notification.error({ message: 'Can not find sheet "Import-order-template"', delay: 2000 });
                    }
                } else {
                    Notification.error({ message: 'File type not support', delay: 2000 });
                }
            }
        }

    }

    function switchTable() {
        if ($scope.checkSAP) {
            if ($scope.historySAP) {
                $scope.isShow1 = false;
                $scope.isShow2 = true;
                $http.get(ENV.domain + 'order.getImportSapHistoryDetailById/?importid=' + $scope.historySAP).then(function(res) {
                    displays = res.data;
                    $scope.dtOptions = DTOptionsBuilder.newOptions()
                        .withOption('aaData', displays)
                        .withOption('bLengthChange', false)
                        .withOption('bPaginate', true)
                        .withOption('bInfo', true)
                        .withOption('createdRow', function(row, data, dataIndex) {
                            // Recompiling so we can bind Angular directive to the DT
                            $compile(angular.element(row).contents())($scope);
                        })
                        .withOption('bFilter', false);
                    $scope.dtColumns = [
                        DTColumnBuilder.newColumn('order_no').withTitle('Order No.'),
                        DTColumnBuilder.newColumn('position_no').withTitle('Pos.'),
                        DTColumnBuilder.newColumn('ab_no').withTitle('AB'),
                        DTColumnBuilder.newColumn('item_no').withTitle('Product Item No.'),
                        DTColumnBuilder.newColumn('product_line').withTitle('Product Line'),
                        DTColumnBuilder.newColumn('product_item_name').withTitle('Product Item Name'),
                        DTColumnBuilder.newColumn('order_quantity').withTitle('Order Q\'ty'),
                        DTColumnBuilder.newColumn('ab_quantity').withTitle('AB Q\'ty'),
                        DTColumnBuilder.newColumn('currency').withTitle('Currency'),
                        DTColumnBuilder.newColumn('unit_price').withTitle('Unit Price'),
                        DTColumnBuilder.newColumn('confirmed_shipping_date').withTitle('Conf. Ship. Date'),
                        DTColumnBuilder.newColumn('expected_shipping_date').withTitle('Exp. Ship. Date'),
                        DTColumnBuilder.newColumn('za_date').withTitle('ZA. Date'),
                        DTColumnBuilder.newColumn('purchaser').withTitle('Purchaser'),
                        DTColumnBuilder.newColumn('supplier_no').withTitle('Supplier No.'),
                        DTColumnBuilder.newColumn('deletion').withTitle('Deletion'),
                        DTColumnBuilder.newColumn('message').withTitle('Reason'),
                        DTColumnBuilder.newColumn('status').withTitle('Status').renderWith(statusSAP)
                    ];
                    $scope.dtInstance = {};
                    $scope.isShow1 = true;
                    $scope.isShow2 = false;
                });
            }
        } else {
            if ($scope.hitoryItem) {
                $scope.isShow1 = false;
                $scope.isShow2 = true;
                $http.get(ENV.domain + 'order.getImportHistoryDetailById/?importid=' + $scope.hitoryItem).then(function(res) {
                    displays = res.data;
                    $scope.dtOptions = DTOptionsBuilder.newOptions()
                        .withOption('aaData', displays)
                        .withOption('bLengthChange', false)
                        .withOption('bPaginate', true)
                        .withOption('bInfo', true)
                        .withOption('createdRow', function(row, data, dataIndex) {
                            // Recompiling so we can bind Angular directive to the DT
                            $compile(angular.element(row).contents())($scope);
                        })
                        .withOption('bFilter', false);
                    $scope.dtColumns = [
                        DTColumnBuilder.newColumn('order_no').withTitle('Order No.'),
                        DTColumnBuilder.newColumn('position_no').withTitle('Pos.'),
                        DTColumnBuilder.newColumn('ab_no').withTitle('AB'),
                        DTColumnBuilder.newColumn('product_item_no').withTitle('Product Item No.'),
                        DTColumnBuilder.newColumn('product_line').withTitle('Product Line'),
                        DTColumnBuilder.newColumn('product_item_name').withTitle('Product Item Name'),
                        DTColumnBuilder.newColumn('order_qty').withTitle('Order Q\'ty'),
                        DTColumnBuilder.newColumn('ab_qty').withTitle('AB Q\'ty'),
                        DTColumnBuilder.newColumn('confirmed_shipping_date').withTitle('Conf. Ship. Date'),
                        DTColumnBuilder.newColumn('reason').withTitle('Reason'),
                        DTColumnBuilder.newColumn('status').withTitle('Status').renderWith(status)
                    ];
                    $scope.dtInstance = {};
                    $scope.isShow1 = true;
                    $scope.isShow2 = false;
                });
            }
        }
    }

});
