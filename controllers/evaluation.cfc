component accessors=true {

	property framework;
    property purchase_orderService;
    property companyService;
    property inspection_reportService;

    void function before(){
        var obj = createObject("component","api/general");
        if(StructKeyExists(GetHttpRequestData().headers, "Authorization") ){
            var timeOut = obj.checkTimeOut(GetHttpRequestData().headers.Authorization);
             if(!timeOut.success){
                VARIABLES.framework.redirect('scheduled.checkTimeOut');
            }
        }else{
             VARIABLES.framework.redirect('scheduled.checkTimeOut');
        }  
    }
    
    function getProductLineBySegment() {
        var paramset={};
        var obj = createObject("component","api/general");
        var sql = "select product_line_no, product_line_name_english from product_line where 1 = 1 ";
        if(StructKeyExists(URL, 'id')){
            sql &= " and product_segment_id = :product_segment_id";
            paramset['product_segment_id'] = {value=URL.id, CFSQLType="integer"};
        }
        sql &= " order by product_line_name_english, product_line_name_german";
        VARIABLES.framework.renderData('JSON', obj.queryToArray(queryExecute(sql, paramset)));
    }
    
    function getPerSupplierOrder(struct data) {
        var obj = createObject("component","api/general");
        var result = companyService.getEvaluationSupplier(data); 
        VARIABLES.framework.renderData('JSON', obj.queryToArray(result));
    }

    function getSupplierBility(struct data) {
        var obj = createObject("component","api/general");
        var result = companyService.getBilitySupplier(data); 
        VARIABLES.framework.renderData('JSON', obj.queryToArray(result));
    }

    function getOrderData(struct data) {
        var obj = createObject("component","api/general");
        var result = purchase_orderService.getEvaluationOrder(data); 
        var result = obj.queryToArray(result);
        var totalResult = queryExecute("SELECT FOUND_ROWS() as count");
        var namResult = {
            "draw": data.draw,
            "recordsTotal": totalResult.count,
            "recordsFiltered": totalResult.count,
            "data": result
        }
        VARIABLES.framework.renderData('JSON', namResult);
    }

    function excel() {
        var data = deserializeJSON(GetHttpRequestData().content);
        var excel =[];
        if(data.excel eq "orderDetail"){
            excel = purchase_orderService.getEvaluationOrder(data);
        }
        if(data.excel eq "EvaluationReport"){
            var excel = inspection_reportService.getEvaluations(data);
            var i=1;
            for(item in excel){
                var mis = inspection_reportService.inspectionReportMistakeByReport(item.inspectionid);
                if(!isEmpty(mis)){
                    QuerySetCell(excel, "total_critical_detect", mis.total_critical_detect, i);
                    QuerySetCell(excel, "total_major_detect", mis.total_major_detect, i);
                    QuerySetCell(excel, "total_minor_detect", mis.total_minor_detect, i);
                    QuerySetCell(excel, "total_mistake", mis.total_mistake, i);
                    QuerySetCell(excel, "mistake_code", mis.mistake_code, i);
                }else{
                    QuerySetCell(excel, "total_critical_detect", 0, i);
                    QuerySetCell(excel, "total_major_detect", 0, i);
                    QuerySetCell(excel, "total_minor_detect", 0, i);
                    QuerySetCell(excel, "total_mistake", 0, i);
                    QuerySetCell(excel, "mistake_code", "", i);
                }  
                i++; 
            }
        }
        if(data.excel eq "DetailReport"){
            var excel = inspection_reportService.getEvaluations(data);
            var i=1;
            for(item in excel){
                var mis = inspection_reportService.inspectionReportMistakeByReport(item.inspectionid);
                if(!isEmpty(mis)){
                    QuerySetCell(excel, "total_critical_detect", mis.total_critical_detect, i);
                    QuerySetCell(excel, "total_major_detect", mis.total_major_detect, i);
                    QuerySetCell(excel, "total_minor_detect", mis.total_minor_detect, i);
                    QuerySetCell(excel, "total_mistake", mis.total_mistake, i);
                    QuerySetCell(excel, "mistake_code", mis.mistake_code, i);
                }else{
                    QuerySetCell(excel, "total_critical_detect", 0, i);
                    QuerySetCell(excel, "total_major_detect", 0, i);
                    QuerySetCell(excel, "total_minor_detect", 0, i);
                    QuerySetCell(excel, "total_mistake", 0, i);
                    QuerySetCell(excel, "mistake_code", "", i);
                }  
                i++; 
            }
        }
        
        var spreadsheet = New spreadsheetLibrary.spreadsheet();
        //var filename = DateTimeFormat(now(), 'yyyy-mm-dd_HHnnss')&"_#data.excel#.xls";
        var path = ExpandPath("templates/#data.excel#.xlsx");
        spreadsheet.writefilefromquery(excel, path, true);
        //header name="Content-Disposition" value="attachment; filename=#filename#";
        //content type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" file="#path#";
        var fileName = CGI.http_referer&'/templates/#data.excel#.xlsx';
        VARIABLES.framework.renderData('JSON', fileName);
    }

    function getEvaluationReport(struct data) {
        var obj = createObject("component","api/general");
        var result = inspection_reportService.getEvaluations(data);
        var result = obj.queryToArray(result);
        var totalResult = queryExecute("SELECT FOUND_ROWS() as count");
        for(item in result){
            var mis = inspection_reportService.inspectionReportMistakeByReport(item.inspectionid);
            if(!isEmpty(mis)){
                item.total_critical_detect = mis.total_critical_detect;
                item.total_major_detect = mis.total_major_detect;
                item.total_minor_detect = mis.total_minor_detect;
                item.total_mistake = mis.total_mistake;
                item.mistake_code = mis.mistake_code;
            }else{
                item.total_critical_detect = 0;
                item.total_major_detect = 0;
                item.total_minor_detect = 0;
                item.total_mistake = 0;
                item.mistake_code = "";
            }
            
        }
        var namResult = {
            "draw": data.draw,
            "recordsTotal": totalResult.count,
            "recordsFiltered": totalResult.count,
            "data": result
        }
        VARIABLES.framework.renderData('JSON', namResult);
    }

    function getDetailReport(struct data) {
        var obj = createObject("component","api/general");
        var result = inspection_reportService.getEvaluations(data); 
        var results = obj.queryToArray(result);
        var totalResult = queryExecute("SELECT FOUND_ROWS() as count");
        for(item in results){
            var mis = inspection_reportService.inspectionReportMistakeByReport(item.inspectionid);
            if(!isEmpty(mis)){
                item.total_critical_detect = mis.total_critical_detect;
                item.total_major_detect = mis.total_major_detect;
                item.total_minor_detect = mis.total_minor_detect;
                item.total_mistake = mis.total_mistake;
                item.mistake_code = mis.mistake_code;
            }else{
                item.total_critical_detect = 0;
                item.total_major_detect = 0;
                item.total_minor_detect = 0;
                item.total_mistake = 0;
                item.mistake_code = "";
            }
        }
        var namResult = {
            "draw": data.draw,
            "recordsTotal": totalResult.count,
            "recordsFiltered": totalResult.count,
            "data": results
        }
        VARIABLES.framework.renderData('JSON', namResult);
    }

    function getEvaluationChart(struct data) {
        
    }

    function order() {
        var info = deserializeJSON(GetHttpRequestData().content);
        switch(info.key) { 
            case "perSupplier": 
                    getPerSupplierOrder(info);
                    break; 
            case "supplierBility": 
                    getSupplierBility(info); 
                    break; 
            case "orderData":
                    getOrderData(info);
                    break;     
        } 
    }

    function inspection() {
        var info = deserializeJSON(GetHttpRequestData().content);
        switch(info.key) { 
            case "evaluationReport": 
                    getEvaluationReport(info);
                    break; 
            case "detailReport": 
                    getDetailReport(info); 
                    break; 
            case "evaluationChart":
                    getEvaluationChart(info);
                    break;     
        } 
    }
}