"use strict";
app.controller('inspectionEvaluation', ['$http','$scope','$timeout','ENV','DTOptionsBuilder','DTColumnBuilder','companyService','$filter','userService', function($http,$scope,$timeout,ENV,DTOptionsBuilder,DTColumnBuilder,companyService,$filter,userService){

	$scope.showTable = false;
		$scope.dtOptions = DTOptionsBuilder.fromSource('');
	    $scope.dtColumns = [
	        DTColumnBuilder.newColumn(null)
	    ];
	$scope.dtInstance = {};

    $scope.supplier = '';
    $scope.ins_from ='';
    $scope.ins_to ='';
    $scope.product_segment = '';
    $scope.product_line = '';
    $scope.suppliers = [];
    $scope.ListProductSegment =[];
    $scope.order_no = '';
    $scope.inspection_no = '';
    $scope.inspectorid = '';
    $scope.product_item_no = '';
    $scope.evaluationReportExcel = false;
    $scope.detailReportExcel = false;

    companyService.getByType(window.globalVariable.company_kind.supplier).then(function(data){
        $scope.suppliers = data;
    });


   $http.get(ENV.domain+'productSegment.execute').then(function(res){
   		$scope.ListProductSegment =res.data;
   });

   $http.get(ENV.domain+'evaluation.getProductLineBySegment?id='+$scope.product_segment).then(function(res){
   		$scope.ListProductLine = res.data;
   });

   $scope.getProductLine = function(){
	   	$http.get(ENV.domain+'evaluation.getProductLineBySegment?id='+$scope.product_segment).then(function(res){
	   		$scope.ListProductLine = res.data;
	   });
   }

   $scope.inspectors = [];
    userService.listInspection().then(function(res){
        $scope.inspectors = res;
    });

    function renderQty(data){
        return $filter('number')(data, 0);
    }

    function renderMoney(data){
        return $filter('number')(data,2);
    }

    function renderDate(data){
    	return $filter('date')(new Date(data), 'dd-MMM-yyyy');
    }

    var excelData = [];
	$scope.excel = function(evaluationid){
		$http.post(ENV.domain+'evaluation.excel', { 
						start: excelData[3].value,
                        length: excelData[4].value,
                        draw: excelData[0].value,
                        order: excelData[2].value,
                        "supplier": $scope.supplier,
						"product_segment": $scope.product_segment,
						"inspection_date_from": $scope.ins_from,
						"inspection_date_to": $scope.ins_to,
						"order_no": $scope.order_no,
						"product_line": $scope.product_line,
						"product_item": $scope.product_item_no,
						"inspection_no": $scope.inspection_no,
						"inspector": $scope.inspectorid,
						"key": evaluationid,
						"excel": evaluationid      
                    }).then(function(data) {                  
                         window.location.assign(data.data);                        
                    });
	}

    $scope.DetailOrderData = function(evaluationid){
		var url = ENV.domain+'evaluation.inspection';
		var data = {
				"supplier": $scope.supplier,
				"product_segment": $scope.product_segment,
				"inspection_date_from": $scope.ins_from,
				"inspection_date_to": $scope.ins_to,
				"order_no": $scope.order_no,
				"product_line": $scope.product_line,
				"product_item": $scope.product_item_no,
				"inspection_no": $scope.inspection_no,
				"inspector": $scope.inspectorid,
				"key": evaluationid
			};
    	switch(evaluationid){
    	
    		case 'evaluationReport':
    			//evaluation for supplier's reliability
    			$scope.evaluationReportExcel = true;
    			$scope.detailReportExcel = false;
				$scope.showTable = true;
				$scope.dtOptions  = DTOptionsBuilder.newOptions()
		            .withDataProp('data')
		            .withOption('serverSide', true)
		            .withFnServerData(function (sSource, aoData, fnCallback, oSettings){
		            		excelData = aoData;
		                    $http.post(url, { 
		                    	start: aoData[3].value,
		                        length: aoData[4].value,
		                        draw: aoData[0].value,
		                        order: aoData[2].value,
		                        "supplier": $scope.supplier,
								"product_segment": $scope.product_segment,
								"inspection_date_from": $scope.ins_from,
								"inspection_date_to": $scope.ins_to,
								"order_no": $scope.order_no,
								"product_line": $scope.product_line,
								"product_item": $scope.product_item_no,
								"inspection_no": $scope.inspection_no,
								"inspector": $scope.inspectorid,
								"key": evaluationid              
		                    }).then(function(data) {       
		                        fnCallback(data.data);                        
		                    });
		                })
			        .withOption('createdRow', function(row, data, dataIndex) {
			            // Recompiling so we can bind Angular directive to the DT
			            // $compile(angular.element(row).contents())($scope);
			        })
			        .withOption('bFilter', false);

				    $scope.dtColumns = [
				        DTColumnBuilder.newColumn('locationname').withTitle('Location').withClass('dt-body-center'),
				    	DTColumnBuilder.newColumn('inspection_no').withTitle('Inspection No.').withClass('dt-body-center'),
				        DTColumnBuilder.newColumn('inspection_date').withTitle('Inspection Date').renderWith(renderDate),
				        DTColumnBuilder.newColumn('inspected_product_item_no').withTitle('Product Item No.'),
				        DTColumnBuilder.newColumn('product_item_name_english').withTitle('Prodcut Item Name'),
				        DTColumnBuilder.newColumn('result').withTitle('Inspection Result').withClass('dt-body-center'),
				        DTColumnBuilder.newColumn('name').withTitle('Supplier Name'),
				        DTColumnBuilder.newColumn('inspected_ql').withTitle('Quantity Level').withClass('dt-body-center'),
				        DTColumnBuilder.newColumn('ordered_quantity').withTitle('Order Quantity').renderWith(renderQty).withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('inspected_quantity').withTitle('Inspection Quantity').renderWith(renderQty).withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('total_critical_detect').withTitle('Amount Of Critical Defects').withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('total_major_detect').withTitle('Amount Of Major Defects').withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('total_minor_detect').withTitle('Amount Of Minor Defects').withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('total_mistake').withTitle('Number Of Mistake').withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('order_no').withTitle('Order No.').withClass('dt-body-center'),
				        DTColumnBuilder.newColumn('position_no').withTitle('Position No.').withClass('dt-body-center'),
				        DTColumnBuilder.newColumn('abno').withTitle('AB No.').withClass('dt-body-center'),
				        DTColumnBuilder.newColumn('comment').withTitle('Remarks'),
				        DTColumnBuilder.newColumn('inspector').withTitle('Inspector'),
				        DTColumnBuilder.newColumn('seal_from1').withTitle('Seal Stickers From'),
				        DTColumnBuilder.newColumn('seal_to1').withTitle('Seal Stickers To'),
				        DTColumnBuilder.newColumn('seal_from2').withTitle('Seal Stickers From'),
				        DTColumnBuilder.newColumn('seal_to2').withTitle('Seal Stickers To')
				        // DTColumnBuilder.newColumn('singleitemno').withTitle('Single Item No.')
				    ];

				    $scope.dtInstance = {};
				    $("#detail_order_data").dataTable().fnDraw(true);
    		break;
    		case 'detailReport':
    				// evaluation for detail order data
    				$scope.evaluationReportExcel = false;
    				$scope.detailReportExcel = true;
    			 	$scope.showTable = true;
    				$scope.dtOptions  = DTOptionsBuilder.newOptions()
		            .withDataProp('data')
		            .withOption('serverSide', true)
		            .withFnServerData(function (sSource, aoData, fnCallback, oSettings){
		            		excelData = aoData;
		                    $http.post(url, { 
		                    	start: aoData[3].value,
		                        length: aoData[4].value,
		                        draw: aoData[0].value,
		                        order: aoData[2].value,
		                        "supplier": $scope.supplier,
								"product_segment": $scope.product_segment,
								"inspection_date_from": $scope.ins_from,
								"inspection_date_to": $scope.ins_to,
								"order_no": $scope.order_no,
								"product_line": $scope.product_line,
								"product_item": $scope.product_item_no,
								"inspection_no": $scope.inspection_no,
								"inspector": $scope.inspectorid,
								"key": evaluationid              
		                    }).then(function(data) {                        
		                        fnCallback(data.data);                        
		                    });
		                })
				        .withOption('createdRow', function(row, data, dataIndex) {
				            // Recompiling so we can bind Angular directive to the DT
				            // $compile(angular.element(row).contents())($scope);
				        })
				        .withOption('bFilter', false);

					$scope.dtColumns = [
				    	DTColumnBuilder.newColumn('inspection_no').withTitle('Inspection No.').withClass('dt-body-center'),
				        DTColumnBuilder.newColumn('gildemeisterid').withTitle('Supplier No.').withClass('dt-body-center'),
				        DTColumnBuilder.newColumn('name').withTitle('Supplier Name'),
				        DTColumnBuilder.newColumn('inspected_product_item_no').withTitle('Product Item No.').withClass('dt-body-center'),
				        DTColumnBuilder.newColumn('locationname').withTitle('Location').withClass('dt-body-center'),
				        DTColumnBuilder.newColumn('inspection_date').withTitle('Inspection Date').renderWith(renderDate),
				        DTColumnBuilder.newColumn('mistake_code').withTitle('Mistake Code').withClass('dt-body-center'),
				        DTColumnBuilder.newColumn('total_critical_detect').withTitle('Amount Of Critical Defects').withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('total_major_detect').withTitle('Amount Of Major Defects').withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('total_minor_detect').withTitle('Amount Of Minor Defects').withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('inspected_quantity').withTitle('Inspection Quantity').renderWith(renderQty).withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('ordered_quantity').withTitle('Order Quantity').renderWith(renderQty).withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('order_no').withTitle('Order No.').withClass('dt-body-center'),
				        DTColumnBuilder.newColumn('result').withTitle('Inspection Result').withClass('dt-body-center')
				    ];

					$scope.dtInstance = {};
    				$("#detail_order_data").dataTable().fnDraw(true);
    		break;

    		case 'evaluationChart':
					alert('Comming soon.')
    		break;
    	}
    }



    $timeout(function () {
        $("#ins_from").datepicker({ dateFormat: "dd-M-yy" }).val();
        $("#ins_to").datepicker({ dateFormat: "dd-M-yy" }).val();
        $( ".datepicker" ).datepicker( "option", "prevText", "<" );
        $( ".datepicker" ).datepicker( "option", "nextText", ">" );
        $( ".datepicker" ).datepicker( "option", "firstDay", 1 );
        pageSetUp();
    }, 100);
}]);

