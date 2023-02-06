$(document).ready(function () {
  likePost();
  sortAddMember();
  let authToken = $.cookie("authToken");
  var urlParams = new URLSearchParams(window.location.search);
  var userId = urlParams.get("userId");
  var connectUserId = $.cookie("authUserId");
  connectUser(userId, authToken);
  showSharedFiles(userId, authToken);
  $(".edit-info-button").addClass("d-none");
  $(".d-none-if-profile-view").addClass("d-none");
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
      $("#post-username").html(data.name);
      $(".profile-view-username-post").html(data.name); // display user type

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
      }

      var existingDomains = data.domains; // get all domains
      // get user profile picture

      if (data.profilePicture) {
        $("img.profile-picture").attr("src", "https://api.youth-initiatives.com/api/attachments/" + data.profilePicture);
        $(".profile-picture-post img").attr("src", "https://api.youth-initiatives.com/api/attachments/" + data.profilePicture);
        $(".d-none-if-picture-not-exists").addClass("d-none");
      } else {
        $(".profile-placeholder").removeClass("d-none");
        $(".profile-picture-post").addClass("d-none");
        $(".profile-pic").addClass("d-none");
      }

      if (data.userType !== "INFORMAL_GROUP") {
        $(".members-card-for-groups").hide();
      } else {
        $(".members-card-for-groups").show();
        var membersTemplate = $(".members-card-for-groups").find("li#profile-view-member-group");
        membersTemplate.hide();

        if (data.members.length) {
          for (var j = 0; j < data.members.length; j++) {
            $.ajax({
              type: "GET",
              url: baseUrl + "/api/users/" + data.members[j],
              headers: {
                Authorization: "Bearer " + $.cookie("authToken")
              },
              crossDomain: true,
              async: false,
              success: function (response) {
                if (response.profilePicture) {
                  $(".icon-wrapper").html(`<img src='https://api.youth-initiatives.com/api/attachments/${response.profilePicture}'>`);
                }

                var member = membersTemplate.clone();
                member.show().appendTo("#user-members-group");
                member.find("span#profile-view-user-member-name-group").html(`<a href="user-profile-view.html?userId=${response.userId}">${response.name}</a>`);
              }
            });
          }
        } else {
          membersTemplate.show().html("<div class='col-12'>This group does not have any members yet!</div>");
        }
      } // display resources


      for (var j = 0; j < data.resources.length; j++) {
        let userResourceTemplate = `
        <div class="d-flex flex-row justify-content-between">
          <p>${data.resources[j].name}</p>
          <p>${data.resources[j].quantity}</p>
        </div>`;
        $(".user-resources-profile").append(userResourceTemplate);
      } //display connections


      if (data.connections.length > 0) {
        $(".connections-profile-see-more").find("a").attr("connections.html?userId=" + data.userId);

        for (var k = 0; k < data.connections.length; k++) {
          var profilePicture = ``;

          if (data.connections[k].profilePicture) {
            profilePicture = `
            <div class="icon-user-circle" style="opacity: 1 !important;">
              <a class="h-100 w-100 d-flex align-items-center justify-content-center" href="user-profile-view.html?userId=${data.connections[k].userId}">
                <img class="profile-picture-connections" src="https://api.youth-initiatives.com/api/attachments/${data.connections[k].profilePicture}">
              </a>
            </div>
            `;
          } else {
            profilePicture = `
            <div class="icon-user-circle">
              <a class="h-100 w-100 d-flex align-items-center justify-content-center" href="user-profile-view.html?userId=${data.connections[k].userId}">
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

          var templateConnections = ``;

          if (data.connections[k].userId === connectUserId) {
            templateConnections = `
              <span class="pl-3 text-muted" id="user-member-name">${data.connections[k].name}
              </span>
            `;
          } else {
            templateConnections = `
            <a class="text-muted text-decoration-none" href="user-profile-view.html?userId=${data.connections[k].userId}">
              <span class="pl-3" id="user-member-name">${data.connections[k].name}
              </span>
            </a>
            `;
          }

          var connectionTemplate = `
          <div class="row py-2 no-gutters align-items-center justify-content-between">
            <div class="col-auto px-3">
              <div class="icon-wrapper">
                ${profilePicture}
              </div>
            </div>
            <div class="col">${templateConnections}
              
            </div>
          </div>
          `;
          $(".connections-profile-see-more").find("a").attr("href", "connections.html?userId=" + userId);
          $(".connections-template-profile").append(connectionTemplate);
        }
      } else {
        $(".connections-template-profile").html("<p class='p-3 m-0'>" + data.name + " does not have any connections yet</p>");
        $(".connections-template-profile").siblings().hide();
      } // display domains


      for (var i = 0; i < data.domains.length; i++) {
        var userDomainBadge = `<span class="badge badge-pill badge-secondary ml-2">${data.domains[i].name}</span>`;
        $(".user-domains").append(userDomainBadge);
      }

      var pendingRequests = data.connectionRequests;

      if (pendingRequests) {
        for (var j = 0; j < pendingRequests.length; j++) {
          if ($.cookie("authUserId") === pendingRequests[j].userId) {
            $("div.show-status").html("Request already sent!");
          }
        }
      } // user description


      if (data.description) {
        $(".description").html(data.description);
      } else {
        $(".description").html(data.name + " does not have a description yet!");
      }
    }
  });
  $.ajax({
    type: "get",
    url: baseUrl + "/api/posts/user/" + userId,
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (data) {
      var postHTML = $("#profile-post");
      postHTML.hide();

      if (data.length > 0) {
        for (var i = 0; i < data.length; i++) {
          var postTemplate = postHTML.clone();
          postTemplate.show().appendTo(".posts-wrapper");
          postTemplate.find("#post-date").html(data[i].createdAt);
          postTemplate.find("p#post-content").text(data[i].content);
          postTemplate.find("span#like-post").attr("post-id", data[i].id);
          postTemplate.find("span#like-post").attr("data-isLiked", data[i].liked);

          if (data[i].liked) {
            postTemplate.find("span#like-post svg.heart path").css("fill", "red");
          }

          postTemplate.find("span#like-post").append("<span class='pl-3 likes'>" + data[i].likes + "</span>");
          var attachments = data[i].attachments;

          if (attachments.length > 0) {
            for (var j = 0; j < attachments.length; j++) {
              postTemplate.find("#attachments-row").attr("data-toggle", "modal");
              postTemplate.find("#attachments-row").attr("data-target", "#posts-gallery-" + i);
            }

            if (attachments.length === 1) {
              var attachmentTemplate = `<div class="col-12 post-pictures"><img src="https://api.youth-initiatives.com/api/attachments/${attachments[0]}"></div>`;
              postTemplate.find("#attachments-row").append(attachmentTemplate);
              var images = `<img class="img-fluid mb-3 box-shadow" src="https://api.youth-initiatives.com/api/attachments/${attachments[0]}">`;
              var galleryModal = includeHTMLModal(i, images);
              postTemplate.find("#attachments-row").append(galleryModal);
            }

            if (attachments.length === 2) {
              var images = ``;
              var galleryModal = ``;

              for (var j = 0; j < attachments.length; j++) {
                images += `<img class="img-fluid mb-3 box-shadow" src="https://api.youth-initiatives.com/api/attachments/${attachments[j]}">`;
                var attachmentTemplate = `<div class="col-6 post-pictures"><img src="https://api.youth-initiatives.com/api/attachments/${attachments[j]}"></div>`;
                postTemplate.find("#attachments-row").append(attachmentTemplate);
              }

              galleryModal = includeHTMLModal(i, images);
              postTemplate.find("#attachments-row").append(galleryModal);
            }

            if (attachments.length === 3) {
              var images = ``;

              for (var j = 0; j < attachments.length; j++) {
                images += `<img class="img-fluid mb-3 box-shadow" src="https://api.youth-initiatives.com/api/attachments/${attachments[j]}">`;
                var attachmentTemplate = `<div class="col-4 post-pictures"><img src="https://api.youth-initiatives.com/api/attachments/${attachments[j]}"></div>`;
                postTemplate.find("#attachments-row").append(attachmentTemplate);
              }

              var galleryModal = includeHTMLModal(i, images);
              postTemplate.find("#attachments-row").append(galleryModal);
            }

            if (attachments.length > 3) {
              var images = ``;

              for (var j = 0; j < attachments.length; j++) {
                if (j < 3) {
                  var attachmentTemplate = `<div class="col-6 post-pictures"><img src="https://api.youth-initiatives.com/api/attachments/${attachments[j]}"></div>`;
                  postTemplate.find("#attachments-row").append(attachmentTemplate);
                }

                images += `<img class="img-fluid mb-3 box-shadow" src="https://api.youth-initiatives.com/api/attachments/${attachments[j]}">`;
              }

              var remainingPictures = attachments.length - 3;
              postTemplate.find("#attachments-row").append(`<div class="col-6"><div class="post-remaining-pictures"><h4 class="text-white">+${remainingPictures}</h4></div></div>`);
              var galleryModal = includeHTMLModal(i, images);
              postTemplate.find("#attachments-row").append(galleryModal);
            }
          } else {
            postTemplate.find("#post-attachments").hide();
          }
        }
      } else {
        $(".posts-wrapper").html("<h4 class='text-center mt-5'>This user has no posts!</h4>");
      }
    }
  });
}); // connect with user

$(document).on("click", "button.user-profile-view-connect-btn", function () {
  var urlParams = new URLSearchParams(window.location.search);
  var userId = urlParams.get("userId");
  $.ajax({
    type: "POST",
    url: baseUrl + "/api/users/" + $.cookie("authUserId") + "/requestConnection/",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + $.cookie("authToken")
    },
    data: JSON.stringify({
      userId: userId
    }),
    crossDomain: true,
    success: function (response) {
      location.reload(true);
    }
  });
});

function connectUser(userId, authToken) {
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/" + $.cookie("authUserId"),
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (data) {
      var connectionRequest = data.connectionRequests;
      var connections = data.connections;

      for (var i = 0; i < connectionRequest.length; i++) {
        if (connectionRequest[i].userId === userId) {
          $("div.show-status").html("Request pending!!");
        }
      }

      for (var i = 0; i < connections.length; i++) {
        if (connections[i].userId === userId) {
          $("div.show-status").html("Already connected!");
        }
      }
    }
  });
}

function includeHTMLModal(i, images) {
  var galleryModal = `
    <div class="modal fade" id="posts-gallery-${i}" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">Modal title</h5>
            <button type="button" class="close text-black" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            ${images}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;
  return galleryModal;
}

function showSharedFiles(userId, authToken) {
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/" + userId + "/attachments",
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (data) {
      var files = data.content;

      if (files.length) {
        var sharedFile = $("li#shared-list-item");
        sharedFile.addClass("d-none");

        for (var i = 0; i < files.length; i++) {
          var fileNameUserProfile = files[i].title;

          if (fileNameUserProfile.length > 10) {
            fileNameUserProfile = fileNameUserProfile.substring(0, 10) + "[...]";
          }

          if (i < 5) {
            var templateSharedFile = sharedFile.clone();
            templateSharedFile.removeClass("d-none").appendTo("ul.shared-resources");
            templateSharedFile.find("span#name-shared-files").html("<span>" + fileNameUserProfile + "</span>");
          } else {
            break;
          }
        }

        sharedFile.parent().parent().parent().find(".card-footer").find("a").attr("href", "shared-files.html?userId=" + userId);
      } else {
        $("ul.shared-resources").html("<li class='pt-3'>This user doesn't have any shared files!</li>").addClass("list-unstyled mb-3").parent().parent().find(".card-footer").addClass("d-none");
      }
    }
  });
}

function likePost() {
  $(document).on("click", "span#like-post", function () {
    var userId = $.cookie("authUserId");
    var authToken = $.cookie("authToken");
    var postId = $(this).attr("post-id");
    var icon = $(this).find("svg.heart path");
    var isLiked = $(this);
    var likes = parseInt($(this).find("span.likes").text(), 10) + 1;
    var likeSpan = $(this).find("span.likes");

    if (isLiked.attr("data-isLiked") !== "true") {
      $.ajax({
        type: "PUT",
        url: baseUrl + "/api/posts/" + postId + "/like/" + userId,
        async: false,
        headers: {
          Authorization: "Bearer " + authToken
        },
        crossDomain: true,
        contentType: "application/json",
        success: function (response) {
          icon.css("fill", "red");
          likeSpan.text(likes);
          isLiked.attr("data-isLiked", "true");
        }
      });
    } else if (isLiked.attr("data-isLiked") === "true") {
      $.ajax({
        type: "PUT",
        url: baseUrl + "/api/posts/" + postId + "/unlike/" + userId,
        async: false,
        headers: {
          Authorization: "Bearer " + authToken
        },
        crossDomain: true,
        contentType: "application/json",
        success: function (response) {
          icon.parent().html(`<svg class="heart" xmlns="http://www.w3.org/2000/svg" width="16" height="15" viewBox="0 0 16 15">
                                  <g id="heart" fill="none" stroke-miterlimit="10">
                                    <path d="M8,15,6.84,13.937C2.72,10.1,0,7.6,0,4.5A4.386,4.386,0,0,1,4.4,0,4.7,4.7,0,0,1,8,1.717,4.7,4.7,0,0,1,11.6,0,4.386,4.386,0,0,1,16,4.5c0,3.106-2.72,5.6-6.84,9.441Z" stroke="none"></path>
                                    <path d="M 8 13.64373970031738 L 8.48186206817627 13.20225715637207 L 8.644049644470215 13.05103969573975 C 12.47146034240723 9.482660293579102 15 7.125249862670898 15 4.49590015411377 C 15 3.53331995010376 14.65030956268311 2.645900011062622 14.01533985137939 1.997089982032776 C 13.38607025146484 1.3541100025177 12.52828979492188 1 11.60000038146973 1 C 10.53046035766602 1 9.472579956054688 1.506360054016113 8.770179748535156 2.354510068893433 L 8.000020027160645 3.284480094909668 L 7.22983980178833 2.354520082473755 C 6.527400016784668 1.506360054016113 5.469510078430176 1 4.400000095367432 1 C 3.471709966659546 1 2.613929986953735 1.3541100025177 1.984660029411316 1.997089982032776 C 1.349689960479736 2.645900011062622 1 3.53331995010376 1 4.49590015411377 C 1 7.125249862670898 3.528589963912964 9.482709884643555 7.356080055236816 13.05115985870361 L 7.518139362335205 13.2022590637207 L 8 13.64373970031738 M 8 15 L 6.839849948883057 13.9370698928833 C 2.719919919967651 10.09539031982422 0 7.601950168609619 0 4.49590015411377 C 0 1.9617600440979 1.919919967651367 -8.881784197001252e-16 4.400000095367432 -8.881784197001252e-16 C 5.799960136413574 -8.881784197001252e-16 7.119880199432373 0.653980016708374 8 1.71668004989624 C 8.880080223083496 0.653980016708374 10.19995975494385 -8.881784197001252e-16 11.60000038146973 -8.881784197001252e-16 C 14.08008003234863 -8.881784197001252e-16 16 1.9617600440979 16 4.49590015411377 C 16 7.601990222930908 13.28003978729248 10.09543037414551 9.160149574279785 13.9370698928833 L 8 15 Z" stroke="none" fill="#3c4b64"></path>
                                  </g>
                                </svg>`);
          likeSpan.text(response.userLikes.length);
          isLiked.attr("data-isLiked", "false");
        }
      });
    }
  });
}

function sortAddMember() {
  $(document).on("keyup", "input#search-members", function () {
    var value = $(this).val().toLowerCase();
    $(".users-add-list").children().each(function () {
      var name = $(this).text().toLowerCase();
      $(this).toggle(name.toLowerCase().indexOf(value) > -1);
    });
  });
}
//# sourceMappingURL=user-profile.js.map