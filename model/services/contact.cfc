/**
*
* @file  /E/Projects/zwilling_v2/model/services/contact.cfc
* @author  dieu.le
* @description contactService
*
*/

component {

	public function init(){
		return this;
	}

	function getListCompanyNo(){
		var company = QueryExecute("SELECT  gildemeisterid,
											name
									FROM company
									where active = 1 ");
		return company;
	}

	function getContactByBuyerNo(string buyerno) {
		var paramset={};
		var sql = "select * from contact 
					where buyer_no = :buyerno and active = 1 ";
		paramset['buyerno'] = {value=buyerno, CFSQLType="string"};
		return queryExecute(sql, paramset);
	}
}