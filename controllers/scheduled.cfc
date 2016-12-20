component accessors=true {

    property framework;

    public function update() {
        var timeOut = -24;
        var timeType= "h" ;//hour
        var timeOfdead = dateAdd(timeType, timeOut, now() );
        var timeOutSessions = ormExecuteQuery("from session where updated_time <= ?", [timeOfdead] );
        entityDelete( timeOutSessions );
        VARIABLES.framework.renderData('JSON', "Clean Success!");
    }

    function checkTimeOut() {
    	var obj = createObject("component","api/general");
        VARIABLES.framework.renderData('JSON', {'tokenTimeout': false});
    }
}