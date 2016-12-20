component persistent="true"{

	property name="todo_id" 		fieldType="id" generator="native" setter="false";
	property name="english_name" 	ormType="string";
	property name="active" 			ormType="short" default="1";
	property name="lastdate" 		ormType="timestamp";
	property name="updateby" 		ormType="string";
}