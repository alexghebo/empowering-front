$(document).ready(function () {
  logout();
  var authToken = $.cookie("authToken");

  if (authToken == undefined || authToken == null) {
    $(".show-profile-header-info").hide();
  } else {
    $(".show-header-login-button").hide();
  }

  function logout() {
    $("a#logout-button").on("click", function (e) {
      e.preventDefault();
      $.removeCookie("authToken");
      $.removeCookie("authEmail");
      $.removeCookie("authUserId");
      $.removeCookie("authName");
      $.removeCookie("authMobile");
      $.removeCookie("authName");
      window.location.href = "login.html";
    });
  }
});
//# sourceMappingURL=navbar.js.map