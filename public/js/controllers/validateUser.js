
app.controller('validateUser',function ($scope, $http, $location,$window) {
    $scope.user="";
    $scope.login=function() {
        var body = {
            name : $scope.user,
            password : $scope.password
        };
        $http({
			method : 'POST',
			url    : '/login',
			headers: {'Content-Type':'application/json'},
			data   : angular.fromJson(body)
		}).then(function(response){
            body.name="";
            body.password="";
            $window.location.href="http://localhost:8000/";
           //$http.get('/index');
          /* $http({
               method:'GET',
               url:'/index'
           }).then(function(response){
               console.log(response);
           });*/
        });
    };
});