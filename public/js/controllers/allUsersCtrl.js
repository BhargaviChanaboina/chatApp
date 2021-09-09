// eslint-disable-next-line no-undef
// eslint-disable-next-line prefer-arrow-callback
// eslint-disable-next-line func-names
// eslint-disable-next-line prefer-arrow-callback
app.controller('allUsersCtrl', function ($scope, $http, $location, $window) {
  $scope.name = '';
  $scope.addRmsg = '';
	console.log('hello in all users ctrl');
  $scope.users = [];
  $scope.selectedUser = '';
  $http({
    method: 'GET',
    url: '/users/usersList',
  }).then((response) => {
    $scope.users = response.data;
  }, (err) => {
    console.log('err', err);
  });
});
