// import XS Procedures library
//var XSProc 	= $.import("sap.hana.xs.libs.dbutils", "procedures");
var connection = $.hdb.getConnection();
//
////set a schema where temporary tables can be created for passing table-valued parameters to the procedure
//XSProc.setTempSchema($.session.getUsername().toUpperCase());


function mlPredictData(sReactionType) {	
	/*if (!$.session.hasAppPrivilege("sap.cri.db.jobs::Execute")) {
	    $.response.setBody("Privilege sap.cri.db.jobs::Execute is missing"); 
	    $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
	} else {*/
		// load the procedure
		var prPredictWrapper = connection.loadProcedure("procedures.ml::PR_RUN_PREDICT_WRAPPER");
		prPredictWrapper({ REACTION_TYPE: sReactionType, PREVIOUS_WINDOWS: 1 });
		connection.commit();
		connection.close();
	//}	
}


function runJob(input) {
	var sReactionType = input.REACTION_TYPE || 'DEBTOR_INITIAL_ASSESSMENT';
	// Run Prediction
	mlPredictData(sReactionType);
}

//runJob({REACTION_TYPE: "DEBTOR_INITIAL_ASSESSMENT"});