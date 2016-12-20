/**
*
* @file  /E/Projects/zwilling_v2/controllers/todo.cfc
* @author  dieu.le
* @description todoController
*
*/

component accessors="true"  {

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

	public function init(required any fw){
		variables.fw = arguments.fw;
		return this;
	}

	function addTodo(string data){
		var getData = deserializeJSON(data);
		/* JSON: {	"english_name":"abc",
					"updateby":"dieu",
					"active":"1" } */
		var new_todo = EntityNew("todo",{
			 english_name = getData.english_name
			,updateby 	  = getData.updateby
			,active 	  = getData.active
			,lastdate 	  = dateformat(now(),'yyyy-mm-dd')  
			});
		entitySave(new_todo);
		var message = 'Insert new record success';
		variables.fw.renderData('JSON',{'message':message, 'success':true});
	}
	function editTodo(string data){
		var getData  =deserializeJSON(data);
		/* JSON: {	"todo_id":"1"
					"english_name":"abc",
					"updateby":"dieu",
					"active":"1" } */
		var edit_todo  = EntityLoad("todo",getData.todo_id, true);

		edit_todo.setEnglish_name(getData.english_name);
		edit_todo.setActive(getData.active);
		edit_todo.setUpdateby(getData.updateby);
		edit_todo.setLastdate(now());
		var message = 'Update data in to do list success';
		variables.fw.renderData('JSON',{'message':message, 'success':true})
	}
	function getAll(){
		var todo = entityLoad("todo");
		variables.fw.renderData('JSON',todo);

	}
	function execute(){
		switch(cgi.request_method){
			case "POST":
				addTodo(getHttpRequestData().content);
			break;
			case "PUT":
				editTodo(getHttpRequestData().content);
			break;
			case "GET":
				getAll();
			break;
		}
	}
}