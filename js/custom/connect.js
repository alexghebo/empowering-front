$(document).ready(function () {
  let userId = $.cookie("authUserId");
  let authToken = $.cookie("authToken");
  showResources(authToken);
  myArea();
  $(function () {
    initSelectDomains();
  });
  $(document).on("click", "button#clear-filters", function () {
    clearAllFilters();
  });
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
      var connections = data.connections;
      var sentConnectionRequests = data.sentConnectionRequests;
      var singleUserTab = $(".single-users-available-connections");
      var groupsTab = $(".groups-available-connections");
      var ngoTab = $(".ngos-available-connections");
      var publicInstitutionsTab = $(".public-institutions-connections");
      getAvailableConnections(userId, "SINGLE_USER", singleUserTab, authToken, connectionRequests, connections, sentConnectionRequests);
      getAvailableConnections(userId, "INFORMAL_GROUP", groupsTab, authToken, connectionRequests, connections, sentConnectionRequests);
      getAvailableConnections(userId, "NGO", ngoTab, authToken, connectionRequests, connections, sentConnectionRequests);
      getAvailableConnections(userId, "PUBLIC_INSTITUTION", publicInstitutionsTab, authToken, connectionRequests, connections, sentConnectionRequests);
    }
  });
  var singleUserTab = $(".single-users-available-connections");
  var groupTab = $(".groups-available-connections");
  var ngoTab = $(".ngos-available-connections");
  var institutionTab = $(".public-institutions-connections");
  sortConnectionsByCity(singleUserTab, groupTab, ngoTab, institutionTab);
  sortConnectionsByCountry(singleUserTab, groupTab, ngoTab, institutionTab);
  sortConnectionsByAnyText(singleUserTab, groupTab, ngoTab, institutionTab);
  sortConnectionsByDomains(singleUserTab, groupTab, ngoTab, institutionTab);
  $(document).on("keyup", "input#cityFilter", function () {
    applyAllFlters(singleUserTab, groupTab, ngoTab, institutionTab);
  });
  $(document).on("keyup", "input#countryFilter", function () {
    applyAllFlters(singleUserTab, groupTab, ngoTab, institutionTab);
  });
  $(".connect-domains").on("change", function () {
    applyAllFlters(singleUserTab, groupTab, ngoTab, institutionTab);
  });
  $(document).on("keyup", "input#sortConnections", function () {
    applyAllFlters(singleUserTab, groupTab, ngoTab, institutionTab);
  });
  $(".nav-pills li a").click(function () {
    clearAllFilters();
  });
});

function getAvailableConnections(userId, userType, connectionsTab, authToken, connectionRequests, connections, sentConnectionRequests) {
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/" + userId + "/availableConnections/" + userType,
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (data) {
      if (data.length > 0) {
        var availableConnections = data;

        for (var i = 0; i < availableConnections.length; i++) {
          if (availableConnections[i].active === true) {
            var shouldExit = false;

            for (var j = 0; j < sentConnectionRequests.length; j++) {
              if (sentConnectionRequests[j].userId === availableConnections[i].userId) {
                shouldExit = true;
                break;
              }
            }

            if (shouldExit) {
              continue;
            }

            shouldExit = false;

            for (var j = 0; j < connectionRequests.length; j++) {
              if (connectionRequests[j].userId === availableConnections[i].userId) {
                shouldExit = true;
                break;
              }
            }

            if (shouldExit) {
              continue;
            }

            shouldExit = false;

            for (var k = 0; k < connections.length; k++) {
              if (connections[k].userId === availableConnections[i].userId) {
                shouldExit = true;
                break;
              }
            }

            if (shouldExit) {
              continue;
            }

            if (availableConnections[i].userId === userId) {
              continue;
            }

            var domains = [];

            for (var j = 0; j < availableConnections[i].domains.length; j++) {
              domains.push(availableConnections[i].domains[j].name);
            }

            var profilePic = ``;

            if (availableConnections[i].profilePicture) {
              profilePic = `
            <a href="user-profile-view.html?userId=${availableConnections[i].userId}" class="h-100 w-100">
              <img class="image-connection" src="https://api.youth-initiatives.com/api/attachments/${availableConnections[i].profilePicture}" alt="profile picture">
            </a>`;
            } else {
              profilePic = `
            <a href="user-profile-view.html?userId=${availableConnections[i].userId}" class="h-100 w-100">
              <img class="image-connection" src="https://via.placeholder.com/80 " alt="profile picture">
            </a>`;
            }

            var userMatchedTemplate = `
            <div class="col-12 row align-items-center container-card no-gutters">
              <div class="col-12 col-md-8 border border-secondary p-3 row mt-3 justify-content-between text-center text-md-left align-items-center ml-0">
                  <div class="col-12 col-md-auto m-0 d-flex justify-content-center pl-0">
                    <div class="connections-profile-picture"><p class="text-center text-md-left mb-0 h-100 w-100">${profilePic}</p></div>
                  </div>
                  <div class="card-body col">
                    <a href="user-profile-view.html?userId=${availableConnections[i].userId}" class="anchor-user-profile">
                      <p class="card-title name font-weight-bold p-0 m-0">${availableConnections[i].name}
                      </p>
                    </a>
                    <p class="location text-muted p-0 m-0"><i class="cil-location-pin"></i><span id="name-location">${availableConnections[i].locationCity}</span>, <span id="name-country"> ${availableConnections[i].locationCountry}</span></p>

                  <p class="domains p-0 m-0">${domains.join(", ")}</p>
                  </div>
              </div>
              <div class="col-12 col-md-4 d-flex justify-content-center justify-content-md-end mt-2 mt-lg-0">
                <button class="btn btn-primary" id="send-request" data-user-id="${availableConnections[i].userId}"><span>Connect </span></button>
              </div>
            </div>`;
            connectionsTab.append(userMatchedTemplate);
          }
        }
      } else {
        connectionsTab.html("<h4> You dont't have users matched </h4>").addClass("p-3");
      }
    }
  });
}

$(document).on("click", "#send-request", function () {
  let userId = $.cookie("authUserId");
  let authToken = $.cookie("authToken");
  var requesterId = $(this).attr("data-user-id");
  $.ajax({
    type: "POST",
    url: baseUrl + "/api/users/" + userId + "/requestConnection/",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + authToken
    },
    data: JSON.stringify({
      userId: requesterId
    }),
    crossDomain: true,
    success: function (response) {}
  });
  $(this).parent().html("Request sent");
});

function showResources(authToken) {
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/resources",
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (response) {
      var allResources = response;
      var contentResources = ``;

      for (var i = 0; i < allResources.length; i++) {
        contentResources = `<button type="button" class="btn btn-outline-primary mr-3 mt-3 button-resource" id="name-resource-${i}" value="${allResources[i].name}">${allResources[i].name}</button>`;
        $(".container-resources").append(contentResources);
      }
    }
  });
}

$(document).on("click", ".button-resource", function () {
  var value = $(this).val().toLowerCase();
  $(".single-users-available-connections").children().each(function () {
    var domains = $(this).find("p.domains").text().toLowerCase();
    $(this).toggle(domains.toLowerCase().indexOf(value) > -1);
  });
});

function initSelectDomains() {
  let authToken = $.cookie("authToken");
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/domains",
    headers: {
      Authorization: "Bearer " + authToken
    },
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", "Bearer " + authToken);
    },
    success: function (response) {
      if (response.length) {
        for (var i = 0; i < response.length; i++) {
          var domainTemplate = ``;
          domainTemplate = `
              <option value="${i + 1}" data-id="${response[i].id}">${response[i].name}</option>`;
          $(".connect-domains").append(domainTemplate);
          $("option:even").addClass("ispurple");
          $("option:odd").addClass("isblue");
        }

        initTags();
      } else {
        $(".no-domain-message").removeClass("d-none");
      }
    },
    error: function () {
      alert("Domains listing failed!");
    }
  });
}

function initTags() {
  $(".qtagselect__select").tagselect({
    // additional class(es) for the dropdown
    // shows the footer in the dropdown
    dropFooter: false,
    // is opened on page load
    isOpen: true,
    // maximum number of tags allowed to select
    maxTag: 12
  });
} // sorting functions


function sortConnectionsByDomains(singleUser, group, ngo, institution) {
  sortByDomains(singleUser);
  sortByDomains(group);
  sortByDomains(ngo);
  sortByDomains(institution);
}

function sortByDomains(connectionTab) {
  var domainName = "";
  $.each($(".connect-domains option:selected"), function () {
    domainName = $(this).text().toLowerCase();
    connectionTab.children().filter(":visible").each(function () {
      var singleUsers = $(this).text().toLowerCase();

      if (singleUsers.indexOf(domainName) > -1) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  });

  if ($(".connect-domains option:selected").get().length === 0) {
    connectionTab.children().filter(":visible").each(function () {
      $(this).show();
    });
  }
}

function sortConnectionsByCountry(singleUser, group, ngo, institution) {
  sortByCountry(singleUser);
  sortByCountry(group);
  sortByCountry(ngo);
  sortByCountry(institution);
}

function sortByCountry(connectionTab) {
  var value = $("input#countryFilter").val().toLowerCase();
  connectionTab.children().filter(":visible").each(function () {
    var countrySgUser = $(this).find("span#name-country").text().toLowerCase();

    if (countrySgUser.toLowerCase().indexOf(value) > -1) {
      $(this).show();
    } else {
      $(this).hide();
    }
  });
}

function sortConnectionsByCity(singleUser, group, ngo, institution) {
  sortByCity(singleUser);
  sortByCity(group);
  sortByCity(ngo);
  sortByCity(institution);
}

function sortByCity(connectionTab) {
  var value = $("input#cityFilter").val().toLowerCase();
  connectionTab.children().filter(":visible").each(function () {
    var citySgUser = $(this).find("span#name-location").text().toLowerCase();

    if (citySgUser.toLowerCase().indexOf(value) > -1) {
      $(this).show();
    } else {
      $(this).hide();
    }
  });
}

function sortConnectionsByAnyText(singleUser, group, ngo, institution) {
  sortAvailableConnections(singleUser);
  sortAvailableConnections(group);
  sortAvailableConnections(ngo);
  sortAvailableConnections(institution);
}

function sortAvailableConnections(connectionTab) {
  $(document).on("keyup", "input#sortConnections", function () {
    var value = $(this).val().toLowerCase();
    connectionTab.children().filter(":visible").each(function () {
      var singleUsers = $(this).text().toLowerCase();

      if (singleUsers.toLowerCase().indexOf(value) > -1) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  });
}

function applyAllFlters(singleUserTab, groupTab, ngoTab, institutionTab) {
  singleUserTab.children().each(function () {
    $(this).show();
  });
  groupTab.children().each(function () {
    $(this).show();
  });
  ngoTab.children().each(function () {
    $(this).show();
  });
  institutionTab.children().each(function () {
    $(this).show();
  });
  sortConnectionsByCity(singleUserTab, groupTab, ngoTab, institutionTab);
  sortConnectionsByCountry(singleUserTab, groupTab, ngoTab, institutionTab);
  sortConnectionsByDomains(singleUserTab, groupTab, ngoTab, institutionTab);
  sortConnectionsByAnyText(singleUserTab, groupTab, ngoTab, institutionTab);
}

function clearAllFilters() {
  $("input#cityFilter").attr("value", "");
  $("input#countryFilter").attr("value", "");
  $("input#sortConnections").val("");
  $(".qtagselect").remove();
  $(".select-wrapper").html(`
    <div class="qtagselect">
      <select class="qtagselect__select connect-domains" multiple></select>
    </div>
       `);
  initSelectDomains();
  var singleUserTab = $(".single-users-available-connections");
  var groupTab = $(".groups-available-connections");
  var ngoTab = $(".ngos-available-connections");
  var institutionTab = $(".public-institutions-connections");
  sortConnectionsByCity(singleUserTab, groupTab, ngoTab, institutionTab);
  sortConnectionsByCountry(singleUserTab, groupTab, ngoTab, institutionTab);
  sortConnectionsByAnyText(singleUserTab, groupTab, ngoTab, institutionTab);
  sortConnectionsByDomains(singleUserTab, groupTab, ngoTab, institutionTab);
  applyAllFlters(singleUserTab, groupTab, ngoTab, institutionTab);
  $(document).on("keyup", "input#cityFilter", function () {
    applyAllFlters(singleUserTab, groupTab, ngoTab, institutionTab);
  });
  $(document).on("keyup", "input#countryFilter", function () {
    applyAllFlters(singleUserTab, groupTab, ngoTab, institutionTab);
  });
  $(".connect-domains").on("change", function () {
    applyAllFlters(singleUserTab, groupTab, ngoTab, institutionTab);
  });
  $(document).on("keyup", "input#sortConnections", function () {
    applyAllFlters(singleUserTab, groupTab, ngoTab, institutionTab);
  });
}

function myArea() {
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
      $(document).on("click", "button#my-area", function () {
        var singleUserTab = $(".single-users-available-connections");
        var groupTab = $(".groups-available-connections");
        var ngoTab = $(".ngos-available-connections");
        var institutionTab = $(".public-institutions-connections");
        var cityName = data.locationCity;
        var countryName = data.locationCountry;
        $("input#countryFilter").attr("value", countryName);
        $("input#cityFilter").attr("value", cityName);
        applyAllFlters(singleUserTab, groupTab, ngoTab, institutionTab);
      });
    }
  });
}
//# sourceMappingURL=connect.js.map