$.import("exits", "Utils");
var Utils = $.exits.Utils;
$.import("jobs", "job");
var EventJob = $.jobs.job;
var conn = $.db.getConnection();
var XSDS = $.require("@sap/cds").xsjs(conn); // “cds” refers to node-cds

// import XS Procedures library
var connection = $.hdb.getConnection();
 var proc = {
 	prCreateDerivedEvent : connection.loadProcedure("SAP_CRI.sap.cri.db.procedures::PR_CONF_CREATE_EVENT_FROM_TEMPLATE")
 	
 };

/**
 * Create Exit for Predefined Events
 * @param param
 * @returns
 */
function createDerivedEvent(param) {
    let before = param.beforeTableName;
    let after = param.afterTableName;
    let pStmt = param.connection.prepareStatement('select * from "' + after +'"');

    // Get Input Data from OData Create
    var data = Utils.recordSetToJSON(pStmt.executeQuery(),'Event')['Event'];
    
    // GET entity	
	var promiseImportEntities = Utils.getImportEntitiesPromise(["db.cds::adm.config.event.parameters"]);
    // // Set XSDS Entity
    var oEventConfig, oEventParameters, aParameters = [];
	try {
		var oRow = data[0];
		if (!oRow.TEMPLATE_ID) throw "TEMPLATE_ID not populated";
		promiseImportEntities.then(function(entities) {
			var Event = entities["db.cds::adm.config.event.parameters"];
			return Utils.getTxPromise([Event]);
		}).then(function(txObj) {
			// Do lookup on template for parameters
			return Utils.getTxFindPromise(txObj.entities[0], {
				EVENT: oRow.TEMPLATE_ID
			}, txObj.tx);
		}).then(function(findObj) {
			if (findObj.entities.length > 0) {
				oEventParameters = findObj.entities;
				 // Build Input Parameter Table
            for (var j in oEventParameters) {
                switch (oEventParameters[j].POSITION) {
                    case 3: 
                        aParameters.push({ PARAMETER_NAME: oEventParameters[j].PARAMETER_NAME, PARAMETER_VALUE: oRow.PARAMETER3});
                        break;
                    case 2: 
                        aParameters.push({ PARAMETER_NAME: oEventParameters[j].PARAMETER_NAME, PARAMETER_VALUE: oRow.PARAMETER2});
                        break;
                    case 1: 
                        aParameters.push({ PARAMETER_NAME: oEventParameters[j].PARAMETER_NAME, PARAMETER_VALUE: oRow.PARAMETER1})
                        break;
                    default:
                        break;                        
                }
            }
            
			}
			// call the procedure to create predefined event
            var result = proc.prCreateDerivedEvent({ I_TEMPLATE_ID: oRow.TEMPLATE_ID, IT_PARAMETERS: aParameters });
            if (!result) {
                throw "Error creating derived event from Templated ID: " + data[i].TEMPLATE_ID;
            } else { 
            // Create Job schedule
                if (result.O_EVENT_ID) {
                	try {
                		var apiResult =  EventJob.deactivateEvent(result.O_EVENT_ID);
                      	if (!apiResult) $.trace.error("ERROR: createDerivedEvent - job not scheduled");
                	} catch (e) {
                		$.trace.error("ERROR: createDerivedEvent - EventAPI " + (e.message || e) );
                	}
                }
                //Get New Event
                return Utils.getImportEntitiesWithTablePromise([],"Event.New","sap.cri.model.adm::CV_PREDEFINED_EVENTS_CONFIG", result, findObj.tx);
            }
	}).then(function(importObj){
		var NewEvent = importObj.entities[0];
		return Utils.getTxGetPromise(NewEvent, {ID: importObj.result.O_EVENT_ID}, importObj.tx);
	}).then(function(getObj){
		var oNewEvent = getObj.entity;
        return Utils.getTxSavePromise(oNewEvent, getObj.tx);
	}).then(function(tx) {
			//save successful, close tx
			$.trace.debug('Saved');
			tx.$close();
		}).catch((error) => {
			//throw critical, log warnings
			throw "ERROR: createDerivedEvent - " + (e.message || e) ;
		});
    
    } catch (e) {
        $.trace.error("ERROR: createDerivedEvent - " + (e.message || e) );
    } finally {
        pStmt.close();
    }

};

/**
 * Update Exit for Predefined Events
 * @param param
 * @returns
 */
function updateDerivedEvent(param) {

    let before	= param.beforeTableName;
    let after 	= param.afterTableName;
    let pStmt 	= param.connection.prepareStatement('select * from "' + after +'"');
    // Get Input Data from OData Create
    var data 	= Utils.recordSetToJSON(pStmt.executeQuery(),'Event')['Event'];
    // GET entity	
	var promiseImportEntities = Utils.getImportEntitiesPromise(["db.cds::adm.config.event.name"]);
    // Set XSDS Entity
    // var EventConfig = XSDS.$getEntity("sap.cri.db::adm.config.event.name");
    var oEventConfig;
    var apiResult; 
    try{
    	var oRow = data[0];
    	promiseImportEntities.then(function(entities) {
			var Event = entities["db.cds::adm.config.event.name"];
			return Utils.getTxPromise([Event]);
		}).then(function(txObj) {
			switch (oRow.JOB_STATUS.toUpperCase()) {
	    	case 'ENABLE':
	    	case 'ACTIVATE':
	    	case 'ACTIVE':
				apiResult = EventJob.activateEvent(oRow.ID);
				break;
	
	    	case 'DISABLE':
	    	case 'DEACTIVATE':
	    	case 'INACTIVE':
				apiResult = EventJob.deactivateEvent(oRow.ID);
				break;
		}
			return Utils.getTxFindPromise(txObj.entities[0], {
				EVENT_ID: oRow.ID
			}, txObj.tx);
		}).then(function(findObj) {
			// get the first entity returned with same key & update its fields
			if (findObj.entities.length > 0) {
				var oEventConfig = findObj.entities[0];
				oEventConfig.CHANGED_ON = new Date();
            	oEventConfig.CHANGED_BY = $.session.getUsername();
			}
			return Utils.getTxSavePromise(oEvent, findObj.tx);
		}).then(function(tx) {
				//save successful, close tx
				$.trace.debug('Saved');
				tx.$close();
		}).catch((error) => {
				//throw critical, log warnings
				throw "ERROR: updateDerivedEvent" + (error.message || error);
		});
    } catch (e) {
        $.trace.error("ERROR: updateDerivedEvent " + (e.message || e) );
    } finally {
        pStmt.close();
    }
   
};

function _eventFromTemplate (templateId, parameters) {
    $.trace.debug("START: _eventFromTemplate");




    $.trace.debug("END: _eventFromTemplate");
}