// import XS Procedures library
var connection  = $.hdb.getConnection();

////set a schema where temporary tables can be created for passing table-valued parameters to the procedure
//connection.setTempSchema(proc.get_session_variable.getUsername().toUpperCase());

function createCustomerData() {
		// load the procedure
		var prCreateData = connection.loadProcedure("procedures.masterData::PR_EXTRACT_LT_CUSTOMERS");

		// call the procedure
		var result = prCreateData();
		connection.commit();
		connection.close();
		$.response.setBody(JSON.stringify(result) );
}


function runJob() {
	createCustomerData();
}

//for testing 
runJob();