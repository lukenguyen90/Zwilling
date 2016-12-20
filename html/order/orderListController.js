app
.filter("asDate", function () {
    return function (input) {
        return new Date(input);
    }
});
app.controller('orderList', ['$scope','$q','$filter','$compile','$timeout','ENV','DTOptionsBuilder', 'DTColumnBuilder','DTColumnDefBuilder','companyService','$http', function($scope,$q,$filter,$compile,$timeout,ENV,DTOptionsBuilder, DTColumnBuilder,DTColumnDefBuilder,companyService,$http){

    //define model of page
    var OL = this;
    OL.customer = '';
    OL.supplier = '';
    OL.customers = [];
    OL.suppliers = [];
    var urlData = ENV.domain+"order.execute?finish=1";
    
    // OL.dtInstance = {};

    OL.ObjectCustomer = {};
    OL.ObjectSupplier = {};
    companyService.getByType(window.globalVariable.company_kind.customer).then(function(data){
        OL.customers = data
    });
    companyService.getByType(window.globalVariable.company_kind.supplier).then(function(data){
        OL.suppliers = data;
    });
   
    OL.selectCustomer = function(){
        OL.cusNum = OL.customer;
    }
    OL.selectSupplier = function(){
        OL.supNum = OL.supplier;
    }

    var date_shown = "dd-M-yy";
    var date_range = {};
   
    $scope.sizes = [ 
    {value: 'td', name: 'Today'},
    {value: 'cw', name: 'This Week'},
    {value: 'lw', name: 'Last Week'},
    {value: 'cm', name: 'This Month'},
    {value: 'lm', name: 'Last Month'},
    {value: 'cq', name: 'This Quarter'},
    {value: 'lq', name: 'Last Quarter'},
    {value: 'cy', name: 'This Year'},
    {value: 'ly', name: 'Last Year'},
    {value: 'dr', name: 'Input Dates'}
    ];

    $scope.option_finish = [ 
    {value: '2', name: 'All'},
    {value: '1', name: 'Unfinished AB'},
    {value: '0', name: 'Finished AB'}
    ];
    $scope.unfinishedab = $scope.option_finish[1];

    $scope.item = $scope.sizes[9];

    $scope.tFromDate="";
    $scope.tEndDate="";
     var today = new Date();
    // date_range = today.getCurrentWeek();
    // $scope.tFromDate=date_range.start.toFormat(date_shown);
    // $scope.tEndDate=date_range.end.toFormat(date_shown);
    $scope.update = function() {
        var today = new Date();
        switch($scope.item.value) {
            case 'td': 
                date_range = {
                    start: today,
                    end: today
                }; 
                break;
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
            case 'cy':
                date_range = {
                    start: new Date(today.getFullYear(),0, 1),
                    end: Date.getLastMonthDate(11)
                };
                break;
            case 'ly':
                date_range = {
                    start: new Date(today.getFullYear()-1,0, 1),
                    end: Date.getLastMonthDate(11,today.getFullYear()-1)
                };
                break;
            case 'dr':
                $scope.tFromDate='';
                $scope.tEndDate='';
                $('#tFromDate').val('');
                $('#tEndDate').val('');
                break;
        };
        if ($scope.item.value != 'dr') {
            $scope.tFromDate=date_range.start.toFormat(date_shown);
            $scope.tEndDate=date_range.end.toFormat(date_shown);
        }else{
            $scope.tFromDate='';
            $scope.tEndDate='';
        }
      }

     $scope.selected = {};


    var listOrder = [];

    $scope.dtOptions  = DTOptionsBuilder.newOptions()
            .withDataProp('data')
            .withOption('serverSide', true)
            .withFnServerData(function (sSource, aoData, fnCallback, oSettings){
                    $http.get(urlData, {
                        params: { start: aoData[3].value,
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
                        $scope.aoData_start     = aoData[3].value;
                        $scope.aoData_length    = aoData[4].value;
                        $scope.aoData_search    = aoData[5].value;

                    });

                })
           .withOption('createdRow', function(row, data, dataIndex) {
                            $compile(angular.element(row).contents())($scope);
                        })
            .withPaginationType('full_numbers')
            // .withButtons([
            //                 'print',
            //                 'excel'
            //             ])
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
        DTColumnBuilder.newColumn('confirmed_shipping_date').withTitle('Conf. Ship. Date').renderWith(dateFormat).withClass('dt-body-center'),
        DTColumnBuilder.newColumn(null).withTitle('SAP').notSortable().renderWith(rederSAP),
        DTColumnBuilder.newColumn(null).withTitle('Edit').notSortable().renderWith(rederAction)
    ];
   
  	$scope.dtColumnDefs = [];
    $scope.dtInstance = {};
   
    function dateFormat(data){
        return $filter('date')(new Date(data), 'dd-MMM-yyyy');
    } 

    function renderQty(data,type,full,meta){
        return $filter('number')(data, 0);
    }

    function renderMoney(data){
        return $filter('number')(data,2);
    }

    function rederAction(data){
        return '<td class="btn_edit"><a class="cursor" ui-sref="home.order.edit({id: '+data.orderid+'})"><i class="fa fa-pencil-square-o"></i></a></td>';
    }

    function rederSAP(data){
        var returnString = ""
        if(data.is_sap=="1"){
            returnString =  "<i class='fa fa-check-square-o'></i>";
        }
        return returnString;
    }




    $scope.searchOrder = function(){
        initListOrder();
        $("#product_item_datatable").dataTable().fnDraw(true);
    };

    $scope.exportExcel = function(){
       getDataIntoExcel();   
    };
    function getDataIntoExcel(){
        var deferred = $q.defer();
        var s1='';
        var s2='';
        var s3='';
        var s4='';
        
        if($scope.tFromDate != ''){
            s1= 'startdate='+$scope.tFromDate+'&';
        }

        if($scope.tEndDate != ''){
            s2= 'end='+$scope.tEndDate+'&';
        }

        if(OL.customer != ''){
            s3= 'cusid='+OL.customer+'&';
        }

        if(OL.supplier != ''){
            s4= 'supid='+OL.supplier+'&';
        }

        var s5= 'finish='+$scope.unfinishedab.value;

        sSearch = s1+s2+s3+s4+s5;
        var urlDataExcel = ENV.domain+'order.excel?'+sSearch;
       
        $http.get(urlDataExcel, {
                        params: { start: $scope.aoData_start,
                        length: $scope.aoData_length,
                        draw:  $scope.aoData_draw,
                        order: $scope.aoData_order,
                        search: $scope.aoData_search,
                        columns: $scope.aoData_columns   }                  
                    }).then(function(res) { 
                      window.location.assign(res.data);
                    });
    }
    function initListOrder(){
        var deferred = $q.defer();
        var s1='';
        var s2='';
        var s3='';
        var s4='';
        
        if($scope.tFromDate != ''){
            s1= 'startdate='+$scope.tFromDate+'&';
        }

        if($scope.tEndDate != ''){
            s2= 'end='+$scope.tEndDate+'&';
        }

        if(OL.customer != ''){
            s3= 'cusid='+OL.customer+'&';
        }

        if(OL.supplier != ''){
            s4= 'supid='+OL.supplier+'&';
        }

        var s5= 'finish='+$scope.unfinishedab.value;

        sSearch = s1+s2+s3+s4+s5;
        urlData = ENV.domain+'order.execute?'+sSearch;
        
    }
    //end


    $timeout(function () {
   
        $("#tFromDate").datepicker({ dateFormat: "dd-M-yy" }).val();
        $("#tEndDate").datepicker({ dateFormat: "dd-M-yy" }).val();
        $( ".datepicker" ).datepicker( "option", "prevText", "<" );
        $( ".datepicker" ).datepicker( "option", "nextText", ">" );
        $( ".datepicker" ).datepicker( "option", "firstDay", 1 );
        pageSetUp();
    }, 100)


}]);