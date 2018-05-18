// import XS Procedures library
//var XSProc 	= $.import("sap.hana.xs.libs.dbutils", "procedures");
//var XSDS 	= $.import("sap.hana.xs.libs.dbutils", "xsds");
var connection = $.hdb.getConnection();
//
////set a schema where temporary tables can be created for passing table-valued parameters to the procedure
//XSProc.setTempSchema($.session.getUsername().toUpperCase());


function mlTrainData(sReactionType) {	
	/*if (!$.session.hasAppPrivilege("sap.cri.db.jobs::Execute")) {
	    $.response.setBody("Privilege sap.cri.db.jobs::Execute is missing"); 
	    $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
	} else {*/
		//var sReactionType 	= iFlag.parameter.REACTION_TYPE; 
		//return sReactionType;
		
		//var body = response.body.asString(sReactionType);
		var RunPrediction = connection.loadProcedure("procedures.ml::PR_RUN_TRAIN_PREDICT_WRAPPER");
		//var RunPrediction = XSProc.procedure("SAP_CRI", "sap.cri.db.procedures", "PR_UTIL_PREDEFINED_EVENT_SCANNER");
		RunPrediction({ REACTION_TYPE: sReactionType, PREVIOUS_WINDOWS: 1}); 
		connection.commit();
		connection.close();
	//}	
}


function runJob(input) {
	var sReactionType = input.REACTION_TYPE || 'DEBTOR_INITIAL_ASSESSMENT';
	mlTrainData(sReactionType);
}

//runJob({REACTION_TYPE: 'DEBTOR_INITIAL_ASSESSMENT'});