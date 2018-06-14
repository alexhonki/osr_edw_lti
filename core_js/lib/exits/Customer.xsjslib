$.import("exits", "Utils");
var Utils = $.exits.Utils;
var conn  = $.db.getConnection();
var STATUS = {
		UNBLOCK	: 0,
		BLOCK	: 1,
		DFLAG	: 2,
		DELETED	: 3,
		DERROR	: 4
};
/**
 * Exit for Updating Customer
 * @param param Customer object
 */ 
function updateCustomer(param) {
	$.trace.debug('Update Customer exit called'); 
	let after 	= param.afterTableName;  
	let before 	= param.beforeTableName; 
	let pStmt 	= param.connection.prepareStatement('select * from "' + after + '"');
	let pStmt_block = param.connection.prepareStatement('SELECT "sequences::AdminCustomerBlock".NEXTVAL as "NEW_ID" FROM "synonyms::dummy"' );
	let pStmt_delete = param.connection.prepareStatement('SELECT "sequences::AdminCustomerDelete".NEXTVAL as "NEW_ID" FROM "synonyms::dummy"' );
	
	// Get Input Data from OData Create
	var data = Utils.recordSetToJSON(pStmt.executeQuery(),'CustomerBlock');
	var newID_delete = Utils.recordSetToJSON(pStmt_delete.executeQuery(),'NewID');
	var newID_block = Utils.recordSetToJSON(pStmt_block.executeQuery(),'NewID');
	// GET BLOCKED DATA, CUSTOMER DATA, CUSTOMER DELETE DATA
	var promiseImportEntities = Utils.getImportEntitiesPromise([
		"db::adm.Customer.Block",
		// "db::app.Customer",
		"db::adm.Customer.Delete"]);
	
	try {
		var oRow = data.CustomerBlock[0];
		
		promiseImportEntities.then(function(entities) {
			var CustomerBlock = entities["db::adm.Customer.Block"];
			var CustomerDelete = entities["db::adm.Customer.Delete"];
			return Utils.getTxPromise([CustomerBlock,CustomerDelete]);
		}).then(function(txObj){
			return Promise.all([
				Utils.getTxFindPromise(txObj.entities[0], {CUST_ID: oRow.CUST_ID}, txObj.tx),//customerblock
				Utils.getTxFindPromise(txObj.entities[1], {CUST_ID: oRow.CUST_ID}, txObj.tx)]);//customerdelete                        
		}).then(function(aValues){
			var oCustomer,oCustomerDelete, oCustomerBlock, tx;
			oCustomerBlock = aValues[0].entities[0];
			oCustomerDelete = aValues[1].entities[0];
			tx = aValues[0].tx;
			$.trace.debug('Check Deleted');
			if(oCustomerDelete && oCustomerDelete.STATUS === STATUS.DELETED){ 
				throw "Customer Deleted";
			}
			$.trace.debug('Check Blocked');
		
			if (oCustomerBlock) {
				oCustomerBlock.isToBeDeleted = false;
				switch (oRow.STATUS) {
					case STATUS.UNBLOCK:
						oCustomerBlock.STATUS 			= oRow.STATUS;
						oCustomerBlock.UNBLOCKED_BY		= $.session.getUsername();
						oCustomerBlock.UNBLOCKED_DATE	= new Date();
						oCustomerBlock.isChanged		= false;
						oCustomerBlock.isToBeDeleted = true;
						break;
			
					default:
						throw "Unknown status flag"
				}
			} else {
				switch (oRow.STATUS) {
					case 0:
					case 1:
						$.trace.debug('Update Status ' + oRow.STATUS);
						// Create new Queue Entry
						oCustomerBlock = { 
							$entity 		: aValues[0].entityType,
							ID				: newID_block.NewID[0].NEW_ID,
						    CUST_ID			: oRow.CUST_ID,
						    BLOCKED_BY		: oRow.STATUS === 1 ? $.session.getUsername() : '' ,
							BLOCKED_DATE	: oRow.STATUS === 1 ? new Date() : undefined,
						    UNBLOCKED_BY	: oRow.STATUS === 0 ? $.session.getUsername() : '' ,
							UNBLOCKED_DATE	: oRow.STATUS === 0 ? new Date() : undefined,	
						    STATUS			: oRow.STATUS === 0 ? 0 : 1
						};	
						oCustomerBlock.isChanged = true;
						break;
					case 2:
						if (oCustomerDelete) {
							oCustomerDelete.STATUS 			= 2; //data.CustomerBlock[i].STATUS;
							oCustomerDelete.DELETED_BY 		= $.session.getUsername();
							oCustomerDelete.DELETED_DATE	= new Date();
						} else {
							// Create new Queue Entry
							oCustomerDelete = { 
								$entity 		: aValues[1].entityType,
								ID				: newID_delete.NewID[0].NEW_ID,
							    CUST_ID			: oRow.CUST_ID,
							    DELETED_BY		: $.session.getUsername() ,
							    DELETED_DATE	: new Date(),	
							    STATUS			: 2 //data.CustomerDelete[i].STATUS == 0 ? 0 : 1
							};
							oCustomerDelete.isChanged = true;
						}
						break;
				}
			}
			if(oCustomerBlock && oCustomerBlock.isToBeDeleted){
				$.trace.debug('Deleting Entities')
				var aDeletingEntities = [];
				aDeletingEntities.push(oCustomerBlock);
				return  Utils.getTxDeletePromise(aDeletingEntities, {CUST_ID: oRow.CUST_ID},tx);
			}
			else
			{
				$.trace.debug('Saving Entities');
				var aSavingEntities = [];
				if(oCustomerDelete && oCustomerDelete.isChanged){
					aSavingEntities.push(oCustomerDelete);
			}

			if(oCustomerBlock && oCustomerBlock.isChanged){
				aSavingEntities.push(oCustomerBlock);
			}
			return Utils.getTxSaveAllPromise(aSavingEntities,tx);  
			}
			
		}).then(function(tx){
			//save successful, close tx
				$.trace.debug('Saved');
				tx.$close();
		}).catch((error) => {
				//throw critical, log warnings
				throw "Execution Error: " + (error.message || error);
		});
	} catch(e) {
		throw "Execution Error: " + JSON.stringify(e);
	} finally {
		pStmt.close();
	}
};
