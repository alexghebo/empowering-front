$(document).ready(function () {
  let userId = $.cookie("authUserId");
  let authToken = $.cookie("authToken");
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/" + userId,
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (data) {
      var firsName = data.name;
      var lastName = data.name;
      var name = firsName + " " + lastName;
      var groupType = data.userType;
      $(".group-name").html(name);

      if (groupType === "INFORMAL_GROUP") {
        $(".group-type").html("Informal group");
      } else if (groupType === "NGO") {
        $(".group-type").html("NGO");
      } else if (groupType === "PUBLIC_INSTITUTION") {
        $(".group-type").html("Public Institution");
      } else {
        $(".group-type").html("USER TYPE NOT SET");
      }

      var city = data.locationCity;
      var country = data.locationCountry;
      var location = city + ", " + country;
      $(".group-location").html(location);
      var email = data.email;
      $(".group-email").html(email);

      for (var i = 0; i < data.domains.length; i++) {
        var userGroupDomainBadge = `<span class="badge badge-pill badge-secondary ml-2">${data.domains[i].name}</span>`;
        $(".group-domains").append(userGroupDomainBadge);
      }

      let connections = data.connections;

      if (connections.length > 0) {
        var userMemberTemplate = $("#user-member");
        userMemberTemplate.hide();

        for (var i = 0; i < connections.length; i++) {
          userMemberTemplate.clone().prependTo(".user-members").show();
          userMemberTemplate.find("#user-member-name").html(connections[i].name);
        }
      } else {
        $(".user-members").html("You don't have any members yet").addClass("p-3");
      }
    }
  });
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/" + userId + "/members",
    headers: {
      Authorization: "Bearer " + authToken
    },
    contentType: "application/json",
    success: function (membersGroup) {
      console.log(membersGroup);

      if (membersGroup.length > 0) {
        var userMemberTemplate = $("#user-member-group");
        userMemberTemplate.hide();

        for (var i = 0; i < membersGroup.length; i++) {
          userMemberTemplate.clone().prependTo(".user-members-group").show();
          userMemberTemplate.find("#user-member-name-group").html(`<a href="user-profile-view.html?userId=${membersGroup[i]}">
                ${membersGroup[i].name}
              </a>`);
        }
      } else {
        $(".user-members-group").html("You don't have any members yet").addClass("p-3");
      }
    }
  });
});
//# sourceMappingURL=group-profile.js.map