"use strict";
app.filter("asDate", function () {
    return function (input) {
        return new Date(input);
    }
});
app.filter("asArray", function () {
    return function (input) {
        return input.split(',');
    }
});
app.controller('inspectionSchedule', ['$compile','$filter','$window','Notification','$scope','Storage','$timeout','ENV','DTOptionsBuilder', 'DTColumnBuilder','DTColumnDefBuilder','companyService','userService','$http','$state', function($compile,$filter,$window,Notification,$scope,Storage,$timeout,ENV,DTOptionsBuilder, DTColumnBuilder,DTColumnDefBuilder,companyService,userService,$http,$state){


    //define model of page
    var urlData =  ENV.domain+'inspection.execute';
    var OI = this;
    OI.customer = '';
    OI.supplier = '';
    OI.customers = [];
    OI.suppliers = [];
    
    // OI.dtInstance = {};

    OI.ObjectCustomer = {};
    OI.ObjectSupplier = {};
    companyService.getByType(window.globalVariable.company_kind.customer).then(function(data){
        OI.customers = data
    });
    companyService.getByType(window.globalVariable.company_kind.supplier).then(function(data){
        OI.suppliers = data;
    });
   
    OI.selectCustomer = function(){
        OI.cusNum = OI.customer;
    }
    OI.selectSupplier = function(){
        OI.supNum = OI.supplier;
    }

    var date_shown = "dd-M-yy";
    var date_range = {};
   
    $scope.sizes = [ {value: 'cw', name: 'This Week'},
    {value: 'lw', name: 'Last Week'},
    {value: 'cm', name: 'This Month'},
    {value: 'lm', name: 'Last Month'},
    {value: 'cq', name: 'This Quarter'},
    {value: 'lq', name: 'Last Quarter'},
    {value: 'dr', name: 'Input Dates'}];

    $scope.item = $scope.sizes[2];

    $scope.tFromDate="";
    $scope.tEndDate="";
     var today = new Date();
    date_range  = {
                    start: new Date(today.getFullYear(), today.getMonth(), 1),
                    end: Date.getLastMonthDate()
                };
    $scope.tFromDate=date_range.start.toFormat(date_shown);
    $scope.tEndDate=date_range.end.toFormat(date_shown);
    $scope.update = function() {
        var today = new Date();
        switch($scope.item.value) {
            case 'cw': date_range = today.getCurrentWeek(); break;
            case 'cm':
                date_range = {
                    start: new Date(today.getFullYear(), today.getMonth(), 1),
                    end: Date.getLastMonthDate()
                };
                break;
            case 'cq': date_range = Date.getQuarterRange(today.getCurrentQuarter()); break;
            case 'lw':
                var last = new Date();
                last.setDate(today.getDate() - 7);
                date_range = last.getCurrentWeek();
                break;
            case 'lm':
                date_range = {
                    start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
                    end: Date.getLastMonthDate(today.getMonth() - 1)
                };
                break;
            case 'lq': date_range = Date.getQuarterRange(today.getCurrentQuarter() - 1); break;
            case 'dr':
                $('#tFromDate').attr('disabled', false);
                $('#tEndDate').attr('disabled', false);
                break;
        };

        if (this.value != 'dr') {
            $scope.tFromDate=date_range.start.toFormat(date_shown);
            $scope.tEndDate=date_range.end.toFormat(date_shown);
        };
      }

    $scope.selected = {};

    $scope.dtInstance = {};

    //begin
        $scope.dtOptions = DTOptionsBuilder
                            .newOptions()
                            .withDataProp('data')
                            .withOption('serverSide', true)
                            .withFnServerData(function (sSource, aoData, fnCallback, oSettings){                 
                                    $http.get(urlData, {
                                        params: { startTime: aoData[3].value,
                                        length: aoData[4].value,
                                        draw: aoData[0].value,
                                        order: aoData[2].value,
                                        search: aoData[5].value,
                                        columns: aoData[1].value   }                  
                                    }).then(function(data) {   
                                        fnCallback(data.data);
                                        $scope.aoData_draw      = aoData[0].value;
                                        $scope.aoData_columns   = aoData[1].value;
                                        $scope.aoData_order     = aoData[2].value;
                                        $scope.startTime        = aoData[3].value;
                                        $scope.aoData_length    = aoData[4].value;
                                        $scope.aoData_search    = aoData[5].value;                      
                                    });
                                })
                            .withOption('createdRow', function(row, data, dataIndex) {
                                $compile(angular.element(row).contents())($scope);
                            })
                            // .withButtons([
                            // 'print',
                            // 'excel'
                            // ])
                            .withPaginationType('full_numbers')
                            .withColumnFilter({
                                sPlaceHolder: 'head:before',
                                aoColumns: [{
                                    type: 'text'
                                }, {
                                    type: 'text'
                                     
                                }, {
                                    type: 'text'
                                }, {
                                    type: 'text'
                                }, {
                                    type: 'text'
                                }, {
                                    type: 'text'
                                }, {
                                    type: 'text'
                                }, {
                                    type: 'text'
                                }, {
                                    type: 'text'
                                }, {
                                    type: 'text'
                                }, {
                                    type: 'text'
                                }, {
                                    type: 'text'
                                }]
            });
            $scope.dtColumns = [
                DTColumnBuilder.newColumn('order_no').withTitle('Order No.').withClass('dt-body-left'),
                DTColumnBuilder.newColumn('position_no').withTitle('Pos.').withClass('dt-body-center'),
                DTColumnBuilder.newColumn('abno').withTitle('AB').withClass('dt-body-center'),
                DTColumnBuilder.newColumn('product_item_no').withTitle('Product Item No.').withClass('dt-body-left'),
                DTColumnBuilder.newColumn('product_line_name_english').withTitle('Product Line').withClass('dt-body-left'),
                DTColumnBuilder.newColumn('product_item_name_english').withTitle('Product Item Name').withClass('dt-body-left'),
                DTColumnBuilder.newColumn('ordered_quantity').withTitle('Order Q\'ty').renderWith(renderQty).withClass('dt-body-right'),
                DTColumnBuilder.newColumn('shipped_quantity').withTitle('AB Q\'ty').renderWith(renderQty).withClass('dt-body-right'),
                DTColumnBuilder.newColumn('accepted').withTitle('Accepted Q\'ty').renderWith(renderQty).withClass('dt-body-right'),
                DTColumnBuilder.newColumn('remain').withTitle('Remain Q\'ty').renderWith(renderQty).withClass('dt-body-right'),
                DTColumnBuilder.newColumn('plan_date').withTitle('Plan Date').renderWith(dateFormat).withClass('dt-body-center'),
                DTColumnBuilder.newColumn('confirmed_shipping_date').withTitle('Conf. Ship. Date').renderWith(dateFormat).withClass('dt-body-center'),
                DTColumnBuilder.newColumn(null).withTitle('Assign').notSortable().renderWith(rederAssign),
                DTColumnBuilder.newColumn(null).withTitle('Edit').notSortable().renderWith(rederAction),
                DTColumnBuilder.newColumn(null).withTitle('Report').notSortable().renderWith(rederReport)
            ];


    $scope.dtColumnDefs = [];
    initListInspectionSchedule();

    $scope.excel = function(){
        getDataExcel();
    }
    function getDataExcel(){

        var s1='';
        var s2='';
        var s3='';
        var s4='';
        
        if($scope.tFromDate != ''){
            s1= 'start='+$scope.tFromDate+'&';
        }

        if($scope.tEndDate != ''){
            s2= 'end='+$scope.tEndDate+'&';
        }

        if(OI.customer != ''){
            s3= 'cusid='+OI.customer+'&';
        }

        if(OI.supplier != ''){
            s4= 'supid='+OI.supplier+'&';
        }

        var sSearch = s1+s2+s3+s4;
        
        var urlDataExcel = ENV.domain+'inspection.excel?'+sSearch;
        $http.get(urlDataExcel,{
            params: {   startTime: $scope.startTime,
                        length: $scope.aoData_length,
                        draw:  $scope.aoData_draw,
                        order: $scope.aoData_order,
                        search: $scope.aoData_search,
                        columns: $scope.aoData_columns   }
        }).then(function(res){
            window.location.assign(res.data);
        });
    }
    $scope.searchOrder = function(){
        initListInspectionSchedule();
        $("#order_list_datatable").dataTable().fnDraw(true);
    };

    function dateFormat(data){
        return $filter('date')(new Date(data), 'dd-MMM-yyyy');
    } 

    function renderQty(data){
        return $filter('number')(data, 0);
    }

    function rederAssign(data,type,full,meta)
    {
        return '<td class="btn_edit"><a class="cursor" data-toggle="modal" data-target="#editSchedule" ng-click="setInspectionSchedule('+"'"+full.inspector1+"'"+','+"'"+full.inspector2+"'"+','+"'"+full.plan_date+"'"+','+"'"+full.inspection_schedule_id+"'"+')"><i class="fa fa-calendar"></i></a></td>';
    }
    function rederAction(data,type,full,meta)
    {
        return '<td class="btn_edit"><a class="cursor" ng-click="choiseInspectionReport('+"'"+data.inspection_schedule_id+"'"+','+"'"+data.list_ins_no+"'"+','+"'"+data.abid+"'"+','+"'"+data.product_item_no+"'"+','+"'"+data.remain+"'"+')"><i class="fa fa-pencil-square-o"></i></a></td>'
    }
    function rederReport(data,type,full,meta)
    {
        var returnString ='<td class="btn_edit">';
        var space=",";
        var arrays = full.list_ins_no.split(',');
         angular.forEach(arrays,function(value,index){
            if(arrays.length == index+1)
                space = "";
            returnString +='<a class="cursor" ng-click="goPDF(\''+value+'\')">'+
                                value + space 
                            +'</a>';
         });
         returnString +='</td>';
        return returnString;
    }

    function initListInspectionSchedule(){

        var s1='';
        var s2='';
        var s3='';
        var s4='';
        
        if($scope.tFromDate != ''){
            s1= 'start='+$scope.tFromDate+'&';
        }

        if($scope.tEndDate != ''){
            s2= 'end='+$scope.tEndDate+'&';
        }

        if(OI.customer != ''){
            s3= 'cusid='+OI.customer+'&';
        }

        if(OI.supplier != ''){
            s4= 'supid='+OI.supplier+'&';
        }

        var sSearch = s1+s2+s3+s4;
        urlData = ENV.domain+'inspection.execute?'+sSearch;
    }
    //end

    $scope.listInspection =[];

    userService.listInspection().then(function(data){
       $scope.listInspection  = data;

    });


    function getInspectorName1(id){
        if(id == '')return $scope.inspectorname1 ='';
        angular.forEach($scope.listInspection,function(data){
            if(data.id_user == id){
                return $scope.inspectorname1 = data.user_name;
            }
        })
    }

      function getInspectorName2(id){
        if(id == '')return $scope.inspectorname2 ='';
        angular.forEach($scope.listInspection,function(data){
            if(data.id_user == id){
                return $scope.inspectorname2 = data.user_name;
            }
        })
    }


    $scope.inspection_schedule_id = null;

    $scope.setInspectionSchedule = function(inspector1,inspector2,plan_date,inspection_schedule_id){
        $scope.inspector1 =   inspector1;
        $scope.inspector2 = inspector2;
        $scope.plan_date = new Date(plan_date).toFormat(date_shown);
        $scope.inspection_schedule_id  = inspection_schedule_id ;

        $("#inspector2").select2('val',$scope.inspector2);
        $("#inspector1").select2('val',$scope.inspector1);
    }

    // ui-sref="home.inspection.report({pid:orderItem.product_item_no,abid:orderItem.abid})" data-toggle="modal" data-target="#itemInspected"
    $scope.choiseInspectionReport = function(index,list_ins_no,abid,product_item_no,remain){
        $http.get(ENV.domain+'inspection.execute?id='+index).then(function(res){
            if(res.data.length > 0){
                $scope.listItemSet= res.data;
                getInspectorName1($scope.listItemSet[0].inspector1);
                getInspectorName2($scope.listItemSet[0].inspector2);
                $('#itemInspected').modal('show');
            }
            else{
                $scope.listInspectionReport = [] ;
                var offlineAB = window.IR[abid] ;
                if( offlineAB != undefined || offlineAB != null ){
                    Object.keys(offlineAB.list).forEach(function (key) {
                        $scope.listInspectionReport.push( offlineAB.list[ key ] ) ;
                    });
                }


                if(list_ins_no == '' && $scope.listInspectionReport.length == 0){
                    //go to create new inspection report
                    $state.go('home.inspection.report',{pid:product_item_no,abid:abid,quantity:1});
                }else{
                    //show modal list inspection report
                    $http.get(ENV.domain+'inspection.execute?abid='+abid).then(function(res){
                        // if(res.data.length >0){
                        //     $scope.newReport = remain >0 ? true : false;
                        //     $scope.listInspectionReport = res.data;
                        //     $('#listInspected').modal('show');
                        // }
                        for (var i = res.data.length - 1; i >= 0; i--) {
                            $scope.listInspectionReport.push( res.data[i] ) ;
                        };
                        if( $scope.listInspectionReport.length > 0 ){
                            console.log( $scope.listInspectionReport );
                            $scope.newReport = remain >0 ? true : false;
                            $('#listInspected').modal('show');
                        }
                    })
                }
                
            }
        })

    }

    $scope.goReportEdit = function(index){
        $state.go('home.inspection.report',{pid:$scope.listInspectionReport[index].inspected_product_item_no,abid:$scope.listInspectionReport[index].abid,quantity:1,insid:$scope.listInspectionReport[index].inspectionid});
        $('#listInspected').modal('hide');
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
    }

    $scope.goReportNew = function(){
        $state.go('home.inspection.report',{pid:$scope.listInspectionReport[0].inspected_product_item_no,abid:$scope.listInspectionReport[0].abid,quantity:1,insid:0});
        $('#listInspected').modal('hide');
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
    }


    $scope.goReport = function(index){
        $state.go('home.inspection.report',{pid:$scope.listItemSet[index].product_item_no,abid:$scope.listItemSet[index].abid,quantity:$scope.listItemSet[index].quantity_product_item_set,parent:$scope.listItemSet[index].parent});
        $('#itemInspected').modal('hide');
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
    }

    $scope.saveInspectionSchedule = function(){
         var data = {id:$scope.inspection_schedule_id,inspector1:$scope.inspector1,inspector2:$scope.inspector2,plan_date:$scope.plan_date,updateby:'rasia'};
          $http.put(ENV.domain+'inspection.editSchedule',data).then(function(data){
            if(data.data.success){
                $('#editSchedule').modal('hide');
                Notification.success({message : data.data.message,delay : 2000});
                initListInspectionSchedule();
                $("#order_list_datatable").dataTable().fnDraw(true);

            }else{
                 Notification.error({message : data.data.message,delay : 2000});
            }
        });
    }

    $scope.goPDF = function(ins_no){
        $window.open('fileUpload/inspectionReport/'+ins_no+".pdf");
    }

    $scope.goSubPDF = function(index){
        $window.open('fileUpload/inspectionReport/'+$scope.listItemSet[index].inspection_no+".pdf");
    }



    $timeout(function () {
        $("#tFromDate").datepicker({ dateFormat: "dd-M-yy" }).val();
        $("#tEndDate").datepicker({ dateFormat: "dd-M-yy" }).val();
        $("#plan_date").datepicker({ dateFormat: "dd-M-yy" }).val();
        $( ".datepicker" ).datepicker( "option", "prevText", "<" );
        $( ".datepicker" ).datepicker( "option", "nextText", ">" );
        $( ".datepicker" ).datepicker( "option", "firstDay", 1 );
        pageSetUp();
    }, 100)


}]);

