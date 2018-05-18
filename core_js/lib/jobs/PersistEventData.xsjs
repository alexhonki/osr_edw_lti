// import XS Procedures library
// var XSProc 	= $.import("sap.hana.xs.libs.dbutils", "procedures");
var connection = $.hdb.getConnection();

//
////set a schema where temporary tables can be created for passing table-valued parameters to the procedure
// XSProc.setTempSchema($.session.getUsername().toUpperCase());

/**
 * @function generateInfluence Generate Influence for a specific calendar month
 * @returns
 * 
 */
function generateInfluence() {
	var prGenerateInfluence = connection.loadProcedure("procedures.utils::PR_UTIL_GENERATE_EVENT_INFLUENCE");
	// XSProc.procedure("SAP_CRI", "sap.cri.db.procedures", "PR_UTIL_GENERATE_EVENT_INFLUENCE");

	var date = new Date();
	var timeSegment = parseInt(date.getFullYear()) * 100 + parseInt(date.getMonth() + 1);

	prGenerateInfluence({
		I_TIME_SEGMENT: timeSegment
	});
	connection.commit();
	connection.close();

}

/**
 * @function generateDTR Generate Days to React for a specific calendar month
 * @returns
 */
function generateDTR() {
	var prGenerateDtr = connection.loadProcedure("procedures.utils::PR_UTIL_GENERATE_EVENT_DAYS_TO_REACT");
	// XSProc.procedure("SAP_CRI", "sap.cri.db.procedures", "PR_UTIL_GENERATE_EVENT_DAYS_TO_REACT");

	var date = new Date();
	var timeSegment = parseInt(date.getFullYear()) * 100 + parseInt(date.getMonth() + 1);
	prGenerateDtr({
		I_TIME_SEGMENT: timeSegment
	});
	connection.commit();
}

/**
 * @function runJob
 * @param {Object} input Job input parameter object
 * @returns
 */
function runJob(input) {

	// $.session.assertAppPrivilege("sap.cri.db.jobs::Execute");
	var id = input.id;

	switch (id.toUpperCase()) {
		case "DTR":
			generateDTR();
			break;
		case "INFLUENCE":
			generateInfluence();
			break;
		default:
			throw "unknown ID " + id.toUpper();
	}
}
/*var input = {
	id: "DTR"
};
runJob(input);
input = {
	id: "INFLUENCE"
};
runJob(input);*/