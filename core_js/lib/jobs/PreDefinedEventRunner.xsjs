// import XS Procedures library
//var XSProc 	= $.import("sap.hana.xs.libs.dbutils", "procedures");
//var XSDS 	= $.import("sap.hana.xs.libs.dbutils", "xsds");
var connection  = $.hdb.getConnection();
/*var proc  = {
	get_session_variable : connection.loadProcedure(" shineLight.Procedures::get_session_variable "),
	set_session_variable : connection.loadProcedure(" shineLight.Procedures::set_session_variable "),
	get_application_variable : connection.loadProcedure(" shineLight.Procedures::get_application_variable "),
	set_application_variable : connection.loadProcedure(" shineLight.Procedures::set_application_variable ")
};*/
//
////set a schema where temporary tables can be created for passing table-valued parameters to the procedure
//XSProc.setTempSchema($.session.getUsername().toUpperCase());



/**
 * 
 * @param input
 * @returns
 */
function runPreDefinedEvent(input) {
	/*var sSchema 		= input.PROC_SCHEMA,*/
	var	sFullProcName	= input.PROC_NAME,
		sEventId		= input.EVENT_ID;
	
	//var sPackage 		= sFullProcName.split('::')[0]; // example: sap.cri.db.procedures
	//var sProcName		= sFullProcName.split('::')[1]; // example: PR_EVENT_EXAMPLE_HELLO_WORLD
	
	/*var oParameters = {
			I_EVENT_ID: sEventId
	};*/
		
	if (sFullProcName && sEventId) {
		var prPredefinedEvent = connection.loadProcedure(sFullProcName);
		var result = prPredefinedEvent({IM_EVENT_ID: sEventId});
		connection.commit();
		connection.close();
		$.response.setBody(JSON.stringify(result));
	//	prPredefinedEvent(oParameters)		
	} else {
		// throw exception
	}

}


function runJob(input) {
	/*if (!$.session.hasAppPrivilege("sap.cri.db.jobs::Execute")) {
	    $.response.setBody("Privilege sap.cri.db.jobs::Execute is missing"); 
	    $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
	} else {*/
	
		runPreDefinedEvent(input);
	//}
}
/*runJob({PROC_NAME: 'procedures.events.generic::PR_DECREASED_EVENTS_TIME',
		EVENT_ID: '424'});*/