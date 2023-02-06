$(document).ready(function () {
  sortConnections();
  deleteConnection();
  var authToken = $.cookie("authToken");

  if (window.location.href.indexOf("userId=") > -1) {
    var urlParams = new URLSearchParams(window.location.search);
    var userId = urlParams.get("userId");
    listConnections(userId, authToken);
    getUserProfileInfo(userId, authToken);
  } else {
    var userId = $.cookie("authUserId");
    listConnections(userId, authToken);
    getUserProfileInfo(userId, authToken);
  }

  async function getUsersInfo(userIds) {
    var authToken = $.cookie("authToken");
    $.ajax({
      type: "GET",
      url: baseUrl + "/api/users/" + userIds,
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + authToken
      },
      crossDomain: true,
      success: function (response) {
        var userIdConnect = response.userId;
        var userCity = response.locationCity;
        var userCountry = response.locationCountry;
        var userType = response.userType;
        var usersName = response.name;
        var userDomains = [];

        for (var j = 0; j < response.domains.length; j++) {
          userDomains.push(response.domains[j].name);
        }

        var connectionPictures = ``;
        var connectionPic = response.profilePicture;

        if (response.profilePicture) {
          connectionPictures = `
          <div class="image-connection-wrapper">
            <a class="h-100 w-100" href="user-profile-view.html?userId=${response.userId}" class="h-100 w-100">
              <img class="image-invitation d-block" src="https://api.youth-initiatives.com/api/attachments/${connectionPic}" alt="connection picture">
            </a>
          </div>`;
        } else {
          connectionPictures = `
          <div class="image-connection-wrapper">
            <a class="h-100 w-100" href="user-profile-view.html?userId=${response.userId}" class="h-100 w-100">
              <img class="image-invitation d-block" src="https://via.placeholder.com/80 " alt="connection picture">
            </a>
          </div>`;
        }

        var connectionTemplate = `
            <div class="col-md-6 h-100" id="connections-filter">
            <div class="border border-secondary mt-3 h-100 position-relative">
              <div class="row no-gutters">
              <div class="col-12 col-md-auto p-3">${connectionPictures}</div>
              <div class="card-body col p-3">
                  <a href="user-profile-view.html?userId=${userIdConnect}">
                    <p class="card-title name font-weight-bold p-0 m-0">${usersName}</p>
                  </a>
                  <p class="location text-muted p-0 m-0"><i class="cil-location-pin">${userCity}, ${userCountry}</i></p>
                    <p class="mb-0 domains">${userDomains.join(", ")}</p>
             </div>
              </div>
            </div>
            <button class="bg-transparent button-edit-connection position-absolute border-0" type="button" data-toggle="dropdown" data-id="${userIdConnect}">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <defs>
                  <style>
                    .stroke {
                      fill: none;
                      stroke: transparent;
                    }

                    .b {
                      fill: #808e9b;
                    }
                  </style>
                </defs>
                <g transform="translate(-1318 -447)">
                  <rect class="stroke" width="32" height="32" rx="4" transform="translate(1318 447)"></rect>
                  <circle class="b" cx="2" cy="2" r="2" transform="translate(1326 461)"></circle>
                  <circle class="b" cx="2" cy="2" r="2" transform="translate(1332 461)"></circle>
                  <circle class="b" cx="2" cy="2" r="2" transform="translate(1338 461)"></circle>
                </g>
              </svg>
            </button>
            <div class="dropdown-menu">
              <a class="dropdown-item" id="delete-user" data-connection-id="${userIdConnect}">Delete user</a>
            </div>`;

        if (userType === "SINGLE_USER") {
          $(".single-user-connections").append(connectionTemplate);
        } else if (userType === "INFORMAL_GROUP") {
          $(".my-groups-connections").append(connectionTemplate);
        } else if (userType === "NGO") {
          $(".ngos-connections").append(connectionTemplate);
        } else if (userType === "PUBLIC_INSTITUTION") {
          $(".public-institutions-connections").append(connectionTemplate);
        }
      }
    });
  }

  function listConnections(userId, authToken) {
    $.ajax({
      url: baseUrl + "/api/users/" + userId,
      type: "GET",
      headers: {
        Authorization: "Bearer " + authToken
      },
      success: function (response) {
        if (userId !== $.cookie("authUserId")) {
          $(".username-connections").html(response.name + "'s connections");
        }

        var userIds = [];

        for (var i = 0; i < response.connections.length; i++) {
          userIds.push(response.connections[i].userId);
        }

        if (userIds.length) {
          for (var i = 0; i < userIds.length; i++) {
            if (userIds[i] === $.cookie("authUserId")) {
              continue;
            }

            getUsersInfo(userIds[i]);
          }
        } else {
          if (userType === "SINGLE_USER") {
            $(".single-user-connections").append("You don't have any connections");
          } else if (userType === "INFORMAL_GROUP") {
            $(".my-groups-connections").append("You don't have any connections");
          } else if (userType === "NGO") {
            $(".ngos-connections").append("You don't have any connections");
          } else if (userType === "PUBLIC_INSTITUTION") {
            $(".public-institutions-connections").append("You don't have any connections");
          }
        }
      }
    });
  }

  function deleteConnection() {
    $(document).on("click", "a#delete-user", function () {
      let userId = $.cookie("authUserId");
      let authToken = $.cookie("authToken");
      var connectionId = $(this).attr("data-connection-id");
      $.ajax({
        type: "DELETE",
        url: baseUrl + "/api/users/" + userId + "/connection/" + connectionId,
        contentType: "application/json",
        headers: {
          Authorization: "Bearer " + authToken
        },
        crossDomain: true,
        success: function (response) {
          location.reload(true);
        }
      });
    });
  }

  function sortConnections() {
    $(document).on("keyup", "input#filterConnections", function () {
      var value = $(this).val().toLowerCase();
      $(".single-user-connections").children().each(function () {
        var name = $(this).text().toLowerCase();
        $(this).toggle(name.toLowerCase().indexOf(value) > -1);
      });
      $(".my-groups-connections").children().each(function () {
        var nameGroup = $(this).text().toLowerCase();
        $(this).toggle(nameGroup.toLowerCase().indexOf(value) > -1);
      });
      $(".ngos-connections").children().each(function () {
        var nameNGO = $(this).text().toLowerCase();
        $(this).toggle(nameNGO.toLowerCase().indexOf(value) > -1);
      });
      $(".public-institutions-connections").children().each(function () {
        var namePInstitution = $(this).text().toLowerCase();
        $(this).toggle(namePInstitution.toLowerCase().indexOf(value) > -1);
      });
    });
  }
});

function getUserProfileInfo(userId, authToken) {
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/" + userId,
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (data) {
      // display user name
      $(".user-name").html(data.name);
      $("h6#post-username").html(data.name); // display user type

      let userType = data.userType;

      if (userType === "SINGLE_USER") {
        $(".user-type").html("Single user");
      } else if (userType === "INFORMAL_GROUP") {
        $(".user-type").html("Informal group");
      } else if (userType === "NGO") {
        $(".user-type").html("NGO");
      } else if (userType === "PUBLIC_INSTITUTION") {
        $(".user-type").html("Public institution");
      } else {
        $(".user-type").html("USER TYPE NOT SET");
      } // display user location


      $(".user-location").html(data.locationCity + ", " + data.locationCountry); // display user-email

      if (data.showEmail) {
        $(".user-email").html(data.email);
      } else {
        $(".user-email").hide();
      } // display modal infos


      $("input#edit-details-firstname").val(data.name);
      $("input#edit-details-lastname").val(data.name);
      $("input#edit-details-country").val(data.locationCountry);
      $("input#edit-details-city").val(data.locationCity); // get user profile picture

      if (data.profilePicture) {
        $("img.profile-picture").attr("src", "https://api.youth-initiatives.com/api/attachments/" + data.profilePicture);
        $(".profile-picture-post img").attr("src", "https://api.youth-initiatives.com/api/attachments/" + data.profilePicture);
        $(".d-none-if-picture-not-exists").addClass("d-none");
        var imgWidth = $("img.profile-picture").width();
        var imgHeight = $("img.profile-picture").height();

        if (imgWidth > imgHeight) {
          $("img.profile-picture").css("width", "100%");
        } else {
          $("img.profile-picture").css("height", "100%");
        }
      } else {
        $(".profile-placeholder").removeClass("d-none");
        $(".profile-pic").addClass("d-none");
        $(".profile-picture-post").addClass("d-none");
      }
    }
  });
}
//# sourceMappingURL=connections-single-user.js.map