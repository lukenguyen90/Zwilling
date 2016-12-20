component persistent="true" {
    property name="import_sap_id" fieldtype="id" generator="native" setter="false";
    property name="created_time"       ormtype="timestamp";
    property name="success"       ormtype="integer";
    property name="fail"   ormtype="integer";
}
