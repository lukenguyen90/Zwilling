"use strict";
app.controller('inspectionReport', ['$rootScope', '$window', '$scope', '$timeout', 'ENV', '$state', '$stateParams', '$http', 'userService', 'Notification', function($rootScope, $window, $scope, $timeout, ENV, $state, $stateParams, $http, userService, Notification) {

    $scope.tab = 1;
    $scope.critical = 0;
    $scope.major = 0;
    $scope.minor = 0;
    $scope.notice = 0;
    $scope.listImages = [];
    $scope.offlineImages = [];

    $("#mistake_dictionary").select2("val", "");
    $scope.setTab = function(newTab) {
        $scope.tab = newTab;
    };

    $scope.isSet = function(tabNum) {
        return $scope.tab === tabNum;
    };

    $scope.pid = $stateParams.pid;
    $scope.abid = $stateParams.abid;
    $scope.qty = $stateParams.quantity;
    $scope.parent = $stateParams.parent;
    $scope.insid = 0;
    if ($stateParams.insid != '') {
        $scope.insid = $stateParams.insid;
    }

    var date_shown = "dd-M-yy";

    $scope.inspection_date = new Date().toFormat(date_shown);

    $scope.inspectionReport = null;

    $scope.listInspection = [];

    userService.listInspection().then(function(data) {
        $scope.listInspection = data;

    });


    // $scope.listMissingReason=[];
    $http.get(ENV.domain + 'missingReason.execute').then(function(data) {
        $scope.listMissingReason = data.data;
    });


    function isNumber(obj) {
        return !isNaN(parseFloat(obj))
    }


    $http.get(ENV.domain + 'inspectionResult.execute').then(function(data) {
        $scope.listInspectionResult = data.data;
        $scope.inspection_result = $scope.listInspectionResult[0].inspection_result_description;
    });

    $scope.listMistakeItem = [];
    $scope.totalCritical = 0;
    $scope.totalMajor = 0;
    $scope.totalMinor = 0;

    function validValues(value) {
        var re = /^[0-9]{1,7}$/;
        return re.test(value);
    }


    $http.get(ENV.domain + 'inspection.getToDoList').then(function(data) {
        $scope.todoList = data.data;
    });


    $scope.todoChange = function(index,selectedValue){
        $scope.todoList[index].value =selectedValue;
    }

    $scope.saveMistake = function() {
        var valid = false;
        var messageValid = 'Please, Input data in fields: </br>';
        if ($scope.mistake_dictionary == undefined) {
            messageValid += '- Mistake description </br>';
            valid = true;
        }

        if (!validValues($scope.critical)) {
            messageValid += '- Critical / Must be number </br>';
            valid = true;
        }

        if (!validValues($scope.major)) {
            messageValid += '- Major / Must be number </br>';
            valid = true;
        }

        if (!validValues($scope.minor)) {
            messageValid += '- Minor / Must be number </br>';
            valid = true;
        }
        if (!validValues($scope.notice)) {
            messageValid += '- Notice / Must be number </br>';
            valid = true;
        }
        if (valid) {
            Notification.error({ message: messageValid, delay: 3000 });
            return;
        }


        $scope.mistake_dictionary = angular.fromJson($scope.mistake_dictionary);
        $scope.listMistakeItem.push({ mistake_code: $scope.mistake_dictionary.mistake_code, mistake_description_english: $scope.mistake_dictionary.mistake_description_english, critical: $scope.critical, major: $scope.major, minor: $scope.minor, notice: $scope.notice,inspection_mistake_id: '' });
        $scope.totalCritical += parseInt($scope.critical);
        $scope.totalMajor += parseInt($scope.major);
        $scope.totalMinor += parseInt($scope.minor);

        if ($scope.totalCritical > 0 || $scope.totalMajor > $scope.inspectionReport.major_allow || $scope.totalMajor > $scope.inspectionReport.major_reject || $scope.totalMinor > $scope.inspectionReport.minor_allow || $scope.totaMinor > $scope.inspectionReport.minor_reject) {
            $scope.inspection_result = $scope.listInspectionResult[2].inspection_result_description;
            $("#inspection_result").select2('val', $scope.inspection_result);
            $scope.getInspectionKey($scope.inspection_result);
        }

        //save mistake when edit inspection report
        // if ($scope.inspectionid != '') {
        //     var data = {
        //         "inspectionid": $scope.inspectionid,
        //         "mistake_code": $scope.mistake_dictionary.mistake_code,
        //         "number_of_critical_defect": $scope.critical,
        //         "number_of_major_defect": $scope.major,
        //         "number_of_minor_defect": $scope.minor,
        //         "number_of_notice": $scope.notice,
        //         "updateby": $rootScope.username
        //     }
        //     $http.post(ENV.domain + 'inspectionReportMistake.execute', data).then(function(res) {
        //         if (res.data['success']) {
        //             $scope.listMistakeItem[$scope.listMistakeItem.length - 1].inspection_mistake_id = res.data.inspection_mistake_id;
        //             Notification.success({ message: res.data['message'] || 'Input mistake success', delay: 2000 });
        //         } else {
        //             Notification.error({ message: res.data['message'] || 'Input mistake failed.', delay: 5000 });
        //         }
        //     });
        //     $scope.critical = 0;
        //     $scope.major = 0;
        //     $scope.minor = 0;
        //     $scope.notice = 0;
        //     $scope.mistake_dictionary = '';
        //     $("#mistake_dictionary").select2("val", "");
        // }

    }

    $scope.listDocuments = [];
    $scope.reportforchild = false;
    var list_result_default = ['Accepted','Accepted as special release'];

    // offline var
    var offlineAB = {
        count : 0,
        list : {}
    };
    var offlineInspection ;
    if( window.IR[$scope.abid] == undefined ){
        window.IR[$scope.abid] = offlineAB;
    }else{
        offlineAB = window.IR[$scope.abid] ;
    }
    if( $scope.insid.toString().search("Temp") >= 0 ){
        Object.keys(offlineAB.list).forEach(function (key) {
            if( key == $scope.insid ){
                offlineInspection = offlineAB.list[ key ] ;
                console.log( offlineInspection );
            }
        });
        $scope.insid = 0 ;
    }
    Array.prototype.pushArray = function(arr) {
        this.push.apply(this, arr);
    };
    $http.get(ENV.domain + "inspection.execute?schab=" + $scope.abid + "&itemno=" + $scope.pid + "&quantity=" + $scope.qty + "&insid=" + $scope.insid).then(function(data) {
        $scope.inspectionReport = data.data;

        $http.get(ENV.domain + 'productSegmentMistakeDictionary.execute?product_segment_id=' + $scope.inspectionReport.product_segment_id).then(function(data) {
            $scope.listMistakeDictionary = data.data;
        });
        //get documents by product_segment_id
        $http.get(ENV.domain + 'inspection.getListDocument?itemno=' + $scope.pid + '&product_segment_id=' + $scope.inspectionReport.product_segment_id).then(function(data) {
            $scope.listDocuments = data.data;
        });

        $scope.reportforchild = Boolean($scope.inspectionReport.is_general_report);
        $scope.ab_no = $scope.inspectionReport.abno;
        $scope.pos_no = $scope.inspectionReport.position_no;
        $scope.order_no = $scope.inspectionReport.order_no;
        $scope.quantityAccepted = $scope.inspectionReport.total_accepted;

        if( offlineInspection != undefined){

            $scope.inspection_no    = offlineInspection.inspection_no ;
            $scope.inspectionid     = offlineInspection.inspectionid;
            $scope.quantity_accepted= offlineInspection.quantity_accepted ;
            $scope.totalShipped     = offlineInspection.totalShipped ;
            $scope.totalRejected    = offlineInspection.totalRejected ;
            // to do list
            $scope.todoList         = offlineInspection.todo_list ;
            // result and type
            $scope.result           = offlineInspection.result ;
            $scope.result_type      = offlineInspection.result_type ;

            $scope.listMistakeItem  = offlineInspection.mistake ;

            $scope.missing_reason_td= offlineInspection.missing_td;
            $scope.missing_reason_ss= offlineInspection.missing_ss;

            $scope.technicalDrawin  = offlineInspection.missing_td == 1 ? 1 : 0;
            $scope.sealedSample     = offlineInspection.missing_ss == 1 ? 1 : 0;
            // inspector
            $scope.inspector1       = offlineInspection.inspector1;
            $scope.inspector2       = offlineInspection.inspector2;
            $scope.plan_date        = offlineInspection.dataSchedule.plan_date;
            $scope.inspectedQty     = offlineInspection.inspected_quantity;

            $scope.inspection_date  = offlineInspection.inspection_date;

            $scope.sealFrom1        = offlineInspection.sealfrom1;
            $scope.sealTo1          = offlineInspection.sealto1;
            $scope.sealFrom2        = offlineInspection.sealfrom2;
            $scope.sealTo2          = offlineInspection.sealto2;
            $scope.comment          = offlineInspection.comment;
            $scope.carton_info      = offlineInspection.carton_info;
            // image
            $scope.offlineImages = offlineInspection.images;
        }else{
            $scope.inspection_no = $scope.inspectionReport.inspection_no;
            $scope.inspectionid = $scope.inspectionReport.inspectionid;
            $scope.quantity_accepted = $scope.inspectionReport.quantity_accepted;
            $scope.totalShipped     =  $scope.inspectionReport.shipped_quantity;
            $scope.totalRejected    = $scope.inspectionReport.total_rejected;
            // todo list
            $scope.todoColumn = $scope.inspectionReport.todo_list;
            var todo = {}
            if($scope.todoColumn == null){
                $scope.todoColumn = [];
            }
            $scope.todoColumn.map(function (v) { 
                todo[v.id] = v.value
            });
            $scope.todoList.map(function (v, i, arr) {
                if (typeof todo[v.id] == 'undefined') return
                v.value = todo[v.id]
            });
            // result and result type
            $scope.result_type = list_result_default.indexOf($scope.inspectionReport.result.trim()) > -1 ? 1 : 0;
            if($scope.inspectionReport.result.trim() == ''){
                $scope.result_type = 1;
                $scope.inspection_result = $scope.inspectionReport.result;
            }
            // inspector
            $scope.inspector1 = $scope.inspectionReport.inspector1;
            $scope.inspector2 = $scope.inspectionReport.inspector2;
            $scope.plan_date = $scope.inspectionReport.plan_date;
            $scope.inspectedQty = $scope.inspectionid != '' ? $scope.inspectionReport.reportqty : $scope.inspectionReport.inspected_quantity;

            if ($scope.inspectionReport.inspection_date != '') {
                $scope.inspection_date = new Date($scope.inspectionReport.inspection_date).toFormat(date_shown);
            }

            $scope.sealFrom1 = $scope.inspectionReport.seal_from1;
            $scope.sealTo1 = $scope.inspectionReport.seal_to1;
            $scope.sealFrom2 = $scope.inspectionReport.seal_from2;
            $scope.sealTo2 = $scope.inspectionReport.seal_to2;
            $scope.comment = $scope.inspectionReport.comment;
            $scope.carton_info = $scope.inspectionReport.carton_info;
        }

        // edit version only for online ver
        // if ($scope.inspectionid != '') {
        //     $http.get(ENV.domain + 'inspectionReportMistake.execute?inspectionid=' + $scope.inspectionid).then(function(data) {
        //         angular.forEach(data.data, function(item) {
        //             $scope.totalCritical += parseInt(item.number_of_critical_defect);
        //             $scope.totalMajor += parseInt(item.number_of_major_defect);
        //             $scope.totalMinor += parseInt(item.number_of_minor_defect);
        //             $scope.listMistakeItem.push({ mistake_code: item.mistake_code, mistake_description_english: item.mistake_description_english, critical: item.number_of_critical_defect, major: item.number_of_major_defect, minor: item.number_of_minor_defect, notice: item.number_of_notice, inspection_mistake_id: item.inspection_mistake_id });
        //         });

        //     });


        //     if ($scope.inspectionReport.missing_td == 1) {
        //         $scope.technicalDrawin = 1;
        //         // $scope.missing_reason_td = $scope.inspectionReport.missing_td;
        //     }else{
        //         $scope.technicalDrawin = 0;
        //         $scope.missing_reason_td = $scope.inspectionReport.missing_td;
        //     }
        //     if ($scope.inspectionReport.missing_ss == 1) {
        //         $scope.sealedSample = 1;
        //         // $scope.missing_reason_ss = $scope.inspectionReport.missing_ss;
        //     }else{
        //         $scope.sealedSample = 0;
        //         $scope.missing_reason_ss = $scope.inspectionReport.missing_ss;
        //     }

        // }

        // $scope.inspectedQty = $scope.inspectionReport.inspected_quantity;

        // if($scope.inspectionid !== ''){
        //      $http.get(ENV.domain + 'image.execute?inspectionid=' + $scope.inspectionid).then(function(response) {
        //         $scope.listImages = response.data;
        //     });
        // }
       
    });
    
    $scope.removeMistake = function(index) {
        var value = $scope.listMistakeItem[index];
        // if (value.inspection_mistake_id != '') {
        //     $http.delete(ENV.domain + 'inspectionReportMistake.execute?id=' + value.inspection_mistake_id).then(function(response) {
        //         if (response.data['success']) {
        //             $scope.listMistakeItem.splice(index, 1);
        //             $scope.totalCritical -= parseInt(value.critical);
        //             $scope.totalMajor -= parseInt(value.major);
        //             $scope.totalMinor -= parseInt(value.minor);

        //             if ($scope.totalCritical > 0 || $scope.totalMajor > $scope.inspectionReport.major_allow || $scope.totalMajor > $scope.inspectionReport.major_reject || $scope.totalMinor > $scope.inspectionReport.minor_allow || $scope.totaMinor > $scope.inspectionReport.minor_reject) {
        //                 $scope.inspection_result = $scope.listInspectionResult[2].inspection_result_description;
        //                 $("#inspection_result").select2('val', $scope.inspection_result);
        //             }else{
        //                 $scope.inspection_result = $scope.listInspectionResult[0].inspection_result_description;
        //                 $("#inspection_result").select2('val', $scope.inspection_result);
        //             }

        //             Notification.success({ message: response.data['message'] || 'Delete record mistake success', delay: 2000 });
        //         } else {
        //             Notification.error({ message: response.data['message'] || 'Delete record mistake failed', delay: 2000 });
        //         }
        //     });
        // }else{
            $scope.listMistakeItem.splice(index, 1);
            $scope.totalCritical -= parseInt(value.critical);
            $scope.totalMajor -= parseInt(value.major);
            $scope.totalMinor -= parseInt(value.minor);

            if ($scope.totalCritical > 0 || $scope.totalMajor > $scope.inspectionReport.major_allow || $scope.totalMajor > $scope.inspectionReport.major_reject || $scope.totalMinor > $scope.inspectionReport.minor_allow || $scope.totaMinor > $scope.inspectionReport.minor_reject) {
                $scope.inspection_result = $scope.listInspectionResult[2].inspection_result_description;
                $("#inspection_result").select2('val', $scope.inspection_result);
            }else{
                $scope.inspection_result = $scope.listInspectionResult[0].inspection_result_description;
                $("#inspection_result").select2('val', $scope.inspection_result);
            }
        // }

    }
    $scope.checkIsReject = false;
   

    $scope.getInspectionKey = function(key){
        var trKey = key.trim();
        $scope.result_type = list_result_default.indexOf(trKey) > -1 ? 1 : 0;
        $scope.totalRejected    = $scope.inspectionReport.total_rejected;
        $scope.quantityAccepted = $scope.inspectionReport.total_accepted;
        $scope.totalShipped     =  $scope.inspectionReport.shipped_quantity;
    }
    $scope.saveReport = function() {

            var remaining = $scope.totalShipped - $scope.quantityAccepted;
            var messageValid = 'Input Accepted Quantity must be less than equal remaining: ' + remaining;
            if ($scope.technicalDrawin == undefined) {
                Notification.error({ message: 'Check Technical Drawin, Please!</br>', delay: 5000 });
                return;
            }
            if ($scope.sealedSample == undefined) {
                Notification.error({ message: 'Check Sealed Sample, Please!</br>', delay: 5000 });
                return;
            }
            if ($scope.inspection_no == '') {
                Notification.error({ message: 'Please input Inspection No.', delay: 2000 });
                return;
            }
            if (!validValues($scope.quantity_accepted)) {
                Notification.error({ message: 'Field Accepted Quantity must be number </br>', delay: 5000 });
                return;
            }

            if ($scope.quantity_accepted > remaining ) {
                Notification.error({ message: messageValid, delay: 5000 });
                return;
            }

            for(var v in $scope.todoList){
                if ($scope.todoList[v].value == 'undefined') {
                    Notification.error({ message: 'Please input to do list', delay: 2000 });
                    return;
                }
            }

            $scope.listMistakeID = [];

            //update inspector schedule
            var dataSchedule = { id: $scope.inspectionReport.id, inspector1: $scope.inspector1, inspector2: $scope.inspector2, plan_date: $scope.plan_date, updateby: $rootScope.username };
            // $http.put(ENV.domain + 'inspection.editSchedule', dataSchedule).then(function(data) {});

            var inspection = {
                "inspectionid": $scope.inspectionid,
                "abid": $scope.inspectionReport.abid,
                "inspection_no": $scope.inspection_no,
                "inspection_date": $scope.inspection_date,
                "set_item_lot_size": $scope.inspectionReport.shipped_quantity,
                "item_lot_size": $scope.inspectionReport.item_lost_size,
                "inspected_quantity": $scope.inspectedQty,
                "quantity_accepted": $scope.quantity_accepted,
                "qty": parseInt($scope.quantity_accepted),
                "inspected_ql": $scope.inspectionReport.quality_level,
                "product_item_no": $scope.inspectionReport.product_item_no,
                "inspected_product_item_no": $scope.inspectionReport.product_item_no,
                "inspector1": $scope.inspector1,
                "inspector2": $scope.inspector2,
                "last_change_person": $rootScope.userId,
                "updateby": $rootScope.username,
                "sealfrom1": $scope.sealFrom1,
                "sealfrom2": $scope.sealFrom2,
                "sealto1": $scope.sealTo1,
                "sealto2": $scope.sealTo2,
                "td_materials": "no",
                "missing_td": $scope.technicalDrawin ==1 ? 1: $scope.missing_reason_td,
                "ss_materials": "no",
                "missing_ss": $scope.sealedSample ==1 ? 1: $scope.missing_reason_ss,
                "carton_info": $scope.carton_info,
                "result": $scope.inspection_result,
                "comment": $scope.comment,
                "is_general_report": $scope.reportforchild,
                "mistake": $scope.listMistakeItem,
                "result_type": $scope.result_type,
                "todo_list": $scope.todoList,
                "dataSchedule" : dataSchedule,
                // "image": $scope.listImageid,
                'images':$scope.offlineImages
            };

            // if ($scope.inspectionid != '') {
            //     //edit inspection report
            //     $timeout(function() {

            //         $http.put(ENV.domain + 'inspection.execute', inspection).then(function(d) {
            //             if (d.data['success']) {
            //                 $scope.listImageid = [];
            //                 Notification.success({ message: d.data['message'] || 'Updated Inspection report success', delay: 2000 });
            //             } else {
            //                 Notification.error({ message: d.data['message'] || 'Update Inspection report failed', delay: 2000 });
            //             }
            //         });

            //     }, 300);

            // } else {
            //     $timeout(function() {
            //         $http.post(ENV.domain + 'inspection.execute', inspection).then(function(d) {
            //             if (d.data['success']) {
            //                 $scope.inspectionid = d.data['id'];
            //                 $scope.listImageid = [];
            //                 Notification.success({ message: d.data['message'] || 'inspection report saved success', delay: 2000 });
            //             } else {
            //                 Notification.error({ message: d.data['message'] || 'Inspection report failed', delay: 2000 });
            //             }
            //         });

            //     }, 1000);
            // }
            // save report for offline ver
            if($scope.inspectionid == "" ){
                window.IR[inspection.abid].count += 1 ;
                $scope.inspectionid = "Temp-"+window.IR[inspection.abid].count;
                inspection["inspectionid"] = $scope.inspectionid ;
            }
            window.IR[inspection.abid].list[inspection["inspectionid"]] = inspection ;
            localStorage.setItem("IR", JSON.stringify(window.IR));
            Notification.success({message: 'Inspection report saved success in localStorage', delay: 2000 }); 
            $state.go('home.inspection.report',{
                pid:$scope.inspectionReport.product_item_no,
                abid:$scope.inspectionReport.abid,
                quantity:$scope.quantity_accepted,
                insid:$scope.inspectionid
            });

    }
    // upload document;
    $scope.listImageid = [];
    $scope.iFiles = [];
    $scope.listImageFn = [];
    $scope.listDocument = [];
    $scope.icheckData = 0;

    $scope.listFileImages = function() {
        $scope.iFiles = [];
        angular.forEach($scope.listImageid, function(value) {
            $scope.iFiles.push(value);
            $scope.icheckData = $scope.iFiles.length;
        });
        $scope.icheckData = $scope.iFiles.length;
    }
    $scope.removeImage = function(index){
        $scope.offlineImages.splice(index, 1);
    }
    // $scope.removeImage = function(index, id) {
    //     $http.delete(ENV.domain + 'image.execute/?image_id=' + id).then(function(response) {
    //         if (response.data['success']) {
    //             $scope.iFiles.splice(index, 1);
    //             $scope.listImageFn.splice(index, 1);
    //             $scope.listImageid.splice(index, 1);
    //             Notification.success({ message: response.data['message'] || 'Delete file success', delay: 2000 });
    //         } else {
    //             Notification.error({ message: response.data['message'] || 'Delete file failed', delay: 2000 });
    //         }
    //     });
    // }
    $scope.addFileImages = function(){
        $scope.offlineImages.pushArray($scope.fileImage);
        $scope.fileImage = [];
        $("ul.upload_listing").html("");
        // delete $scope.fileImage;
    }
    // $scope.uploadFileImages = function() {


    //         if (!$scope.fileImage) {
    //             Notification.error({ message: 'Please select file to upload first', delay: 2000 });
    //             return;
    //         }
    //         if ($scope.fileImage.length > 10) {
    //             Notification.error({ message: 'Total file upload must be less than equal 10', delay: 2000 });
    //             return;
    //         } else {
                
    //             for (var i = 0; i < $scope.fileImage.length; i++) {
    //                 if($scope.inspectionid !=''){
    //                     $scope.fileImage[i].inspectionid = $scope.inspectionid;
    //                     $scope.fileImage[i].totalFile = $scope.iImages;
    //                 }
    //                 $scope.fileImage[i].updateby = $rootScope.username;
    //             }
    //             var req = {
    //                 method: 'POST',
    //                 url: ENV.domain + 'image.uploadImages',
    //                 headers: {
    //                     'Content-Type': undefined
    //                 },
    //                 data: $scope.fileImage
    //             }

    //             $http(req).then(function(d) {
    //                 if (d.data['success']) {
    //                     $scope.listImageid = $scope.listImageid.concat(d.data.imageId);
    //                     $scope.listDocument = $scope.listDocument.concat($scope.listImageid);
    //                     $scope.listImageFn = $scope.listImageFn.concat(d.data.filename);
    //                     Notification.success({ message: 'Upload Image success', delay: 2000 });
    //                     delete $scope.fileImage;
    //                 } else {
    //                     Notification.error({ message: d.data['message'] || 'Please select file to upload first', delay: 5000 });
    //                 }

    //             })
    //             $("ul.upload_listing").html("");
    //         }
    //     }
        // End upload document inspection

    //create pdf
    $scope.viewPDF = function() {
        var pathfile = ENV.domain.replace('index.cfm/', '') + 'fileUpload/inspectionReport/' + $scope.inspection_no + '.pdf';
        $window.open(pathfile);
    }

    $timeout(function() {
        $("#inspection_date").datepicker({ dateFormat: "dd-M-yy" }).val();
        $(".datepicker").datepicker("option", "prevText", "<");
        $(".datepicker").datepicker("option", "nextText", ">");
        $(".datepicker").datepicker("option", "firstDay", 1);
        pageSetUp();
    }, 100)
}]);
