component {
	function getToDoList(){
		var sql = "select todo_id as id, english_name as name, if(1 = 1, 'undefined', 0) as value from todo where active = 1";
		return queryExecute(sql);
	}
}