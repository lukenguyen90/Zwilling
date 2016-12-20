
component extends="framework.one" {
	this.datasource = "zwilling";
	this.ormEnabled = true;
	this.sessionmanagement = true;
    this.sessionTimeout = CreateTimeSpan(1,0,0,0);
    this.sessionStorage = "memory";
 	// function setupApplication() {
	// 	ORMReload();
	// }
	 // function setupRequest( rc ) {    
  //       if ( isJSON( getHttpRequestData().content ) ){
  //               rc.data = deserializeJSON( getHttpRequestData().content );
  //              	//writedump(rc);abort;
  //       }
  //   }
  
  
  // function onRequestStart( string targetPath ){
  // //   //var obj = createObject("component","api/general");
  // //   //obj.test();
  // //   //writedump(queryExecute(sql));abort;
  //   //GetPageContext().getResponse().sendRedirect("./##/login");
  //   //return true;
  // //   //writedump('gfgf');abort;
  // //   //return true;
  // //   //writedump(GetHttpRequestData().headers);
  // //   // location(url=CGI.http_host&"/##/login", addToken='no', statusCode='302'); writedump(CGI.http_host&"/##/login");abort;
  // //   // var sql = "select user.user_name, user.id_user, user.first_name as displayname, 
  // //   //       user.email, user.is_active, user.id_role 
  // //   //       from user";
  // //   //var obj = createObject("component","api/general");
  // //   //obj.test();
  // //   //writedump(queryExecute(sql));abort;
  // }
}
