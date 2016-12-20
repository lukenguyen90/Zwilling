'use strict';

appServices.factory('todoService',function(ENV,$resource,$log,$http){
    var api         = ENV.domain + 'todo.execute/:id';
    
    var resource    = $resource(api,null,{
        'update' : {method:'PUT'}
    });

    return {
        getAll : function(){
            return resource.query({},function(res){
                return res
            });
        },
        save : function(todo){
            return resource.save({},todo);
        },
        edit : function(todo){
            return resource.update({},todo);
        }
    };
     function handeSuccess(res){
         return res.data;
     }
     function handeError(res){
         return function(){
             return {success:false,message:res.data['message']||'Error when get Location'};
         }
     }
});
