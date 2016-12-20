"use strict";
app.filter("asDate", function () {
    return function (input) {
        return new Date(input);
    }
});
app.controller('quantity_delivery', ['$http','$scope','$timeout','ENV','DTOptionsBuilder','DTColumnBuilder','companyService','$filter','Notification', function($http,$scope,$timeout,ENV,DTOptionsBuilder,DTColumnBuilder,companyService,$filter,Notification){

	$scope.showTable = false;
		$scope.dtOptions = DTOptionsBuilder.fromSource('');
	    $scope.dtColumns = [
	        DTColumnBuilder.newColumn(null)
	    ];
	$scope.dtInstance = {};

    $scope.ins_from ='';
    $scope.ins_to ='';
    $scope.locationId = '';

    $scope.locations = [];
    companyService.getLocations().then(function(res){
        $scope.locations = res;
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

    function renderPercent(data, type, full){
    	var percent = $filter('number')(full.re_qty/full.ab_qty * 100,2) + '%';
    	return percent;
    }

    function renderPercentValue(data, type, full){
    	if($scope.type_report == 'type_value'){
    	var total = full.re_qty/(full.re_qty + full.ac_qty);
    	}
    	else{
    	var total = full.re_lot/(full.re_lot + full.ac_lot);
    	}
    	var percent = $filter('number')(total * 100,2) + '%';
    	return percent;
    }

    function renderTotalValue(data, type, full){
    	if($scope.type_report == 'type_value'){
    	var total = full.re_qty + full.ac_qty;
    	var nu_format = 2;
    	}
    	else{
    	var total = full.re_lot + full.ac_lot;
    	var nu_format = 0;
    	}
        return $filter('number')(total,nu_format);
    }

    $scope.DetailOrderData = function(evaluationid){
    	// var item_location = $filter('filter')($scope.locations, {locationid: $scope.locationId })[0];
    	if($scope.ins_from == '' || $scope.ins_to == ''){
    		Notification.error({message : 'Please Input Date.',delay : 1000});
    		return false;
    	}
    	$scope.type_report = evaluationid;
		var url = ENV.domain+'inspectionStatistic.execute';
		var data = {
				"locationid": $scope.locationId,
				"startdate": $scope.ins_from,
				"enddate": $scope.ins_to
			};
    	switch(evaluationid){
    		case 'type_value':
    			//evaluation for volume per supperlier
    			$scope.showTable = true;
				$http.post(url,data).then(function(res){
    				$scope.listData = res.data; 
    				$scope.titleChart = '% rejected value / delivered value from '+$scope.ins_from+" to "+$scope.ins_to; 
    				$scope.temp = [];
    				$scope.data1 = [];
    				$scope.data2 = [];
    				angular.forEach(res.data,function(v){
					$scope.temp.push(v.name);
					$scope.data1.push(v.re_qty);
					$scope.data2.push(v.ac_qty);
    				});
    				$scope.seriestemp = [{
			        	color: 'red',
			            name: 'Rejected',
			            data: $scope.data1
			        }, {
			        	color: 'green',
			            name: 'Accepted',
			            data: $scope.data2
			        }];
        			loadHightChart();

				    $scope.dtOptions    = DTOptionsBuilder.newOptions()
			        .withOption('aaData',$scope.listData)
			        .withOption('bLengthChange', false)
			        .withOption('bPaginate', true)
			        .withOption('bInfo', true)
			        .withOption('createdRow', function(row, data, dataIndex) {
			            // Recompiling so we can bind Angular directive to the DT
			            // $compile(angular.element(row).contents())($scope);
			        })
					.withButtons([
                            //'print',
                            {
                                extend: 'excel',
                                text: 'Excel',
                                title: 'type_value',
                                extension: '.xlsx'
                            }
                        ])
			        .withOption('bFilter', false);

				    $scope.dtColumns = [
				        DTColumnBuilder.newColumn('name').withTitle('Lieferantenname'),
				        DTColumnBuilder.newColumn('re_qty').withTitle('Value Rejected').renderWith(renderMoney).withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('ac_qty').withTitle('Value Accepted').renderWith(renderMoney).withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('ab_qty').withTitle('Value Total').renderWith(renderTotalValue).withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('ab_qty').withTitle('% Rejected').renderWith(renderPercentValue).withClass('dt-body-right')
				    ];

				    $scope.dtInstance = {};
				});
					
    		break;
    		case 'type_lot':
    			//evaluation for supplier's reliability
				  			$scope.showTable = true;
				$http.post(url,data).then(function(res){
    				$scope.listData = res.data; 
    				$scope.titleChart = '% rejected lots / delivered lots from '+$scope.ins_from+" to "+$scope.ins_to; 
    				$scope.temp = [];
    				$scope.data1 = [];
    				$scope.data2 = [];
    				angular.forEach(res.data,function(v){
					$scope.temp.push(v.name);
					$scope.data1.push(v.re_lot);
					$scope.data2.push(v.ac_lot);
    				});
    				$scope.seriestemp = [{
			        	color: 'red',
			            name: 'Rejected',
			            data: $scope.data1
			        }, {
			        	color: 'green',
			            name: 'Accepted',
			            data: $scope.data2
			        }];
        			loadHightChart();

				    $scope.dtOptions    = DTOptionsBuilder.newOptions()
			        .withOption('aaData',$scope.listData)
			        .withOption('bLengthChange', false)
			        .withOption('bPaginate', true)
			        .withOption('bInfo', true)
			        .withOption('createdRow', function(row, data, dataIndex) {
			            // Recompiling so we can bind Angular directive to the DT
			            // $compile(angular.element(row).contents())($scope);
			        })
					.withButtons([
                            {
                                extend: 'excel',
                                text: 'Excel',
                                title: 'type_lot',
                                extension: '.xlsx'
                            }
                        ])
			        .withOption('bFilter', false);

				    $scope.dtColumns = [
				        DTColumnBuilder.newColumn('name').withTitle('Lieferantenname'),
				        DTColumnBuilder.newColumn('re_lot').withTitle('Lot\'s Pass').renderWith(renderQty).withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('ac_lot').withTitle('Lot\'s Rejected').renderWith(renderQty).withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('ab_qty').withTitle('Lot\'s Total').renderWith(renderTotalValue).withClass('dt-body-right'),
				        DTColumnBuilder.newColumn('ab_qty').withTitle('Percentage').renderWith(renderPercentValue).withClass('dt-body-right')
				    ];

				    $scope.dtInstance = {};
				});
    		break;
    		case 'orderData':
    				//evaluation for detail order data
    		break;
    	}
    }

function loadHightChart(){
	    $('#container').highcharts({
        chart: {
            type: 'column'
        },
        title: {
            text: $scope.titleChart
        },
        xAxis: {
            categories: $scope.temp
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Value'
            },
            stackLabels: {
                enabled: true,
                style: {
                    fontWeight: 'bold',
                    color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                }
            }
        },
        legend: {
            align: 'right',
            x: -30,
            verticalAlign: 'top',
            y: 25,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
            borderColor: '#CCC',
            borderWidth: 1,
            shadow: false
        },
        tooltip: {
            headerFormat: '<b>{point.x}</b><br/>',
            pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                dataLabels: {
                    enabled: true,
                    color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
                    style: {
                        textShadow: '0 0 3px black'
                    }
                }
            }
        },
        series: $scope.seriestemp
    });
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


