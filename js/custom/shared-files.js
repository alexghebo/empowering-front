$(document).ready(function () {
  var urlParams = new URLSearchParams(window.location.search);
  var userId = urlParams.get("userId");
  var authToken = $.cookie("authToken");

  if (!userId) {
    userId = $.cookie("authUserId");
  }

  if (userId !== $.cookie("authUserId")) {
    $("th:last-of-type").remove();
    $("tbody").children().each(function () {
      $(this).find("td:last-of-type").remove();
    });
    $("button[data-target='#shared-fiels']").remove();
  }

  getUserProfileInfo(userId, authToken);
  $("#filter-connections").on("keyup", function () {
    var value = $(this).val().toLowerCase();
    $("#modal-share-with-connections-wrapper").children().each(function () {
      var connection = $(this).find("span#chat-menu-user-name").text().toLowerCase();

      if (connection.toLowerCase().indexOf(value) > -1) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  });
  $("#filter-table").on("keyup", function () {
    var value = $(this).val().toLowerCase();
    $("#tableFiles tr").filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
  });
  uploadSharedFile(userId, authToken);
  $("#shared-file-upload-input").on("change", function () {
    var uploads = $("#shared-file-upload-input")[0].files;

    for (var i = 0; i < uploads.length; i++) {
      var uploadNames = uploads[i].name;

      if (uploads[i].name.length > 20) {
        uploadNames = uploadNames.substring(0, 20) + "[...]";
      }

      $("span#file-name").append("<i class='cil-file mr-2'></i>" + uploadNames + "<br>");
    }
  });
  var counter = 0;
  getAllSharedFiles(counter, userId, authToken);
  $(".c-body").on("scroll", function () {
    if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
      counter = counter + 1;
      getAllSharedFiles(counter, userId, authToken);
    }
  });
  deleteAttachments();
  shareFileWithConnections();
});

function sortTable(n) {
  var table,
      rows,
      switching,
      i,
      x,
      y,
      shouldSwitch,
      dir,
      switchcount = 0;
  table = document.getElementById("tableFiles");
  switching = true; //Set the sorting direction to ascending:

  dir = "asc";
  /*Make a loop that will continue until
    no switching has been done:*/

  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /*Loop through all table rows (except the
      first, which contains table headers):*/

    for (i = 1; i < rows.length - 1; i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
        one from current row and one from the next:*/

      x = rows[i].getElementsByTagName("TD")[n];
      y = rows[i + 1].getElementsByTagName("TD")[n];
      /*check if the two rows should switch place,
        based on the direction, asc or desc:*/

      if (dir == "asc") {
        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          //if so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      } else if (dir == "desc") {
        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
          //if so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      }
    }

    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
        and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true; //Each time a switch is done, increase this count by 1:

      switchcount++;
    } else {
      /*If no switching has been done AND the direction is "asc",
        set the direction to "desc" and run the while loop again.*/
      if (switchcount == 0 && dir == "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
}

function getAllSharedFiles(counter, userId, authToken) {
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/" + userId + "/attachments?page=" + counter + "&size=10&sort=createdAt,desc",
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (data) {
      var files = data.content;

      if (files) {
        var templateSharedFiles = $("#content-shared-file");
        templateSharedFiles.addClass("d-none");

        for (var i = 0; i < files.length; i++) {
          var cloneTemplateSharedFiles = templateSharedFiles.clone();
          cloneTemplateSharedFiles.removeClass("d-none").appendTo("table#tableFiles tbody");
          var filename = files[i].title;

          if (filename.length > 15) {
            filename = filename.substring(0, 15) + "[...]";
          }

          if (userId === $.cookie("authUserId")) {
            cloneTemplateSharedFiles.find("span#name-file").html("<a href='" + baseUrl + "/api/attachments/" + files[i].id + "'>" + filename + "</a>");
          } else {
            cloneTemplateSharedFiles.find("span#name-file").html(filename);
          }

          cloneTemplateSharedFiles.find("button#delete-file-button").attr("data-file-id", files[i].id);
          cloneTemplateSharedFiles.find("i#share-file-icon").attr("data-file-id", files[i].id);

          if (files[i].owner.id === $.cookie("authUserId")) {
            cloneTemplateSharedFiles.find("td#file-owner").html("me");
          } else {
            cloneTemplateSharedFiles.find("td#file-owner").html(files[i].owner.name);
            cloneTemplateSharedFiles.find("i#share-file-icon").hide();
            cloneTemplateSharedFiles.find("button#delete-file-button").hide();
          }

          var createdAtDate = moment(files[i].createdAt).format("DD-MM-YYYY");
          cloneTemplateSharedFiles.find("td#file-add-date").html(createdAtDate);
        }
      }
    }
  });
}

function uploadSharedFile(userId, authToken) {
  $("#shared-file-upload-form").submit(function (event) {
    //stop submit the form, we will post it manually.
    event.preventDefault();
    var files = $("#shared-file-upload-input")[0].files;

    for (var i = 0; i < files.length; i++) {
      let jsonArray = new FormData();
      jsonArray.append("attachment", files[i]);
      jsonArray.append("title", files[i].name);
      console.log(jsonArray.getAll("attachment"));

      for (var key of jsonArray.entries()) {
        console.log(key[0] + ", " + key[1]);
      }

      var opts = {
        url: baseUrl + "/api/users/" + userId + "/attachments",
        data: jsonArray,
        cache: false,
        async: false,
        contentType: false,
        processData: false,
        method: "POST",
        type: "POST",
        // For jQuery < 1.9
        headers: {
          Authorization: "Bearer " + $.cookie("authToken")
        },
        success: function (data) {
          if (i == files.length - 1) {
            alert("attachment posted");
            location.reload(true);
          }
        }
      };

      if (jsonArray.fake) {
        // Make sure no text encoding stuff is done by xhr
        opts.xhr = function () {
          var xhr = jQuery.ajaxSettings.xhr();
          xhr.send = xhr.sendAsBinary;
          return xhr;
        };

        opts.contentType = "multipart/form-data; boundary=" + jsonArray.boundary;
        opts.data = jsonArray.toString();
      }

      let response = jQuery.ajax(opts);
    }
  });
}

function shareFileWithConnections() {
  $(document).on("click", "i#share-file-icon", function () {
    $("#modal-share-with-connections-wrapper").attr("data-file-id", $(this).attr("data-file-id"));
    $.ajax({
      type: "GET",
      url: baseUrl + "/api/users/" + $.cookie("authUserId"),
      headers: {
        Authorization: "Bearer " + $.cookie("authToken")
      },
      crossDomain: true,
      success: function (data) {
        var connections = data.connections;
        var connectionTemplateConnections = ``;

        if (connections.length) {
          for (var i = 0; i < connections.length; i++) {
            var profilePictureChat = ``;

            if (connections[i].profilePicture) {
              profilePictureChat = `
            <div class="icon-user-circle" style="opacity: 1 !important;">
            <a class="h-100 w-100" href="user-profile-view.html?userId=${connections[i].userId}">
              <img class="profile-picture-chat-list" src="https://api.youth-initiatives.com/api/attachments/${connections[i].profilePicture}">
            </a>
            </div>`;
            } else {
              profilePictureChat = `
        <div class="icon-user-circle">
        <a href="user-profile-view.html?userId=${data.userId}">
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="19" viewBox="0 0 17 19">
            <defs>
              <style>
                .a {
                  fill: none;
                  stroke: #1e272e;
                  stroke-linecap: round;
                  stroke-linejoin: round;
                }
              </style>
            </defs>
            <g transform="translate(-5.5 -4)">
              <path class="a" d="M22,28.5v-2a4,4,0,0,0-4-4H10a4,4,0,0,0-4,4v2" transform="translate(0 -6)"></path>
              <path class="a" d="M20,8.5a4,4,0,1,1-4-4,4,4,0,0,1,4,4Z" transform="translate(-2 0)"></path>
            </g>
            </svg>
          </a>
          </div>
          `;
            }

            connectionTemplateConnections += `<div class="mb-3">
          <div class="users-list px-3">
            <div class="row align-items-center justify-content-between no-gutters user">
                <div class="col">
                    <div class="row no-gutters align-items-center">
                      <div class="col-auto">
                          <div class="icon-wrapper">
                              ${profilePictureChat}
                          </div>
                        </div>
                        <div class="col">
                          <div class="user-name-wrapper px-1 px-lg-3">
                            <a class="text-muted text-decoration-none" href="user-profile-view.html?userId=${connections[i].userId}">
                              <span id="chat-menu-user-name">${connections[i].name}</span>
                            </a>
                          </div>
                        </div>
                      </div>
                </div>
                
                <div class="col-auto">
                    <button id="share-with-connection-button" class="btn btn-primary btn-sm px-3" data-user-id="${connections[i].userId}">Share</button>
                </div>
            </div>
          </div>
        </div>`;
          }
        } else {
          connectionTemplateConnections = `You don't have any connection to share with this file!`;
        }

        $("#modal-share-with-connections-wrapper").html(connectionTemplateConnections);
      }
    });
  });
  $(document).on("click", "button#share-with-connection-button", function () {
    var sharingUserId = $(this).attr("data-user-id");
    var fileId = $(this).closest("#modal-share-with-connections-wrapper").attr("data-file-id");
    $.ajax({
      type: "POST",
      url: baseUrl + "/api/attachments/" + fileId + "/share/" + sharingUserId,
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + $.cookie("authToken")
      },
      crossDomain: true,
      success: function (data) {},
      error: function (err) {
        console.error(err);
        alert(err.responseJSON.message);
      }
    });
  });
}

function deleteAttachments() {
  $(document).on("click", "button#delete-file-button", function () {
    $("button#delete-file").attr("data-file-id", $(this).attr("data-file-id"));
  });
  $(document).on("click", "button#delete-file", function () {
    var idFile = $(this).attr("data-file-id");
    let userId = $.cookie("authUserId");
    let authToken = $.cookie("authToken");
    $.ajax({
      type: "DELETE",
      url: baseUrl + "/api/users/" + userId + "/attachments/" + idFile,
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
      $("input#edit-detaidls-country").val(data.locationCountry);
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

$(document).on("click", "button#add-new-shared-files", function () {
  $("input#shared-file-upload-input").val("");
  $("span#file-name").html("");
});
//# sourceMappingURL=shared-files.js.map