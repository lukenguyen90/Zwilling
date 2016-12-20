component persistent="true" {
    property name="import_sap_detail_id" fieldtype="id" generator="native" setter="false";
    property name="order_no"       ormtype="string";
    property name="position_no"      ormtype="string";
    property name="supplier_no"       ormtype="string";
    property name="item_no"     ormtype="string";
    property name="order_quantity"     ormtype="string";
    property name="expected_shipping_date"       ormtype="string" ;
    property name="ab_no"         ormtype="string";
    property name="ab_quantity"           ormtype="string";
    property name="confirmed_shipping_date"       ormtype="string";
    property name="unit_price"          ormtype="string";
    property name="currency"           ormtype="string";
    property name="order_date"       ormtype="string";
    property name="purchaser"       ormtype="string";
    property name="planner"       ormtype="string";
    property name="deletion"       ormtype="string";
    property name="za_date"       ormtype="string";
    property name="shipping_date"       ormtype="string";
    property name="shipped_quantity"       ormtype="string";
    property name="import_sap_id"       ormtype="integer";
    property name="status"       ormtype="integer";
    property name="message"       ormtype="string";
}
