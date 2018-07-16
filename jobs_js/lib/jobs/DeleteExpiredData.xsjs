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
//connection.setTempSchema(proc.get_session_variable().getUsername().toUpperCase());

//XSProc.setTempSchema($.session.getUsername().toUpperCase());

function deleteCustomerBaseData(iFlag) {	
/*	if (!$.session.hasAppPrivilege("sap.cri.db.jobs::Execute")) {
	    $.response.setBody("Privilege sap.cri.db.jobs::Execute is missing"); 
	    $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
	} else {*/
		//var conn = $.db.getConnection();
		
		
		//var prDeleteData = XSProc.procedureOfSchema("SAP_CRI", "sap.cri.db.procedures::PR_UTIL_DELETE_EXPIRED_DATA");
		
		// load the procedure
		var prDeleteData = connection.loadProcedure("procedures.utils::PR_UTIL_DELETE_EXPIRED_DATA");

		// call the procedure
		//var result =  prDeleteData({ I_FLAG: 1 }, conn);
		var result = prDeleteData(1);
		connection.commit();
		connection.close();
		console.log("inside Delete Expired Data");
		//$.response.setBody(JSON.stringify({status: 200}) );
	//}	
}


function runJob(input) {
	var iFlag = input.flag || 0;
	deleteCustomerBaseData(iFlag);
}

//testing the xsjs
//runJob({flag: 0});