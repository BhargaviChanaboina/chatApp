// eslint-disable-next-line no-undef
app.controller('signupCtrl', function ($scope, $http) {
  // $scope.name="";
  $scope.addRmsg = '';

  $scope.addUser = (s) => {
    console.log(s.name);
    const student = {
      name: s.name,
      password: s.password,
      email: s.email,
    };
    $http({
      method: 'POST',
      url: '/users/signup',
      headers: { 'Content-Type': 'application/json' },
      // eslint-disable-next-line no-undef
      data: angular.fromJson(student),
    }).then((response) => {
      // eslint-disable-next-line eqeqeq
      if (response.data.m == 'exists') {
        $scope.addRmsg = 'user already exists';
      } else {
        $scope.addRmsg = 'Successfully Added';
        s.name = '';
        s.password = '';
        s.email = '';
      }
    });
  };
});
