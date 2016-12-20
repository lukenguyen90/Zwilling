component {

	function getImportSap(numeric userid) {
		var sql = "select * from import_sap_history order by created_time desc limit 10";
		return queryExecute(sql);
	}

	function getImportHistoryDetail(numeric importid) {
		var paramset ={};
		var sql = "select imhd.*,
					pl.product_line_name_english as product_line,
					pi.product_item_name_english as product_item_name  
		from import_sap_detail_history imhd 
		left join product_item pi on imhd.item_no = pi.SAPID and pi.active = 1 
		left join product_line pl on pi.product_line_no = pl.product_line_no and pl.active = 1 
		where imhd.import_sap_id = :importid";
		paramset['importid'] = {value=importid, CFSQLType="integer"};
		return queryExecute(sql, paramset);
	}

	function getImportHistoryDetailById(numeric detailid) {
		var paramset ={};
		var sql = "select * from import_sap_detail_history  
					where import_sap_detail_id = :detailid";
		paramset['detailid'] = {value=detailid, CFSQLType="integer"};
		return queryExecute(sql, paramset);
	}

	function getHistorySapLastDate() {
		var sql = "select  max(created_time) as created_time from import_sap_history";
		return queryExecute(sql);
	}
}