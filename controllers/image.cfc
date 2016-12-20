/**
*
* @file  /E/Projects/zwilling_v2/controllers/image.cfc
* @author  dieu.le
* @description imageController
*
*/

component accessors="true"  {

	property imageService;
	public function init( required any fw){
		variables.fw = arguments.fw;
		return this;
	}

	 
	function uploadImages(){
		var data = deserializeJSON(GetHttpRequestData().content);

		variables.contentType = {
			 'image/jpeg': {extension: 'jpg'}
            ,'image/png': {extension: 'png'}
        };
        var valid 		= structKeyArray(#variables.contentType#);
        var filesize 	= data[1].filesize;
        var maxSize     = 2001000;
        var permitType 	= arrayContains(valid,data[1].fileType)
      
        var message = "Upload file only allow images, please try again!";
        var success = false;

        var arrayImageId    = [];
        var arrayFilename 	= [];
        
        if(arrayLen(data)<10 && permitType !=0 && filesize <maxSize){
            for(var i =1;i<=arrayLen(data);i++){
                
                var imageName = data[i].filename;
                var imagePath = "/fileUpload/images/"; 
                file action="write" file="#expandPath(imagePath)#/#imageName#" output="#toBinary(data[i].base64)#" 
                	addnewline="false" mode="777";
            

                    fileName  		= data[i].filename;
                    fileType  		= data[i].filetype;
                	// var inspectionid 	= data[i].inspectionid;
                    var fullPath 	= #imagePath#&#fileName#;
                    var updateby 	= data[i].updateby;
                    imageService.insertInfoImage( 	fileName
                    								,fullPath
                    								,updateby );
                    var IdCurrent   = imageService.getImageIdCurrent();

                    arrayAppend(arrayImageId, IdCurrent);
                    arrayAppend(arrayFilename,fileName);
                    
                }
                success = true;   
                variables.fw.renderData('JSON',{ 'success':success, 'imageId':arrayImageId,'filename':arrayFilename});
        }else{
        	var success = false;
    		var message = ' - Maximum file upload only 10 files </br> - File must follow format .JPG/PNG </br> - Maximum file size: 2MB';
    		variables.fw.renderData('JSON',{'message':message,'success':success});
        }
	}
	function getListImageByInspectionId(numeric inspectionid){
		var api = new api.general();
		var listImage = imageService.getListImageByInspectionReport(inspectionid);
		variables.fw.renderData('JSON',api.queryToArray(listImage));
	}
	function removeImage(numeric imageid) {

        var image        = entityLoad("image",imageid, true);
        
        var rootpath        = expandPath("/");
        if(!IsEmpty(image)){
            var pathimage = rootpath&image.getPath();
           
            if(fileExists(pathimage)){
                FileDelete(pathimage);
            }
        }
        entityDelete(image);
        variables.fw.renderData('JSON', {'id':image,'success':true});
    }

	function execute(){
		switch(cgi.request_method){
			case "GET":
				if(structKeyExists(URL, "inspectionid")){
					getListImageByInspectionId(URL.inspectionid);
					break;
				}
            case "DELETE":
                if(structKeyExists(URL, "image_id")){
                    removeImage(URL.image_id)
                    break;
                }
		}
	}
}