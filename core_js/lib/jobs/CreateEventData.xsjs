// import XS Procedures library
var connection  = $.hdb.getConnection();

////set a schema where temporary tables can be created for passing table-valued parameters to the procedure
//connection.setTempSchema(proc.get_session_variable.getUsername().toUpperCase());

function createEventData() {
		// load the procedure
		var prCreateData = connection.loadProcedure("procedures.events.erp::PR_EXTRACT_ASSESSMENT_EVENT");

		// call the procedure
		var result = prCreateData();
		connection.commit();
		connection.close();
		$.response.setBody(JSON.stringify(result) );
}


function runJob() {
	createEventData();
}

//for testing 
//runJob();