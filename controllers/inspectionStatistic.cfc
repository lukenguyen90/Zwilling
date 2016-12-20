component accessors=true {

    property framework;
    property inspection_statisticService;

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
    
    function getInspectStatic(string data) { 
        var obj = createObject("component","api/general");
        var info = deserializeJSON(data);
        var inspectStatics = obj.queryToArray(inspection_statisticService.getInspectionStatic(info.locationid,info.startdate,info.enddate));
        variables.framework.renderData('JSON', inspectStatics);  
    }

    function execute() {

        switch(cgi.request_method) { 
            case "PUT": 
                    //editUser(GetHttpRequestData().content); 
                    break; 
            case "POST": 
                    getInspectStatic(GetHttpRequestData().content);
                    break; 
            case "DELETE":
                if(StructKeyExists(URL, 'id')){
                    //deleteUser(GetHttpRequestData().headers.Authorization, URL.id);
                    break; 
                }
            case "GET": 
                //getInspectStatic(); 
                break;         
        } //end switch
    }
}