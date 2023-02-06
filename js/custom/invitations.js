$(document).ready(function () {
  sortInvitations();
  $(function () {
    $("button#confirm-request").click(function () {});
  });
  let userId = $.cookie("authUserId");
  let authToken = $.cookie("authToken");
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/" + userId,
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (data) {
      var connectionRequests = data.connectionRequests;
      var sentInvitations = data.sentConnectionRequests;
      var sentInvitationsUserIds = [];
      var userIds = [];

      for (var i = 0; i < connectionRequests.length; i++) {
        userIds.push(data.connectionRequests[i].userId);
      }

      for (var i = 0; i < userIds.length; i++) {
        getUsersInfo(userIds[i]);
      }

      for (var i = 0; i < sentInvitations.length; i++) {
        sentInvitationsUserIds.push(sentInvitations[i].userId);
      }

      for (var i = 0; i < sentInvitationsUserIds.length; i++) {
        getUserSentInvitations(sentInvitationsUserIds[i]);
      }
    }
  });

  async function getUserSentInvitations(userIds) {
    $.ajax({
      type: "GET",
      url: baseUrl + "/api/users/" + userIds,
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + authToken
      },
      crossDomain: true,
      success: function (response) {
        var userIdInvitation = response.userId;
        var userCity = response.locationCity;
        var userCountry = response.locationCountry;
        var userType = response.userType;
        var usersName = response.name;
        var userDomains = [];

        for (var j = 0; j < response.domains.length; j++) {
          userDomains.push(response.domains[j].name);
        }

        var profPic = ``;
        var userProfilePicture = response.profilePicture;

        if (response.profilePicture) {
          profPic = `
          <div class="image-invitation-wrapper">
            <a class="h-100 w-100" href="user-profile-view.html?userId=${userIdInvitation}">
              <img class="image-invitation" src="https://api.youth-initiatives.com/api/attachments/${userProfilePicture}" alt="invitation picture">
            </a>
          </div>`;
        } else {
          profPic = `
          <div class="image-invitation-wrapper">
            <a class="h-100 w-100" href="user-profile-view.html?userId=${userIdInvitation}">
              <img class="image-invitation" src="https://via.placeholder.com/80 " alt="invitation picture">
            </a>
          </div>`;
        }

        var sentInvitationTemplate = `
        <div class="user-connection-request">
          <div class="col-12 row align-items-center justify-content-between">
              <div class="col-12 col-md-7 border border-secondary d-flex mt-3 justify-content-between py-3">
                <div class="card-content row align-items-center justify-content-center w-100 pr-0 mr-0 responsive-invitations-card">
                  <div class="col-auto m-0">${profPic}</div>
                  <div class="card-body col-12 col-md text-center text-md-left">
                    <a href="user-profile-view.html?userId=${userIdInvitation}">
                      <p class="card-title name font-weight-bold p-0 m-0">${usersName}</p>
                    </a>
                    <p class="location text-muted p-0 m-0"><i class="cil-location-pin">${userCity}, ${userCountry}</i></p>
                    <p class="domains p-0 m-0">${userDomains.join(", ")}</p>
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-5 d-flex justify-content-md-end justify-content-center pt-3 pt-md-0">
                <div class="div content-buttons" id="status">
                  <span class="d-none">user connected</span>
                  <button class="btn btn-sm btn-outline-dark" id="delete-sent-invitation" type="button" data-sent-invitation-id="${userIds}">Delete request</button>
                </div>
              </div>
            </div>
            </div>`;
        $(".sent-invitation-requests").append(sentInvitationTemplate);
      }
    });
  }

  $(document).on("click", "button#delete-sent-invitation", function () {
    let userId = $.cookie("authUserId");
    let authToken = $.cookie("authToken");
    var requesterId = $(this).attr("data-sent-invitation-id");
    $.ajax({
      type: "DELETE",
      url: baseUrl + "/api/users/" + userId + "/requestConnection/" + requesterId,
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + authToken
      },
      crossDomain: true,
      success: function (response) {}
    });
    $(this).parent().html("Request denied!");
  });

  async function getUsersInfo(userIds) {
    $.ajax({
      type: "GET",
      url: baseUrl + "/api/users/" + userIds,
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + authToken
      },
      crossDomain: true,
      success: function (response) {
        var userIdInvitation = response.userId;
        var userCity = response.locationCity;
        var userCountry = response.locationCountry;
        var userType = response.userType;
        var usersName = response.name;
        var userDomains = [];

        for (var j = 0; j < response.domains.length; j++) {
          userDomains.push(response.domains[j].name);
        }

        var profPic = ``;
        var userProfilePicture = response.profilePicture;

        if (response.profilePicture) {
          profPic = `
          <div class="image-invitation-wrapper">
            <a class="h-100 w-100" href="user-profile-view.html?userId=${userIdInvitation}">
              <img class="image-invitation" src="https://api.youth-initiatives.com/api/attachments/${userProfilePicture}" alt="invitation picture">
            </a>
          </div>`;
        } else {
          profPic = `
          <div class="image-invitation-wrapper">
            <a class="h-100 w-100" href="user-profile-view.html?userId=${userIdInvitation}">
              <img class="image-invitation" src="https://via.placeholder.com/80 " alt="invitation picture">
            </a>
          </div>`;
        }

        var connectUserTemplate = `
        <div class="user-connection-request">
          <div class="col-12 d-flex align-items-center justify-content-between pl-0">
              <div class="col-7 border border-secondary d-flex mt-3 justify-content-between py-1">
                <div class="card-content row align-items-center justify-content-center w-100">
                  <div class="col-12 col-md-auto m-0">${profPic}</div>
                  <div class="card-body col">
                    <a href="user-profile-view.html?userId=${userIdInvitation}">
                      <p class="card-title name font-weight-bold p-0 m-0">${usersName}</p>
                    </a>
                    <p class="location text-muted p-0 m-0"><i class="cil-location-pin">${userCity}, ${userCountry}</i></p>
                    <p class="domains p-0 m-0">${userDomains.join(", ")}</p>
                  </div>
                </div>
              </div>
              <div class="col-5 d-flex justify-content-end">
                <div class="div content-buttons" id="status">
                  <span class="d-none">user connected</span>
                  <button class="btn btn-sm btn-primary" id="confirm-request" type="button" data-connecting-user-id="${userIds}">Confirm</button>
                  <button class="btn btn-sm btn-outline-dark" id="delete-request" type="button" data-connecting-user-id="${userIds}">Delete request</button>
                </div>
              </div>
            </div>
            </div>
              `;

        if (userType === "SINGLE_USER") {
          $(".single-user-connection-requests").append(connectUserTemplate);
        } else if (userType === "INFORMAL_GROUP") {
          $(".users-connection-requests").append(connectUserTemplate);
        } else if (userType === "NGO") {
          $(".ngos-connection-requests").append(connectUserTemplate);
        } else if (userType === "PUBLIC_INSTITUTION") {
          $(".public-institutions-connection-requests").append(connectUserTemplate);
        }
      }
    });
  }
}); // confirm connections request

$(document).on("click", "#confirm-request", function () {
  let userId = $.cookie("authUserId");
  let authToken = $.cookie("authToken");
  var requesterId = $(this).attr("data-connecting-user-id");
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/" + userId + "/acceptConnection/" + requesterId,
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (response) {
      $("#status").html("connected");
    }
  });
  $(this).parent().html("User connected!");
}); // delete connections request

$(document).on("click", "#delete-request", function () {
  let userId = $.cookie("authUserId");
  let authToken = $.cookie("authToken");
  var requesterId = $(this).attr("data-connecting-user-id");
  $.ajax({
    type: "DELETE",
    url: baseUrl + "/api/users/" + userId + "/requestConnection/" + requesterId,
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (response) {
      alert("connection request deleted successfully!");
    }
  });
  $(this).parent().html("Request denied!");
});

function sortInvitations() {
  $(document).on("keyup", "input#filterInvitation", function () {
    var val = $(this).val().toLowerCase();
    $(".single-user-connection-requests").children().each(function () {
      var singleUser = $(this).text().toLowerCase();
      $(this).toggle(singleUser.toLowerCase().indexOf(val) > -1);
    });
    $(".users-connection-requests").children().each(function () {
      var myGroups = $(this).text().toLowerCase();
      $(this).toggle(myGroups.toLowerCase().indexOf(val) > -1);
    });
    $(".ngos-connection-requests").children().each(function () {
      var ngos = $(this).text().toLowerCase();
      $(this).toggle(ngos.toLowerCase().indexOf(val) > -1);
    });
    $(".public-institutions-connection-requests").children().each(function () {
      var publicInstitution = $(this).text().toLowerCase();
      $(this).toggle(publicInstitution.toLowerCase().indexOf(val) > -1);
    });
    $(".sent-invitation-requests").children().each(function () {
      var sentInvitation = $(this).text().toLowerCase();
      $(this).toggle(sentInvitation.toLowerCase().indexOf(val) > -1);
    });
  });
}
//# sourceMappingURL=invitations.js.map