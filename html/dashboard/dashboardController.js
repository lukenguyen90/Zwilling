"use strict";
app.filter("asDate", function () {
    return function (input) {
        return new Date(input);
    }
});
app.controller('dashboard', function($scope,$http,$log, $timeout, ENV,companyService,productSegmentService){

  // calendar
  var date = new Date();
  var d = date.getDate();
  var m = date.getMonth() +1;
  var y = date.getFullYear();
  var events = [];
  var currentMonth = m;
  var currentYear = y;

  $http.get(ENV.domain+'dashboard.execute?month='+m+'&year='+y).then(function(res){
      events = res.data.calendar;
      $('#calendar').fullCalendar({
          lang: 'en',
          header:{
              left: 'prev',
              center: 'title',
              right: 'next'
          },
          firstDay: 1,
          eventSources: [
              {
                  events: events      
              }
          ]
          ,
          eventRender: function(event, element) {
            if(event.icon){
              element.find(".fc-title").prepend(event.icon+"<br>");
            }
          }  
      });
      searchEvents();
      $('.fc-next-button, .fc-prev-button').click(function(){
            var date =  new Date($('#calendar').fullCalendar( 'getDate' ));
            currentMonth = date.getMonth() + 1;
            currentYear =  date.getFullYear();
            searchEvents();
            return false;
        });
  });

    $scope.listMasterData = [];
    $scope.listOrderData = [];
    $scope.listInspectionReport = [];
    $http.get(ENV.domain+'userActivity.execute').then(function(res){
      $scope.listMasterData = res.data.master;
      $scope.listOrderData = res.data.order;
      $scope.listInspectionReport = res.data.inspection;
    });

   $scope.locations = [];
   companyService.getLocations().then(function(res){
        $scope.locations = res;
    });
    $scope.segments = [];
    productSegmentService.getAll().$promise.then(function(res){
         $scope.segments = res;
    });
    $scope.suppliers = [];
    companyService.getByType(window.globalVariable.company_kind.supplier).then(function(res){
        $scope.suppliers = res;
    });
    $scope.changeLocation = function(){
        $scope.supplierId ='';
        //bug select2
            $('#supplierId').select2('val',"");
        //
        $http.get(ENV.domain+'dashboard.getSupplier?locationid='+$scope.locationId).then(function(res){
            $scope.suppliers = res.data;
        });
    };
    $scope.locationId ='';
    $scope.supplierId ='';
    $scope.segmentId = '';
    $scope.searchEvents = searchEvents;

  function searchEvents(){
    var api = ENV.domain+'dashboard.execute?month='+currentMonth+'&year='+currentYear;
    if($scope.locationId != ''){
        api =api + "&location=" + $scope.locationId;
    }
    if($scope.supplierId != ''){
        api =api + "&supplier=" + $scope.supplierId;
    }
    if($scope.segmentId != ''){
        api =api + "&segment=" + $scope.segmentId;
    }
    $http.get(api).then(function(res){
      $('#calendar').fullCalendar( 'removeEventSource', events);
      $('#calendar').fullCalendar( 'addEventSource', res.data.calendar);  
      events = res.data.calendar;
      $('#calendar').fullCalendar( 'refetchEvents' );
      $scope.topproduct_label = [];
      $scope.topproduct_data  = [];
      $scope.topsupplier_label= [];
      $scope.topsupplier_data = [];
      $scope.dashboard_label  = [];
      $scope.dashboard_data   = [];
      var dashboard_data      = [];
      angular.forEach(res.data.product,function(value){
          $scope.topproduct_label.push(value.title);
          $scope.topproduct_data.push(value.price);
      });
      angular.forEach(res.data.supplier,function(value){
          $scope.topsupplier_label.push(value.title);
          $scope.topsupplier_data.push(value.price);
      });
      angular.forEach(res.data.order,function(value){
          $scope.dashboard_label.push(value.title);
          dashboard_data.push(value.price);
      });
      $scope.dashboard_data.push(dashboard_data);
    });
  }

  $scope.options = {
    tooltips: {
      enabled: true,
      mode: 'single',
      callbacks: {
        title: function (tooltipItem, data) { 
          return data.labels[tooltipItem[0].index]; 
        },
        label: function(tooltipItem, data) {
          var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].toString().replace(".",",");
          return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
      }
    }
  };

  $scope.optionsLine = {
    tooltips: {
      enabled: true,
      mode: 'single',
      callbacks: {
        label: function(tooltipItem, data) {
          var datasetLabel = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].toString().replace(".",",");
          return datasetLabel.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
      }
    },
    scales: {
        yAxes: [{
          ticks: {
              callback: function(value, index, values) {
                  var datasetLabel = value.toString().replace(".",",");
                  return datasetLabel.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
              }
          }
        }]
    }
  };

  $timeout(function () {
      pageSetUp();
  }, 100);

});

