
var connection = $.hdb.getConnection();

function PredefinedEvents(input) {
	// load the procedure
	var prScanPredefinedEvents = connection.loadProcedure("procedures.utils::PR_UTIL_PREDEFINED_EVENT_SCANNER");
	// call the procedure
	var result = prScanPredefinedEvents();
	connection.commit();
	connection.close();
	$.response.setBody(JSON.stringify(result) );
}


/**
 * Run Job with input parameters
 * @param input
 * @returns
 */
function runJob(input) {
	PredefinedEvents(input);
}

//runJob();