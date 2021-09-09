/* eslint-disable prefer-arrow-callback */
app.controller('editUserCtrl', function($scope, $http, $routeParams, $location, $window) {
  const userId = $routeParams.id;
  $scope.currentUser = {};
	console.log('hello in get users ctrl');
  $http({
    method: 'GET',
    url: `/users/usersList?id=${userId}`,
  }).then((response) => {
    $scope.currentUser = response.data[0];
  }, (err) => {
    console.log('err', err);
  });
  $scope.updateUser = function () {
    console.log($routeParams.id, '................');
    console.log($scope.currentUser);
    $http({
      method: 'PATCH',
      url: `/users/edit/${$routeParams.id}`,
      data: angular.fromJson($scope.currentUser),
    }).then((response) => {
      $scope.addRmsg = response.data;
    }, (err) => {
      console.log('err', err);
    });
  };
});
