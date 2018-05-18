// import XS Procedures library
var connection  = $.hdb.getConnection();

////set a schema where temporary tables can be created for passing table-valued parameters to the procedure
//connection.setTempSchema(proc.get_session_variable.getUsername().toUpperCase());

function deleteCustomerBaseData() {
		// load the procedure
		var prDeleteData = connection.loadProcedure("procedures.utils::PR_UTIL_DELETE_CUSTOMER_DATA");

		// call the procedure
		var result = prDeleteData();
		connection.commit();
		connection.close();
		console.log("inside the job function");
		//$.response.setBody(JSON.stringify(result) );
}


function runJob() {
	deleteCustomerBaseData();
}

//for testing 
// /runJob();