/* @author : duy */

component accessors=true {

	property framework;

    property purchase_orderService;
	property order_documentService;
    property product_item_qlService;
    property product_itemService;
    property companyService;
    property import_historyService;
    property currencyService;
    property contactService;
    property import_sap_historyService;

    void function before(){
        var act = listToArray(CGI.path_info, ".");
        if(act[2] != "importOrderSAP" || act[2] != "excel"){
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
    }

    public function init(required any fw){
        
        variables.fw = arguments.fw;
        return this;
    }

    function oSearch() {
        var obj = createObject("component","api/general");
        var startDate = "";
        var endDate = "";
        var supplier = 0;
        var customer = 0;
        var finish = 1;
        var startItem = URL.start;
        var lengthItem = URL.length;
        var columns = DeserializeJSON("["&URL.columns&"]");
        var order = DeserializeJSON(URL.order);
        if(StructKeyExists(URL, 'startdate')){
            startDate = DateFormat( URL.startdate, 'yyyy-mm-dd' );
        }
        if(StructKeyExists(URL, 'end')){
            endDate = DateFormat( URL.end, 'yyyy-mm-dd' );
        }
        if(StructKeyExists(URL, 'cusid')){
            customer = URL.cusid;
        }
        if(StructKeyExists(URL, 'supid')){
            supplier = URL.supid;
        }
        if(StructKeyExists(URL, 'finish')){
            finish = URL.finish;
        }
        
        var purchase_orders = VARIABLES.purchase_orderService.getOrderSearch(startDate, endDate, finish,startItem,lengthItem,columns, order, customer, supplier, 0);
        var totalResult = queryExecute("SELECT FOUND_ROWS() as count");
        var result = obj.queryToArray(purchase_orders);
        var namResult = {
            "draw": URL.draw,
            "recordsTotal": totalResult.count,
            "recordsFiltered": totalResult.count,
            "data": result
        }
        VARIABLES.framework.renderData('JSON', namResult);
    }

    function excel() {
        var obj = createObject("component","api/general");
        var startDate = "";
        var endDate = "";
        var supplier = 0;
        var customer = 0;
        var finish = 1;
        var startItem = URL.start;
        var lengthItem = URL.length;
        var columns = DeserializeJSON("["&URL.columns&"]");
        var order = DeserializeJSON(URL.order);
        if(StructKeyExists(URL, 'startdate')){
            startDate = DateFormat( URL.startdate, 'yyyy-mm-dd' );
        }
        if(StructKeyExists(URL, 'end')){
            endDate = DateFormat( URL.end, 'yyyy-mm-dd' );
        }
        if(StructKeyExists(URL, 'cusid')){
            customer = URL.cusid;
        }
        if(StructKeyExists(URL, 'supid')){
            supplier = URL.supid;
        }
        if(StructKeyExists(URL, 'finish')){
            finish = URL.finish;
        }
        
        var data = purchase_orderService.getOrderSearch(startDate, endDate, finish,startItem,lengthItem,columns, order, customer, supplier, 1);
        var spreadsheet = New spreadsheetLibrary.spreadsheet();
        var path = ExpandPath("templates/order.xlsx");
        spreadsheet.writefilefromquery(data, path, true);
        //header name="Content-Disposition" value="attachment; filename=#filename#";
        //content type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" file="#path#";
        var fileName = CGI.http_referer&'/templates/order.xlsx';
        VARIABLES.framework.renderData('JSON', fileName);
    }
    
    function addOrderPosition(required string data,required numeric typeReturn) {
        var obj = createObject("component","api/general");
            var info = deserializeJSON(data);
            var update_date = now();
            var abIdArr=[];
            var flag = true;
            var message ="";
            var success = true;
            var new_position = entityNew('order_position');
            new_position.setProduct_item_no(info.product_item_no);
            new_position.setPosition_no(info.position_no);
            new_position.setOrdered_quantity(lsParseNumber(info.ordered_quantity));
            new_position.setInspected_quantity(0);
            new_position.setExported_quantity(0);
            new_position.setUnit_price(info.unit_price);
            new_position.setTotal_price(info.total_price);
            new_position.setLastupdate(update_date);
            var qlExist = product_item_qlService.getQlByItemno(info.product_item_no);
            var ql ="";
            if(!isEmpty(qlExist)){
                new_position.setQl(qlExist.ql);
                ql= qlExist.ql;
            }else{
                pql = product_itemService.getQl(info.product_item_no);
                new_position.setQl(pql.ql);
                ql= pql.ql;
            }
            if(structKeyExists(info, "orderid"))
            {
                var positionNo = purchase_orderService.checkPositionNo(info.orderid, info.position_no);
                if(positionNo.recordCount > 0){
                    flag = false;
                    message = "position no is exists";
                    success = false;
                }
                new_position.setOrderid(info.orderid);
                new_position.setTmp(0);
                var purchase_order  = entityLoad("purchase_order", info.orderid, true);
                var exchange_rate = getcurrencyByCodeYear(purchase_order.getCurrency(), purchase_order.getOrder_date()).exchange_rate;
                new_position.setTotal_price_usd(info.total_price * exchange_rate);
            }
            if(flag){
                entitySave(new_position);
                var aqArr = [];
                var qls=obj.queryToArray(product_item_qlService.getQl(info.product_item_no));
                for(q in qls){
                    arrayAppend(aqArr, q.ql);
                }
            
                for (item in info.ab) { 
                    var structId ={};
                    var new_ab = entityNew('ab');
                    new_ab.setPositionid(new_position.getPositionid());
                    new_ab.setAbno(lsParseNumber(item.abno));
                    new_ab.setShipped_quantity(lsParseNumber(item.shipped_quantity));
                    new_ab.setShipment_method(item.shipment_method);
                    new_ab.setExpected_shipping_date(DateFormat(item.expected_shipping_date, "yyyy-mm-dd"));
                    new_ab.setConfirmed_shipping_date(DateFormat(item.confirmed_shipping_date, "yyyy-mm-dd"));
                    new_ab.setLastupdate(update_date);
                    new_ab.setshipping_date(DateFormat(item.shipping_date, "yyyy-mm-dd"));
                    new_ab.setZA_date(DateFormat(item.za_date, "yyyy-mm-dd"));
                    new_ab.setETA_date(DateFormat(item.eta_date, "yyyy-mm-dd"));
                    new_ab.setRelevant_due_date(DateFormat(item.relevant_due_date, "yyyy-mm-dd"));
                    new_ab.setWarehouse_book_date(DateFormat(item.warehouse_book_date, "yyyy-mm-dd"));
                    if(structKeyExists(item, "hashkey")){
                        new_ab.setHashkey(item.hashkey);
                    }
                    entitySave(new_ab);
                    structId.abid=new_ab.getAbid();
                    var new_schedule = entityNew('inspection_schedule');
                    new_schedule.setAbid(new_ab.getAbid());
                    new_schedule.setPlan_date(dateAdd('d',-7,item.confirmed_shipping_date));
                    new_schedule.setLastupdate(update_date);
                    entitySave(new_schedule);
                    structId.id=new_schedule.getId();
                    arrayAppend(abIdArr, structId);
                }
                
                message = "Insert data success";
                if(typeReturn == 1 ){
                     VARIABLES.framework.renderData('JSON', {'success': success, 
                                                        'message': message, 
                                                        'positionid':new_position.getPositionid(),
                                                        'ab':abIdArr,
                                                        'qls': aqArr,
                                                        'ql': ql
                                                        }); 
            }else{
                return true;
            }
            }else{
                if (typeReturn == 1)
                    VARIABLES.framework.renderData('JSON', {'success': success, 'message': message}); 
                else
                    return false;
            }
            
    }  
    
  
    function editOrderPosition(string data, numeric returnType, numeric isDelete) {
            var info = deserializeJSON(data);
            var update_date = now();
            var abIdArr=[];
            var success = false;
            var message = "Update data fail";
            entity_position = entityLoad( "order_position", info.positionid, true );
            entity_position.setProduct_item_no(info.product_item_no);
            entity_position.setPosition_no(info.position_no);
            entity_position.setOrdered_quantity(lsParseNumber(info.ordered_quantity));
            entity_position.setInspected_quantity(0);
            entity_position.setExported_quantity(0);
            entity_position.setUnit_price(info.unit_price);
            entity_position.setTotal_price(info.total_price);
            entity_position.setLastupdate(update_date);
            if(structKeyExists(info, "ql")){
                entity_position.setQl(info.ql);
            }
            if(!isnull(entity_position.getOrderid())){
                var purchase_order  = entityLoad("purchase_order", entity_position.getOrderid(), true);
                var exchange_rate = getcurrencyByCodeYear(purchase_order.getCurrency(), purchase_order.getOrder_date()).exchange_rate;
                entity_position.setTotal_price_usd(info.total_price * exchange_rate);
            }
            
            for (ab_item in info.ab) {
                var structId ={};
                if(structKeyExists(ab_item, "abid"))
                {
                    entity_ab = entityLoad( "ab", ab_item.abid, true );
                    if(isDelete eq 1){
                        entityDelete(entity_ab);
                    }else{
                        entity_ab.setPositionid(info.positionid);
                        entity_ab.setAbno(lsParseNumber(ab_item.abno));
                        entity_ab.setShipped_quantity(lsParseNumber(ab_item.shipped_quantity));
                        entity_ab.setShipment_method(ab_item.shipment_method);
                        entity_ab.setExpected_shipping_date(DateFormat(ab_item.expected_shipping_date, "yyyy-mm-dd"));
                        entity_ab.setConfirmed_shipping_date(DateFormat(ab_item.confirmed_shipping_date, "yyyy-mm-dd"));
                        entity_ab.setLastupdate(update_date);
                        entity_ab.setshipping_date(DateFormat(ab_item.shipping_date, "yyyy-mm-dd"));
                        entity_ab.setZA_date(DateFormat(ab_item.za_date, "yyyy-mm-dd"));
                        entity_ab.setETA_date(DateFormat(ab_item.eta_date, "yyyy-mm-dd"));
                        entity_ab.setETD_date(DateFormat(ab_item.etd_date, "yyyy-mm-dd"));
                        entity_ab.setRelevant_due_date(DateFormat(ab_item.relevant_due_date, "yyyy-mm-dd"));
                        entity_ab.setWarehouse_book_date(DateFormat(ab_item.warehouse_book_date, "yyyy-mm-dd"));
                        if(structKeyExists(ab_item, "hashkey")){
                            entity_ab.setHashkey(ab_item.hashkey);
                        }
                        entity_schedule = entityLoad( "inspection_schedule", ab_item.id, true );
                        entity_schedule.setAbId(ab_item.abid);
                        entity_schedule.setPlan_date(dateAdd('d',-7,ab_item.confirmed_shipping_date));
                        entity_schedule.setLastupdate(update_date);
                        structId.abid=ab_item.abid;
                        structId.id=ab_item.id;
                        structId.abno=ab_item.abno;
                    } 
                }else{
                    var new_ab = entityNew('ab');
                    new_ab.setPositionid(info.positionid);
                    new_ab.setAbno(lsParseNumber(ab_item.abno));
                    new_ab.setShipped_quantity(lsParseNumber(ab_item.shipped_quantity));
                    new_ab.setShipment_method(ab_item.shipment_method);
                    new_ab.setExpected_shipping_date(DateFormat(ab_item.expected_shipping_date, "yyyy-mm-dd"));
                    new_ab.setConfirmed_shipping_date(DateFormat(ab_item.confirmed_shipping_date, "yyyy-mm-dd"));
                    new_ab.setLastupdate(update_date);
                    new_ab.setshipping_date(DateFormat(ab_item.shipping_date, "yyyy-mm-dd"));
                    new_ab.setZA_date(DateFormat(ab_item.za_date, "yyyy-mm-dd"));
                    new_ab.setETA_date(DateFormat(ab_item.eta_date, "yyyy-mm-dd"));
                    new_ab.setETD_date(DateFormat(ab_item.etd_date, "yyyy-mm-dd"));
                    new_ab.setRelevant_due_date(DateFormat(ab_item.relevant_due_date, "yyyy-mm-dd"));
                    new_ab.setWarehouse_book_date(DateFormat(ab_item.warehouse_book_date, "yyyy-mm-dd"));
                    if(structKeyExists(ab_item, "hashkey")){
                        new_ab.setHashkey(ab_item.hashkey);
                    }
                    entitySave(new_ab);
                    structId.abid=new_ab.getAbid();
                    structId.abno=ab_item.abno;
                    var new_schedule = entityNew('inspection_schedule');
                    new_schedule.setAbid(new_ab.getAbid());
                    new_schedule.setPlan_date(dateAdd('d',-7,ab_item.confirmed_shipping_date));
                    new_schedule.setLastupdate(update_date);
                    entitySave(new_schedule);
                    structId.id=new_schedule.getId();
                }
                arrayAppend(abIdArr, structId);
            }
            success = true;
            message = "Update data success";
            if(returnType eq 1){
                VARIABLES.framework.renderData('JSON', {'success': success, 'message': message, 'ab':abIdArr});
            }else{
                return success;
            }
            
    }

    function deleteOrderPosition(numeric positionid) {
        if(cgi.request_method == "delete"){
            var success = false;
            var message = "Can't delete because exist in inspection report";
            var idChild = purchase_orderService.getPositionDelete(positionid, 0);
            if(idChild.tmp eq 1){
                for(item in idChild){
                    entity_ab = entityLoad( "ab", item.abid, true );
                    entityDelete( entity_ab );
                    entity_inspection_schedule = entityLoad( "inspection_schedule", item.id, true );
                    entityDelete( entity_inspection_schedule );
                }
                entity_position = entityLoad( "order_position", positionid, true );
                entityDelete( entity_position );
                success = true;
                message = "Delete data success";
            }
            VARIABLES.framework.renderData('JSON', {'success': success, 
                                                        'message': message});
        }  
    }

    function getOrderPositionById(numeric positionid) {
        var obj = createObject("component","api/general");
        var result = obj.queryToArray(purchase_orderService.getPosition(positionid, 0));
        VARIABLES.framework.renderData('JSON', result);
    }

    function getOrderPositionList(any positionid) { 
        var obj = createObject("component","api/general");
        var result = obj.queryToArray(purchase_orderService.getPositionList(positionid));
        VARIABLES.framework.renderData('JSON', result);
    }

    function orderExist(required string order_no) {
        var success = false;
        var message = "The order number isn't existed";
        var orderid = 0;
        var check = purchase_orderService.getOrderByOrderno(order_no);
        if (check.recordCount > 0){
            success = true;
            message="The order number is existed already!";
            orderid = check.orderid;
        }
        return {'success': success, 'message': message, 'orderid': orderid};
    }

    function checkOrderNo() {
        var success = true;
        var message = "Order no  is valid";
        var check = purchase_orderService.getOrderByOrderno(URL.order_no);
        if (check.recordCount > 0){
            success = false;
            message="The order number is existed already";
        }
        VARIABLES.framework.renderData('JSON', {'success': success, 'message': message});
    }
    
    function saveOrder(string data) {
        var success = false;
        var message = "";
        var info = deserializeJSON(data); 
        var check = purchase_orderService.getOrder(0,info.order_no);
        var orderid = 0;
        if (check.recordCount > 0){
            message="The order number is existed already!";
            orderid = check.orderid;
        } else {
            var flag = true;
            var supplier = 0;
            var customer = 0;
            if(!structKeyExists(info, "supplier_id") && !structKeyExists(info, "supplier_no"))
            {
                flag = false;
                message="Supplier isn't empty";
            }else{
                if(structKeyExists(info, "supplier_id")){
                    supplier = info.supplier_id;
                }else{
                    sups = companyService.getCompanyByCompanyNo(info.supplier_no, 2, 0);
                    if(!isEmpty(sups)){
                        supplier = sups.companyid;
                    }else{
                        flag = false;
                        var message = "Supplier isn't exist";
                    } 
                }
            }
            if(!structKeyExists(info, "customer_id") && !structKeyExists(info, "customer_no"))
            {
                flag = false;
                message="Customer isn't empty";
            }else{
                if(structKeyExists(info, "customer_id")){
                    customer = info.customer_id;
                }else{
                    cus = companyService.getCompanyByCompanyNo(info.customer_no, 3, 0);
                    if(!isEmpty(cus)){
                        customer = cus.companyid;
                    }else{
                        flag = false;
                        var message = "Customer isn't exist";
                    }   
                }
            }
            if(flag){
                var update_date = now();
                var new_order = entityNew('purchase_order');
                new_order.setOrder_no(info.order_no);
                new_order.setOrder_date(info.order_date);
                new_order.setSupplier_companyid(supplier);
                new_order.setBuyer_companyid(customer);
                new_order.setInspector_companyid(customer);
                new_order.setLastupdate(update_date);
                new_order.setCurrency(info.currency);
                entitySave(new_order);
                orderid = new_order.getOrderid();
                var exchange_rate = getcurrencyByCodeYear(info.currency, info.order_date).exchange_rate;
                for(item in info.position){
                    entity_position = entityLoad( "order_position", item, true );
                    entity_position.setOrderid(new_order.getOrderid());
                    entity_position.setTotal_price_usd(entity_position.getTotal_price() * exchange_rate);
                    entity_position.setTmp(0);
                }
                if(structKeyExists(info, "document"))
                {
                    for(id_document in info.document){
                        order_documentService.editorder_Document(id_document, new_order.getOrderid());
                    }
                }
                success = true;
                message="Insert data success.";
            }
        }
        VARIABLES.framework.renderData('JSON', {'success': success, 'message': message, 'orderid': orderid});
    }

     function saveImportOrder(string data) {
        var success = false;
        var info = deserializeJSON(data); 
        var check = purchase_orderService.getOrder(0,info.order_no);
        var orderid = 0;
        var order_date = "";
        var currency = "";
        var message="";
        if (check.recordCount > 0){
            orderid = check.orderid;
            order_date = check.order_date;
            currency = check.currency;
        } else {
            var flag = true;
            var supplier = 0;
            var customer = 0;
            if(!structKeyExists(info, "supplier_id") && !structKeyExists(info, "supplier_no"))
            {
                flag = false;
            }else{
                if(structKeyExists(info, "supplier_id")){
                    supplier = info.supplier_id;
                }else{
                    sups = companyService.getCompanyByCompanyNo(info.supplier_no, 2,0);
                    if(!isEmpty(sups)){
                        supplier = sups.companyid;
                    }else{
                        flag = false;
                        message &= "Supplier isn't exist,";
                    } 
                }
            }
            if(!structKeyExists(info, "customer_id") && !structKeyExists(info, "customer_no"))
            {
                flag = false;
            }else{
                if(structKeyExists(info, "customer_id")){
                    customer = info.customer_id;
                }else{
                    cus = companyService.getCompanyByCompanyNo(info.customer_no, 3,0);
                    if(!isEmpty(cus)){
                        customer = cus.companyid;
                    }else{
                        flag = false;
                         message &= "Customer isn't exist";
                    }   
                }
            }
            if(flag){
                var update_date = now();
                var new_order = entityNew('purchase_order');
                new_order.setOrder_no(info.order_no);
                new_order.setOrder_date(info.order_date);
                new_order.setSupplier_companyid(supplier);
                new_order.setBuyer_companyid(customer);
                new_order.setInspector_companyid(customer);
                new_order.setLastupdate(update_date);
                new_order.setCurrency(info.currency);
                if(structKeyExists(info, "is_sap")){
                    new_order.setIs_sap(info.is_sap);
                }
                entitySave(new_order);
                orderid = new_order.getOrderid();
                order_date = new_order.getOrder_date();
                currency = new_order.getcurrency();
                var exchange_rate = getcurrencyByCodeYear(info.currency, info.order_date).exchange_rate;
                for(item in info.position){
                    entity_position = entityLoad( "order_position", item, true );
                    entity_position.setOrderid(new_order.getOrderid());
                    entity_position.setTotal_price_usd(entity_position.getTotal_price() * exchange_rate);
                    entity_position.setTmp(0);
                }
                if(structKeyExists(info, "document"))
                {
                    for(id_document in info.document){
                        order_documentService.editorder_Document(id_document, new_order.getOrderid());
                    }
                }
                success = true;
            }
        }
        return {'success': success,'orderid': orderid,'message':message, 'order_date':order_date , 'currency': currency };
    }

    function editOrder(string data) {
        var success = false;
        var message = "";
        var info = deserializeJSON(data); 
        if (VARIABLES.purchase_orderService.checkOrderNoEdit(info.orderid ,info.order_no).recordCount > 0){
            message="The order number is existed already!";
        } else {
            var update_date = now();
            entity_order = entityLoad( "purchase_order", info.orderid, true );
            entity_order.setOrder_no(info.order_no);
            entity_order.setOrder_date(info.order_date);
            entity_order.setSupplier_companyid(info.supplier_id);
            entity_order.setBuyer_companyid(info.customer_id);
            entity_order.setInspector_companyid(info.customer_id);
            entity_order.setLastupdate(update_date);
            entity_order.setCurrency(info.currency);
            var exchange_rate = getcurrencyByCodeYear(info.currency, info.order_date).exchange_rate;
            if(structKeyExists(info, "position"))
            {
                for(item in info.position){
                    entity_position = entityLoad( "order_position", item, true );
                    entity_position.setOrderid(info.orderid);
                    entity_position.setTotal_price_usd(entity_position.getTotal_price() * exchange_rate);
                    entity_position.setTmp(0);
                }
            }
            if(ArrayLen(info.document) > 0)
            {
                for(id_document in info.document){
                    order_documentService.editorder_Document(id_document, info.orderid);
                }
            }
            success = true;
            message="Update data success.";
        }
        VARIABLES.framework.renderData('JSON', {'success': success, 'message': message});
    }

    function addImportHistory() {
        var user = deserializeJSON(GetHttpRequestData().content).user; 
        var new_importHistory = entityNew('import_history');
            new_importHistory.setCreateTime(now());
            new_importHistory.setUserId(user);
            entitySave(new_importHistory);
        return  new_importHistory.getImport_id();
    }

    function editImportHistory(numeric importid, numeric countR, numeric countF) {
        var importHistory = entityLoad( "import_history", importid, true );
        importHistory.setSuccess(countR);
        importHistory.setFail(countF);
    }

    function getImportHistoryByUser() {
        var obj = createObject("component","api/general");
        VARIABLES.framework.renderData('JSON', obj.queryToArray(import_historyService.getImportHistory(URL.userid)));
    }

    function getImportHistoryDetailById() {
        var obj = createObject("component","api/general");
        VARIABLES.framework.renderData('JSON', obj.queryToArray(import_historyService.getImportHistoryDetail(URL.importid)));
    }
    
    function addImportHistoryDetail(struct order, numeric import_id, boolean status, string message) {
        var new_importHistoryDetail = entityNew('import_history_detail');
            new_importHistoryDetail.setOrder_no(order['Order Nr.'].trim());
            new_importHistoryDetail.setOrder_date(order['Order Date'].trim());
            new_importHistoryDetail.setCustomer_no(order['Customer Nr.'].trim());
            new_importHistoryDetail.setSupplier_no(order['Supplier Nr.'].trim());
            new_importHistoryDetail.setPosition_no(order['Position Nr.'].trim());
            new_importHistoryDetail.setProductitem_no(order['Product Item'].trim());
            new_importHistoryDetail.setQuantity(order['Quantity'].trim());
            new_importHistoryDetail.setUnitprice(order['Unit Price'].trim());
            new_importHistoryDetail.setCurrency(order['Currency'].trim());
            new_importHistoryDetail.setTransport(order['Transport by'].trim());
            new_importHistoryDetail.setExpected_date(order['Expected Shipping Date'].trim());
            new_importHistoryDetail.setComfirmed_date(order['Confirmed Shipping Date'].trim());
            new_importHistoryDetail.setStatus((status eq true)? 1 : 0);
            new_importHistoryDetail.setImport_id(import_id);
            new_importHistoryDetail.setMessage(message);
            entitySave(new_importHistoryDetail);
            return new_importHistoryDetail.getimport_detailid();
    }
    
    function importOrder(){
        var orders = deserializeJSON(GetHttpRequestData().content).data; 
        var ordersDisplay = [];
        var import_id = addImportHistory();
        var countTrue = 0;
        var countFalse = 0;
        for(order in orders)
        {
            var productlinename="";
            var productitemname="";
            var reason = '';
            var status = true;

            var product = product_itemService.getProductItemNoExist(order['Product Item'].trim());
            if(product.recordCount > 0 ){
                productlinename= product.product_line_name_english;
                productitemname= product.product_item_name_english;
                var check = purchase_orderService.getOrder(0,order['Order Nr.'].trim());
                if (check.recordCount > 0){
                    var exchange_rate = getcurrencyByCodeYear(check.currency, check.order_date);
                    if(isEmpty(exchange_rate)){
                        reason='Exchange rate '&check.currency&" in "&check.order_date&" doesn't exist";
                        status = false;
                        countFalse += 1;
                    }else{
                         var checkPosition = purchase_orderService.checkPositionNo(check.orderid,order['Position Nr.'].trim());
                        if(checkPosition.recordCount>0)
                        {
                            reason='Error when save Position, Position exist in systerm';
                            status = false;
                            countFalse += 1;
                        }else{
                            var position = {
                                "orderid":check.orderid,
                                "product_item_no": order['Product Item'].trim(),
                                "position_no":order['Position Nr.'].trim(),
                                "ordered_quantity": order['Quantity'].trim(),
                                "unit_price": order['Unit Price'].trim(),
                                "total_price": Round((LSParseNumber(order['Quantity'].trim())*LSParseNumber(order['Unit Price'].trim())) * 100) / 100,
                                "ab":  [{
                                    abno:1,
                                    shipped_quantity:order['Quantity'].trim(),
                                    shipment_method:order['Transport by'].trim(),
                                    expected_shipping_date:order['Expected Shipping Date'].trim(),
                                    confirmed_shipping_date:order['Confirmed Shipping Date'].trim(),
                                    shipping_date:'',
                                    za_date:'',
                                    eta_date:order['Confirmed Shipping Date'].trim(),
                                    relevant_due_date:order['Confirmed Shipping Date'].trim(),
                                    warehouse_book_date:''
                                }]
                            
                            };
                            var resultPosition = addOrderPosition(SerializeJSON(position),2);
                            if(resultPosition){
                                reason='Save order successful';
                                countTrue += 1;
                            }else{
                                reason='Error when save Position, Position exist in systerm';
                                status = false;
                                countFalse += 1;
                            }
                        }
                     }
                }else{
                    var exchange_rate = getcurrencyByCodeYear(order['Currency'].trim(), order['Order Date'].trim());
                    if(isEmpty(exchange_rate)){
                        reason='Exchange rate '&order['Currency'].trim()&" in "&order['Order Date'].trim()&" doesn't exist";
                        status = false;
                        countFalse += 1;
                    }else{
                        var purchase_order = {
                        "order_no":order['Order Nr.'].trim(),
                        "order_date":order['Order Date'].trim(),
                        "supplier_no":order['Supplier Nr.'].trim(),
                        "customer_no":order['Customer Nr.'].trim(),
                        "currency": order['Currency'].trim(),
                        "position":[],
                        "document":[]
                    };
                    var result = saveImportOrder(SerializeJSON(purchase_order));
                    if(result.orderid != 0){
                        var position = {
                            "orderid":result.orderid,
                            "product_item_no": order['Product Item'].trim(),
                            "position_no":order['Position Nr.'].trim(),
                            "ordered_quantity": order['Quantity'].trim(),
                            "unit_price": order['Unit Price'].trim(),
                            "total_price": Round((LSParseNumber(order['Quantity'].trim())*LSParseNumber(order['Unit Price'].trim())) * 100) / 100,
                            "ab":  [{
                                abno:1,
                                shipped_quantity:order['Quantity'].trim(),
                                shipment_method:order['Transport by'].trim(),
                                expected_shipping_date:order['Expected Shipping Date'].trim(),
                                confirmed_shipping_date:order['Confirmed Shipping Date'].trim(),
                                shipping_date:'',
                                za_date:'',
                                eta_date:order['Confirmed Shipping Date'].trim(),
                                relevant_due_date:order['Confirmed Shipping Date'].trim(),
                                warehouse_book_date:''
                            }]
                            
                        };
                        var resultPosition = addOrderPosition(SerializeJSON(position),2);
                        if(resultPosition){
                            reason='Save order successful';
                            countTrue += 1;
                        }else{
                            reason='Error when save Position, Position exist in systerm';
                            status = false;
                            countFalse += 1;
                        }
                    }else{
                        reason=result.message;
                        status = false;
                        countFalse += 1;
                    }
                }
             }   
                     
            }else{
                    reason='"Product Item No" does not exist in systerm';
                    status = false;
                    countFalse += 1;
            }
            var id = addImportHistoryDetail(order, import_id, status, reason);
            var display = {
                    'id':id,
                    'order_no': order['Order Nr.'].trim(),
                    'position_no' : order['Position Nr.'].trim(),
                    'ab_no':1,
                    'product_item_no':order['Product Item'].trim(),
                    'product_line' : productlinename,
                    'product_item_name': productitemname,
                    'order_qty':order['Quantity'].trim(),
                    'ab_qty':order['Quantity'].trim(),
                    'reason':reason,
                    'confirmed_shipping_date':order['Confirmed Shipping Date'].trim(),
                    'status' : status
                };
            ArrayAppend(ordersDisplay, display)
        }
        editImportHistory(import_id, countTrue, countFalse);
        VARIABLES.framework.renderData('JSON', {'success': true, 'data': ordersDisplay});
    }

    function importOrderSAP()
    { 
        var path = ExpandPath("/fileUpload/sap/");
        var obj = createObject("component","api/general");
        var listFile = DirectoryList(path, false, "query", "*.txt", "datelastmodified desc");
        // var server = "http://zwilling_v2.rasia.wiki/fileUpload/20160913.txt";
		// httpService = new http();
		// httpService.setMethod("get");
		// httpService.setCharset("utf-8");
		// httpService.setPath(expandPath('/fileUpload/'));
		// httpService.setFile("importFromSAP.txt");
		// httpService.setUrl("http://zwilling_v2.rasia.wiki/fileUpload/20160913.txt");
		// var result = httpService.send();
        var dateHistory = import_sap_historyService.getHistorySapLastDate();
        var configMail = {};
        var itemnoErr = [];
        var supErr = [];
        var cusErr = [];
        var curencyErr = [];
        var abErr = [];
        var countTrue = 0;
        var countFalse = 0;
        var colorErr = [];
        //writeDump(listFile.datelastmodified);abort;
        if(dateHistory.created_time < listFile.datelastmodified){
            if(fileExists(path & listFile.name)){
                var myfile = FileOpen(path & listFile.name, "read");
                var arrFile = listtoarray(FileRead(myfile),"#chr(13)##chr(10)#");
                
                var import_id = addImportSapHistory();
                for(var i = 1 ; i <= arrayLen(arrFile); i++){
                    var item = arrFile[i].split(";");
                    var reason = '';
                    var status = true;
                    var productitemname="";
                    var hashKey ="";
                    var colorStr = {
                        "cus" = 0,
                        "sup" = 0,
                        "item" = 0,
                        "curr" = 0,
                        "abno" = 0
                    };
                    var ab = {
                        order_number = item[1],
                        order_position = Int(item[2]),
                        supplier_no = item[3],
                        item_no = item[4],
                        order_qty = item[6], //item[6]
                        request_delivery = createBrowserDate(item[7]),
                        ab_position = Int(item[8]),
                        comnfirmed_qty = item[9], //item[9]
                        ab_date = createBrowserDate(item[10]),
                        unit_price = item[13],
                        currency = item[14],
                        order_date = createBrowserDate(item[15]),
                        purchase = item[16],
                        planer = item[17],
                        deletion = item[20],
                        za_date = createBrowserDate(item[26]),
                        shipping_date = createBrowserDate(item[27]),
                        shipped_qty = item[28]
                    }
                    hashKey = hash(ab.order_number&ab.order_position&ab.supplier_no&ab.item_no&ab.order_qty&
                                            ab.request_delivery&ab.ab_position&ab.comnfirmed_qty&ab.ab_date&ab.unit_price&ab.currency&
                                            ab.order_date&ab.purchase&ab.planer&ab.deletion&ab.za_date&ab.shipping_date&ab.shipped_qty);
                    var hashkeyCheck = purchase_orderService.getHashKey(hashKey);
                    if(Int(ab.comnfirmed_qty) > 0 && hashkeyCheck.recordCount == 0){
                        var relevant_due_date = ab.request_delivery;
                            if(ab.za_date != "" && Int(ab.za_date) > 0){
                                relevant_due_date = ab.za_date;
                            }
                        var checkData = checkDataSap(ab.item_no, ab.purchase, ab.supplier_no, ab.currency, ab.order_date);
                        if(checkData.success){
                            var orderUp = purchase_orderService.getOrder(0, ab.order_number);
                            if (orderUp.recordCount > 0){
                                //yes order
                                var positionCheck = purchase_orderService.checkPositionNo(orderUp.orderid, ab.order_position);
                                if (positionCheck.recordCount > 0){
                                    //yes posion
                                    var positionEntity = {
                                                "positionid": positionCheck.positionid,
                                                "product_item_no": checkData.data.product_item_no,
                                                "position_no": ab.order_position,
                                                "ordered_quantity": ab.order_qty,
                                                "unit_price": ab.unit_price,
                                                "total_price": Round((LSParseNumber(ab.order_qty)*LSParseNumber(ab.unit_price)) * 100) / 100,
                                                "ab":[{
                                                        abno:ab.ab_position,
                                                        shipped_quantity:ab.comnfirmed_qty,
                                                        shipment_method:"",
                                                        expected_shipping_date:ab.request_delivery,
                                                        confirmed_shipping_date:ab.ab_date,
                                                        shipping_date:ab.shipping_date,
                                                        za_date:ab.za_date,
                                                        eta_date:"",
                                                        relevant_due_date:relevant_due_date,
                                                        warehouse_book_date:'',
                                                        hashkey:hashkey,
                                                        etd_date: ""
                                                    }]
                                            };
                                    var abCheck = purchase_orderService.getAbByAbno(positionCheck.positionid, ab.ab_position);
                                    if (abCheck.recordCount > 0){
                                        //yes ab
                                        if(ab.deletion eq 'l' || ab.deletion eq 'L'){
                                            positionEntity.ab[1].abid = abCheck.abid;
                                            var positionDel = editOrderPosition(SerializeJSON(positionEntity),2, 1);
                                            if(positionDel){
                                                reason='Delete ab successful';
                                                countTrue += 1;
                                            }else{
                                                reason='Error when Delete ab';
                                                status = false;
                                                countFalse += 1;
                                            }
                                        }else{
                                            positionEntity.ab[1].abid = abCheck.abid;
                                            if(abCheck.id > 0){
                                                positionEntity.ab[1].id = abCheck.id;
                                            }else{
                                                positionEntity.ab[1].id = 0;
                                            }
                                            var positionUp = editOrderPosition(SerializeJSON(positionEntity),2, 0);
                                            if(positionUp){
                                                reason='Update order successful';//writeDump(ab);writeDump(hashkeyCheck);writeDump(hashkeyCheck.recordCount);abort;
                                                countTrue += 1;
                                            }else{
                                                reason='Error when save Position';
                                                status = false;
                                                countFalse += 1;
                                            }
                                        }
                                    }else{
                                        //not ab
                                        var positionUp = editOrderPosition(SerializeJSON(positionEntity),2, 0);
                                        if(positionUp){
                                            reason='Save order successful';
                                            countTrue += 1;
                                        }else{
                                            reason='Error when save Position';
                                            status = false;
                                            countFalse += 1;
                                        }
                                    }
                                }else{
                                    //not position
                                    var position = {
                                            "orderid":orderUp.orderid,
                                            "product_item_no": checkData.data.product_item_no,
                                            "position_no": ab.order_position,
                                            "ordered_quantity": ab.order_qty,
                                            "unit_price": ab.unit_price,
                                            "total_price": Round((LSParseNumber(ab.order_qty)*LSParseNumber(ab.unit_price)) * 100) / 100,
                                            "ab":  [{
                                                abno:ab.ab_position,
                                                shipped_quantity:ab.comnfirmed_qty,
                                                shipment_method:"",
                                                expected_shipping_date:ab.request_delivery,
                                                confirmed_shipping_date:ab.ab_date,
                                                shipping_date:ab.shipping_date,
                                                za_date:ab.za_date,
                                                eta_date:"",
                                                relevant_due_date:relevant_due_date,
                                                warehouse_book_date:'',
                                                hashkey:hashkey
                                            }]  
                                        };
                                    var positionSave = addOrderPosition(SerializeJSON(position),2);
                                    if(positionSave){
                                        reason='Save order successful';
                                        countTrue += 1;
                                    }else{
                                        reason='Error when save Position, Position exist in systerm';
                                        status = false;
                                        countFalse += 1;
                                    }
                                }
                            }else{ 
                                //not order
                                var purchase_order = {
                                        "order_no":ab.order_number,
                                        "order_date":ab.order_date,
                                        "supplier_id":checkData.data.supplier_id,
                                        "customer_id":checkData.data.customer_id,
                                        "currency": ab.currency,
                                        "is_sap": 1,
                                        "position":[],
                                        "document":[]
                                    }
                                var orderSave = saveImportOrder(SerializeJSON(purchase_order));
                                if(orderSave.orderid != 0){
                                    var position = {
                                        "orderid":orderSave.orderid,
                                        "product_item_no": checkData.data.product_item_no,
                                        "position_no": ab.order_position,
                                        "ordered_quantity": ab.order_qty,
                                        "unit_price": ab.unit_price,
                                        "total_price": Round((LSParseNumber(ab.order_qty)*LSParseNumber(ab.unit_price)) * 100) / 100,
                                        "ab":  [{
                                            abno:ab.ab_position,
                                            shipped_quantity:ab.comnfirmed_qty,
                                            shipment_method:"",
                                            expected_shipping_date:ab.request_delivery,
                                            confirmed_shipping_date:ab.ab_date,
                                            shipping_date:ab.shipping_date,
                                            za_date:ab.za_date,
                                            eta_date:"",
                                            relevant_due_date:relevant_due_date,
                                            warehouse_book_date:'',
                                            hashkey:hashkey
                                        }]  
                                    };
                                    var positionSave = addOrderPosition(SerializeJSON(position),2);
                                    if(positionSave){
                                        reason='Save order successful';
                                        countTrue += 1;
                                    }else{
                                        reason='Error when save Position, Position exist in systerm';
                                        status = false;
                                        countFalse += 1;
                                    }
                                }else{
                                    reason=result.message;
                                    status = false;
                                    countFalse += 1;
                                }
                            }
                        }else{
                            reason= checkData.data.message;
                            status = false;
                            countFalse += 1;
                            if(structKeyExists(checkData.data, "itemno")){
                                arrayAppend(itemnoErr, checkData.data.itemno);
                                colorStr.item = 1;
                            }
                            if(structKeyExists(checkData.data, "supplier_no")){
                                arrayAppend(supErr, checkData.data.supplier_no);
                                colorStr.sup = 1;
                            }
                            if(structKeyExists(checkData.data, "customer_no")){
                                arrayAppend(cusErr, checkData.data.customer_no);
                                colorStr.cus = 1;
                            }
                            if(structKeyExists(checkData.data, "currency")){ 
                                var fal = false;
                                for(item in curencyErr){
                                    if(item.currency == checkData.data.currency.currency && item.year == checkData.data.currency.year){
                                        fal = true;
                                    }
                                }
                                if(!fal){
                                    arrayAppend(curencyErr, checkData.data.currency);
                                }
                                colorStr.curr = 1;
                            }
                        }
                    }else{
                        reason= "AB number less than or equal to zero or ab exist in system";
                        status = false;
                        countFalse += 1;
                        arrayAppend(abErr, ab.order_number);
                        colorStr.abno = 1;
                    } 
                    addImportSapHistoryDetail(ab, import_id, status, reason);
                    arrayAppend(colorErr, colorStr);
                }
                editImportSapHistory(import_id, countTrue, countFalse);
                //create excel file
                var exp = createObject("component","export");//writeDump(colorErr);abort;
                var data =import_sap_historyService.getImportHistoryDetail(import_id);
                var excelName = exp.exportExcel(obj.queryToArray(data), colorErr);
                //send mail
                var lhs = createObject("java", "java.util.LinkedHashSet");
                var path_excel = ExpandPath("/templates/");
                var listMail = purchase_orderService.getListMail();
                    configMail.mailFrom="importdataengine@zwilling.com.vn";
                    configMail.name="admin";
                    configMail.title="Please click ";
                    configMail.mailTo=listMail.email_address;
                    configMail.mailSubject="Import data problems report on";
                    configMail.mailContent = {
                        "itemno":lhs.init(itemnoErr).toArray(),
                        "cusno": lhs.init(cusErr).toArray(),
                        "supno": lhs.init(supErr).toArray(),
                        "currcy": curencyErr,
                        "abno": lhs.init(abErr).toArray(),
                        "remain": countTrue
                    }
                    configMail.attach= path_excel&excelName;
                var mail = obj.sendMailFromSAP(configMail);
                if(FileExists(configMail.attach)){
                    FileDelete(configMail.attach);
                }
            }
        }
        
        VARIABLES.framework.renderData('JSON', {'success': true});
    }

    function createBrowserDate(numeric this_date) {
        var dateFortmat = "";
        if(Int(this_date) > 0){
            dateFortmat = left(this_date,4)& "-" &mid(this_date,5,2)& "-" &right(this_date,2);
        }
        return dateFortmat;
    }

    function checkDataSap(string itemno, string customer_no, string supplier_no, string currency, string order_date) {
        var result = {};
        var flag = true;
        var product = product_itemService.getProductItemFromSap(itemno);
        if(product.recordCount > 0 ){
            result.productitemname = product.product_item_name_english;
            result.product_item_no = product.product_item_no;
        }else{
            result.message='"Product Item No" does not exist in systerm';
            flag = false;
            result.itemno = trim(itemno);
        }
        if(flag){
            var supplier = companyService.getCompanyByCompanyNo(supplier_no, 2, 0);
            if(supplier.recordCount > 0 ){
                result.supplier_id = supplier.companyid;
            }else{
                result.message='"Supplier No" does not exist in systerm';
                flag = false;
                result.supplier_no = trim(supplier_no);
            }
            if(flag){
                var contact = contactService.getContactByBuyerNo(customer_no);
                if(contact.recordCount > 0 ){
                    var customer = companyService.getCompanyByCompanyNo(contact.company_no, 3, 0);
                    if(customer.recordCount > 0 ){
                        result.customer_id = customer.companyid;
                    }else{
                        result.message='"Customer No" does not exist in systerm';
                        flag = false;
                        result.customer_no = trim(customer_no);
                    }
                }else{
                    result.message='"Customer No" does not exist in systerm';
                    flag = false;
                    result.customer_no = trim(customer_no);
                }
            }
            if(flag){
                var exchange_rate = getcurrencyByCodeYear(currency, order_date);
                if(isEmpty(exchange_rate)){
                    result.message ='Exchange rate '&currency&" in "&order_date&" doesn't exist";
                    flag = false;
                    var years    = Year(DateFormat(order_date, 'yyyy-mm-dd'));
                    result.currency = {"currency":trim(currency), "year":trim(years)};
                }
            }
        }
        return {'data': result, 'success': flag};
    }

    function addImportSapHistory() { 
        var new_importSap = entityNew('import_sap_history');
            new_importSap.setCreated_time(now());
            entitySave(new_importSap);
        return  new_importSap.getImport_sap_id();
    }

    function editImportSapHistory(numeric importid, numeric countR, numeric countF) {
        var importSap = entityLoad( "import_sap_history", importid, true );
        importSap.setSuccess(countR);
        importSap.setFail(countF);
    }

    function getImportSapHistoryList() {
        var obj = createObject("component","api/general");
        VARIABLES.framework.renderData('JSON', obj.queryToArray(import_sap_historyService.getImportSap()));
    }

    function getImportSapHistoryDetailById() {
        var obj = createObject("component","api/general");
        VARIABLES.framework.renderData('JSON', obj.queryToArray(import_sap_historyService.getImportHistoryDetail(URL.importid)));
    }
    
    function addImportSapHistoryDetail(struct ab, numeric import_id, boolean status, string message) {
        var new_importSapHistoryDetail = entityNew('import_sap_detail_history');
            new_importSapHistoryDetail.setOrder_no(ab.order_number);
            new_importSapHistoryDetail.setPosition_no(ab.order_position);
            new_importSapHistoryDetail.setSupplier_no(ab.supplier_no);
            new_importSapHistoryDetail.setItem_no(ab.item_no);
            new_importSapHistoryDetail.setOrder_quantity(ab.order_qty);
            new_importSapHistoryDetail.setExpected_shipping_date(ab.request_delivery);
            new_importSapHistoryDetail.setAb_no(ab.ab_position);
            new_importSapHistoryDetail.setAb_quantity(ab.comnfirmed_qty);
            new_importSapHistoryDetail.setConfirmed_shipping_date(ab.ab_date);
            new_importSapHistoryDetail.setUnit_price(ab.unit_price);
            new_importSapHistoryDetail.setCurrency(ab.currency);
            new_importSapHistoryDetail.setOrder_date(ab.order_date);
            new_importSapHistoryDetail.setPurchaser(ab.purchase);
            new_importSapHistoryDetail.setPlanner(ab.planer);
            new_importSapHistoryDetail.setDeletion(ab.deletion);
            new_importSapHistoryDetail.setZa_date(ab.za_date);
            new_importSapHistoryDetail.setShipping_date(ab.shipping_date);
            new_importSapHistoryDetail.setShipped_quantity(ab.shipped_qty);
            new_importSapHistoryDetail.setStatus((status eq true)? 1 : 0);
            new_importSapHistoryDetail.setImport_sap_id(import_id);
            new_importSapHistoryDetail.setMessage(message);
            entitySave(new_importSapHistoryDetail);
        return new_importSapHistoryDetail.getImport_sap_detail_id();
    }
    
    function reImportOrder(){

        var data = entityLoad('import_history_detail', URL.id, true);
        
            var productlinename="";
            var productitemname="";
            var reason = '';
            var status = true;
            
            var purchase_order = {
                "order_no":data.getorder_no(),
                "order_date":data.getorder_date(),
                "supplier_no":data.getsupplier_no(),
                "customer_no":data.getcustomer_no(),
                "currency": data.getcurrency(),
                "position":[],
                "document":[]
            };
            var result = saveImportOrder(SerializeJSON(purchase_order));
            if(result.orderid != 0){
                var exchange_rate = getcurrencyByCodeYear(result.currency, result.order_date);
                if(isEmpty(exchange_rate)){
                    reason='Exchange rate '&result.currency&" in "&result.order_date&" doesn't exist";
                    status = false;
                }else{
                    var product = product_itemService.getProductItemNoExist(data.getproductitem_no());
                    if(product.recordCount > 0 ){
                        productlinename= product.product_line_name_english;
                        productitemname= product.product_item_name_english;
                         var position = {
                            "orderid":result.orderid,
                            "product_item_no": data.getproductitem_no(),
                            "position_no":data.getposition_no(),
                            "ordered_quantity": data.getquantity(),
                            "unit_price": data.getunitprice(),
                            "total_price": Round((LSParseNumber(data.getquantity())*LSParseNumber(data.getunitprice())) * 100) / 100,
                            "ab":  [{
                                abno:1,
                                shipped_quantity:data.getquantity(),
                                shipment_method:data.gettransport(),
                                expected_shipping_date:data.getexpected_date(),
                                confirmed_shipping_date:data.getcomfirmed_date(),
                                shipping_date:'',
                                za_date:'',
                                eta_date:data.getcomfirmed_date(),
                                relevant_due_date:data.getcomfirmed_date(),
                                warehouse_book_date:''
                            }]
                            
                        };
                        var resultPosition = addOrderPosition(SerializeJSON(position),2);
                        if(resultPosition){
                            reason='Save order successful';
                        }else{
                            reason='Error when save Position, Position exist in systerm';
                            status = false;
                        }
                    }else{
                        reason='"Product Item No" does not exist in systerm';
                        status = false;
                    }
                }
            }else{
                reason=result.message;
                status = false;
            }
            var importHistory = entityLoad("import_history", data.getimport_id(), true);
            if(status){
                importHistory.setSuccess(importHistory.getSuccess() + 1);
                importHistory.setFail(importHistory.getFail() - 1);
                data.setstatus(status);
            }
            data.setmessage(reason);
         VARIABLES.framework.renderData('JSON', {'success': true});
    }

    function getOrderById(numeric id) {
            var obj = createObject("component","api/general");
            orderDetail = obj.queryToObject(purchase_orderService.getOrder(id, "")); 
            positions = obj.queryToArray(purchase_orderService.getIdPositionByOrderId(orderDetail.orderid));
            positionIds = [];
            
            for(pos in positions){
                aqArr = [];
                pos.ab = obj.queryToArray(purchase_orderService.getAbByPositionId(pos.positionid));
                arrayAppend(positionIds, pos.positionid);
                qls=obj.queryToArray(product_item_qlService.getQl(pos.product_item_no));
                for(q in qls){
                    arrayAppend(aqArr, q.ql);
                }
                pos.qls = aqArr;
            }
            orderDetail.position = positionIds;
            documents = obj.queryToArray(order_documentService.getListDocByIdOrder(orderDetail.orderid));

            documentIds = [];
            for(doc in documents){
                arrayAppend(documentIds, doc.id);
            }
            orderDetail.document = documentIds; 
            VARIABLES.framework.renderData('JSON', {
                                                    'purchase_order': orderDetail, 
                                                    'order_position': positions
                                                    });
    }
    function transport() { 
        var obj = createObject("component","api/general");
        result = purchase_orderService.getTransportList();
        VARIABLES.framework.renderData('JSON', obj.queryToArray(result));
    }

    function deleteAb() {
        if(cgi.request_method == "delete"){
            var success = false;
            var message = "";
            checkAbExist = entityLoad( "inspection_report", {abid=URL.id}, true );
            if(isNull(checkAbExist)){
                entity_ab = entityLoad( "ab", URL.id, true );
                entityDelete( entity_ab );
                entity_inspection_schedule = entityLoad( "inspection_schedule", {abid=URL.id}, true );
                entityDelete( entity_inspection_schedule );
                success = true;
                message = "Delete success";
            }else{
                message = "Can't delete because exist in inspection report";
            }
            VARIABLES.framework.renderData('JSON', {'success': success, 'message': message});
        }
    }

    function getOrderNo() {
        var obj = createObject("component","api/general");
        VARIABLES.framework.renderData('JSON', obj.queryToArray(purchase_orderService.getOrderNoList()));
    }

    function getCurrencyByYear() {
        var obj = createObject("component","api/general");
        var year    = Year(DateFormat(URL.order_date, 'yyyy-mm-dd'));
        VARIABLES.framework.renderData('JSON', obj.queryToArray(currencyService.getCurrencyByYear(year)));
    }

    function getcurrencyByCodeYear(string code, string order_date) {
        var year    = Year(DateFormat(order_date, 'yyyy-mm-dd'));
        return currencyService.getRateByCodeAndYear(code, year);
    }
    
    function position() {
        switch(cgi.request_method) { 
            case "put": 
                    editOrderPosition(GetHttpRequestData().content, 1, 0); 
                    break; 
            case "post": 
                addOrderPosition(GetHttpRequestData().content,1);
                break; 
            case "delete":
                if(StructKeyExists(URL, 'id')){
                    deleteOrderPosition(URL.id);
                }
                break;
            case "get": 
                if(StructKeyExists(URL, 'id')){
                    getOrderPositionById(URL.id);
                    break;
                }
                getOrderPositionList(GetHttpRequestData().headers.id);  
                break;          
        }
    }
    
    function execute() {

        switch(cgi.request_method) { 
            case "put": 
                    editOrder(GetHttpRequestData().content); 
                    break; 
            case "post": 
                saveOrder(GetHttpRequestData().content);
                break; 
            case "delete":
                if(StructKeyExists(URL, 'id')){
                    //deleteAccess(GetHttpRequestData().headers.token, URL.id);
                    break; 
                }
            case "get": 
                if(StructKeyExists(URL, 'id')){
                    getOrderById(URL.id);
                    break;
                }
                oSearch(); 
                break;          
        } //end switch
    }

}