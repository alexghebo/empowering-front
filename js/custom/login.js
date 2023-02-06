$(document).ready(function () {
  $("form#submit-login").on("submit", function (e) {
    e.preventDefault();
    let email = $("#email").val();
    let password = $("#password").val();

    if (email != null && password != "") {
      $.ajax({
        type: "post",
        url: baseUrl + "/api/auth/login",
        contentType: "application/json",
        data: JSON.stringify({
          email: email,
          password: password
        }),
        success: function (data) {
          console.log(data);

          if (data.active == "true") {
            //get user auth token
            $.removeCookie("authToken");
            $.removeCookie("authEmail");
            $.removeCookie("authUserId");
            $.removeCookie("authName");
            $.removeCookie("authMobile");
            $.removeCookie("registeredAt");
            $.cookie("authToken", data.token);
            $.cookie("authEmail", email);
            $.cookie("authUserId", data.userId);
            $.cookie("authName", data.name);
            $.cookie("authRole", data.role);
            $.cookie("registeredAt", data.registeredAt);
            window.location.href = frontendBaseUrl + "/index.html";
            return true;
          } else {
            console.log(data);
            console.log(data.active);
            alert("Your account has not been validated! Check the mail.");
          }
        },
        error: function (err) {
          alert(err.responseJSON.message);
        }
      });
    }
  });
});
//# sourceMappingURL=login.js.map