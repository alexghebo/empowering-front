$("#reset-password").on("click", function (e) {
  e.preventDefault();
  var email = $("#email-forgot-password").val();

  if (email !== "") {
    data = {
      subject: "Resetare parola",
      text: "Noua ta parola este: {password}",
      to: email
    };
    $.ajax({
      url: baseUrl + "/api/users/reset-password",
      type: "POST",
      data: JSON.stringify(data),
      contentType: "application/json",
      success: function (response) {
        window.location.href = "login.html";
      },
      error: function (e) {
        alert(e.statusText);
      }
    });
  } else {
    alert("error2");
  }
});
//# sourceMappingURL=forgot-password.js.map