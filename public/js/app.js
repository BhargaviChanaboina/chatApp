// eslint-disable-next-line no-undef
const app = angular.module('chatApp', ['ngRoute', 'appRoutes']);

app.controller('appCtrl', function ($scope, $http, $rootScope, $location, $window) {
  // eslint-disable-next-line no-unused-expressions
  $http({
    method: 'GET',
    url: '/users/isAdmin',
  })
    .then((response) => {
      console.log(response);
      $scope.isAdmin = response.data;
    })
    .catch((e) => console.log(e));
  $rootScope.loc = $location.url();
  $scope.logout = () => {
    $http({
      method: 'GET',
      url: '/logout',
    }).then(() => {
      $window.location.href = 'http://localhost:8000/login';
    }, (err) => {
      console.log('err', err);
    });
  };
});

app.run(($rootScope, $location) => {
  $rootScope.$on('$locationChangeStart', () => {
    $rootScope.loc = $location.url();
  });
});
