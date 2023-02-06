$(document).ready(function () {
  var urlParams = new URLSearchParams(window.location.search);
  var userId = urlParams.get("userId");
  var groupId = urlParams.get("groupId");
  $(".btn-primary").on("click", function () {
    $.ajax({
      type: "POST",
      url: baseUrl + "/api/users/" + groupId + "/members",
      data: JSON.stringify({
        userId
      }),
      contentType: "application/json",
      success: function () {
        window.location.href = "login.html";
      }
    });
  });
});
//# sourceMappingURL=accept-invitation.js.map