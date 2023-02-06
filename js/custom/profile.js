$(document).ready(function () {
  let userId = $.cookie("authUserId");
  let authToken = $.cookie("authToken");
  showSharedFiles(userId, authToken);
  sortAddMember();
  $("input#email-checkbox").bind("click", function () {
    $(this).attr("checked", $(this).is(":checked"));
  });
  $(document).on("submit", "form#form-add-members", function (e) {
    e.preventDefault();
    $(this).find("input[type=checkbox]").each(function () {
      if ($(this).is(":checked")) {
        var memberId = $(this).attr("data-userid");
        $.ajax({
          type: "GET",
          url: baseUrl + "/api/users/" + memberId,
          headers: {
            Authorization: "Bearer " + authToken
          },
          crossDomain: true,
          success: function (data) {
            $.ajax({
              type: "POST",
              url: baseUrl + "/api/users/" + memberId + "/sendInvitationsEmails/" + data.email,
              contentType: "application/json",
              success: function () {
                console.log("email sent to " + data.email);
              }
            });
          }
        });
      }
    });
    location.reload(true);
  });
  $("#inputGroupFile01").on("change", function () {
    var files = $("#inputGroupFile01")[0].files[0].name;

    if (files.length > 20) {
      files = files.substring(0, 20) + "[...]";
    }

    $("span#file-name").text(files);

    if ($("#inputGroupFile01")[0].files.length) {
      $(".file-name-attachment .file-icon").removeClass("d-none");
    }
  });
  $("#edit-profile-picture-input").on("change", function () {
    var files = $("#edit-profile-picture-input")[0].files[0].name;

    if (files.length > 20) {
      files = files.substring(0, 20) + "[...]";
    }

    $("span#file-name-profile-picture-edit").text(files);
  });
  likePost();
  $("#fileUploadForm").submit(function (event) {
    //stop submit the form, we will post it manually.
    event.preventDefault();
    const jsonArray = new FormData();
    jsonArray.append("attachment", $("#inputGroupFile01")[0].files[0]);
    jsonArray.append("title", $("#inputGroupFile01")[0].files[0].name);
    console.log(jsonArray.getAll("attachment"));

    for (var key of jsonArray.entries()) {
      console.log(key[0] + ", " + key[1]);
    }

    var opts = {
      url: baseUrl + "/api/attachments",
      data: jsonArray,
      cache: false,
      contentType: false,
      processData: false,
      method: "POST",
      type: "POST",
      // For jQuery < 1.9
      headers: {
        Authorization: "Bearer " + authToken
      },
      success: function (data) {
        location.reload(true);
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

    jQuery.ajax(opts);
  });
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
      }

      if (data.userType !== "INFORMAL_GROUP") {
        $(".members-card-for-groups").hide();
      } else {
        var membersTemplate = $(".members-card-for-groups").find("#member-group");
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
              success: function (response) {
                var userId = $.cookie("authUserId");
                var member = membersTemplate.clone();

                if (userId === response.userId) {
                  $("li#member-group").hide();
                } else {
                  member.show().appendTo("#user-member-group");
                  member.find("a#link-members").attr("href", `user-profile-view.html?userId=${response.userId}`);
                  member.find("span#user-member-name-group").html(response.name);
                }
              }
            });
          }
        } else {
          membersTemplate.show().html("<div class='col-12'>This group does not have any members yet!</div>");
        }
      } // display user location


      $(".user-location").html(data.locationCity + ", " + data.locationCountry);
      $("input#email-checkbox").attr("checked", data.showEmail); // display user-email

      if (data.showEmail) {
        $(".user-email").html(data.email);
      } else {
        $(".user-email").hide();
      } // get user profile picture


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
        $(".d-none-if-picture-not-exists").removeClass("d-none");
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
        var connectionTemplate = ``;
        var connectionAddMemberTemplate = ``;

        for (var k = 0; k < data.connections.length; k++) {
          var memberId = data.connections[k].userId;
          $.ajax({
            type: "GET",
            url: baseUrl + "/api/users/" + memberId,
            headers: {
              Authorization: "Bearer " + authToken
            },
            crossDomain: true,
            success: function (response) {
              var profilePictureAddMember = ``;

              if (response.userType === "SINGLE_USER") {
                if (response.profilePicture) {
                  profilePictureAddMember = `
                  <div class="icon-user-circle" style="opacity: 1 !important;">
                    <img class="profile-picture-add-member" src="https://api.youth-initiatives.com/api/attachments/${response.profilePicture}">
                  </div>
                `;
                } else {
                  profilePictureAddMember = ` <div class="icon-user-circle">
                    <img src="assets/img/icons/user-avatar-orange.svg" alt="Profile Picture" title="Profile Picture" />
                  </div>`;
                }

                connectionAddMemberTemplate = `
                <div class="align-items-center mb-3 no-gutters d-flex">
                  <div>
                      <input class="w-auto" type="checkbox" id="addMemberToGroup" data-userid="${response.userId}"/>
                  </div>
                  <div class="col-auto pl-3">
                    <div class="icon-wrapper">
                      <div class="icon-user-circle">
                        ${profilePictureAddMember}
                      </div>
                    </div>
                  </div>
                  <div class="col-auto">
                    <div class="add-user-name-wrapper px-1 px-lg-3">
                      <span class="user-name-members" id="add-member-name">${response.name}</span>
                    </div>
                  </div>
                </div>`;
                $(".users-add-list").append(connectionAddMemberTemplate);
              }
            }
          });
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
            <a class="w-100 h-100 d-flex align-items-center justify-content-center" href="user-profile-view.html?userId=${data.connections[k].userId}">
              <img src="assets/img/icons/user-avatar-orange.svg" alt="Profile Picture" title="Profile Picture" />
            </a>
          </div>
            `;
          }

          connectionTemplate = `
          <div class="row py-2 no-gutters align-items-center justify-content-between">
            <div class="col-auto px-3">
              <div class="icon-wrapper">
                ${profilePicture}
              </div>
            </div>
            <div class="col">
              <a class="text-muted text-decoration-none" href="user-profile-view.html?userId=${data.connections[k].userId}">
                <span class="pl-3" id="user-member-name">${data.connections[k].name}
                </span>
              </a>
            </div>
          </div>
          `;
          $(".connections-template-profile").append(connectionTemplate);
          $(".connections-profile-see-more").find("a").attr("href", "connections.html");
        }
      } else {
        $(".connections-template-profile").html("<p class='p-3 m-0'>You don't have any connections yet</p>");
      }

      $(".users-add-list").find("input#addMemberToGroup").bind("click", function () {
        $(this).attr("checked", $(this).is(":checked"));
      }); // display domains

      for (var i = 0; i < data.domains.length; i++) {
        var userDomainBadge = `<span class="badge badge-pill badge-secondary ml-2">${data.domains[i].name}</span>`;
        $(".user-domains").append(userDomainBadge);
      } // user description


      if (data.description) {
        $(".description").html(data.description);
      } else {
        $(".description").html("You don't have a description yet!");
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
          postTemplate.find("p#post-content").html(replaceUrlWithHtmlLinks(data[i].content));
          postTemplate.find("#edit-post-modal-link").attr("data-toggle", "modal");
          postTemplate.find("#edit-post-modal-link").attr("data-target", "#posts-edit-modal");
          postTemplate.find("span#like-post").attr("post-id", data[i].id);
          postTemplate.find("span#like-post").attr("data-isLiked", data[i].liked);

          if (data[i].liked) {
            postTemplate.find("span#like-post svg.heart path").css("fill", "red");
          }

          postTemplate.find("span#like-post").append("<span class='pl-3 likes'>" + data[i].likes + "</span>");
          var postId = data[i].id;
          postTemplate.attr("data-post-id", postId);
          var attachments = data[i].attachments;

          if (attachments.length > 0) {
            for (var j = 0; j < attachments.length; j++) {
              postTemplate.find("#attachments-row").attr("data-toggle", "modal");
              postTemplate.find("#attachments-row").attr("data-target", "#posts-gallery-modal");
              postTemplate.find("#attachments-row").attr("data-post-id", postId);
            }

            if (attachments.length === 1) {
              var attachmentTemplate = `<div class="col-12 post-pictures"><img src="https://api.youth-initiatives.com/api/attachments/${attachments[0]}"></div>`;
              postTemplate.find("#attachments-row").append(attachmentTemplate);
            }

            if (attachments.length === 2) {
              for (var j = 0; j < attachments.length; j++) {
                var attachmentTemplate = `<div class="col-6 post-pictures"><img src="https://api.youth-initiatives.com/api/attachments/${attachments[j]}"></div>`;
                postTemplate.find("#attachments-row").append(attachmentTemplate);
              }
            }

            if (attachments.length === 3) {
              for (var j = 0; j < attachments.length; j++) {
                var attachmentTemplate = `<div class="col-4 post-pictures"><img src="https://api.youth-initiatives.com/api/attachments/${attachments[j]}"></div>`;
                postTemplate.find("#attachments-row").append(attachmentTemplate);
              }
            }

            if (attachments.length > 3) {
              for (var j = 0; j < attachments.length; j++) {
                if (j < 3) {
                  var attachmentTemplate = `<div class="col-6 post-pictures"><img src="https://api.youth-initiatives.com/api/attachments/${attachments[j]}"></div>`;
                  postTemplate.find("#attachments-row").append(attachmentTemplate);
                }
              }

              var remainingPictures = attachments.length - 3;
              postTemplate.find("#attachments-row").append(`<div class="col-6"><div class="post-remaining-pictures"><h4 class="text-white">+${remainingPictures}</h4></div></div>`);
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
  $(document).on("click", "#attachments-row", function () {
    var postId = $(this).attr("data-post-id");
    $.ajax({
      type: "GET",
      url: baseUrl + "/api/posts/" + postId,
      headers: {
        Authorization: "Bearer " + $.cookie("authToken")
      },
      crossDomain: true,
      async: false,
      success: function (response) {
        var attachments = response.attachments;
        var images = ``;

        if (attachments.length > 0) {
          for (var i = 0; i < attachments.length; i++) {
            images += `<img class="img-fluid mb-3 box-shadow" src="https://api.youth-initiatives.com/api/attachments/${attachments[i]}">`;
          }

          $("#modal-gallery-images").html(images);
        }
      }
    });
  });
  $(document).on("click", "a#edit-post-modal-link", function () {
    var postId = $(this).closest("#profile-post").attr("data-post-id");
    postsModal(postId);
  });
  $("input#domain-checkbox").click(function () {
    alert("click");
  });
  uploadProfilePicture(userId, authToken);
  deletePostAttachment();
  var attachmentIds = [];
  $(document).on("change", "input#files-post", function () {
    var uploads = $("#files-post")[0].files;
    attachmentIds = uploadPicturesForPost();
  });
  editPost(attachmentIds);
});

async function uploadProfilePicture(userId, authToken) {
  $("#edit-user-info").submit(function (event) {
    //stop submit the form, we will post it manually.
    event.preventDefault();
    const jsonArray = new FormData();

    if ($("input#edit-profile-picture-input")[0].files.length) {
      jsonArray.append("attachment", $("#edit-profile-picture-input")[0].files[0]);
      jsonArray.append("title", $("#edit-profile-picture-input")[0].files[0].name);

      for (var key of jsonArray.entries()) {
        console.log(key[0] + ", " + key[1]);
      }

      var opts = {
        url: baseUrl + "/api/attachments",
        data: jsonArray,
        cache: false,
        contentType: false,
        processData: false,
        method: "POST",
        async: false,
        type: "POST",
        // For jQuery < 1.9
        headers: {
          Authorization: "Bearer " + authToken
        },
        success: function (data) {
          var id = data.id;
          $.ajax({
            type: "POST",
            url: baseUrl + "/api/users/" + $.cookie("authUserId") + "/profilePicture",
            contentType: "text/plain",
            async: false,
            headers: {
              Authorization: "Bearer " + $.cookie("authToken")
            },
            data: id,
            success: function () {
              location.reload(true);
              $("img.profile-picture").attr("src", "https://api.youth-initiatives.com/api/attachments/" + this.data);
              $(".profile-picture-post img").attr("src", "https://api.youth-initiatives.com/api/attachments/" + this.data);
            }
          });
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
    }

    var selected = [];
    $(".domains-list #check-domain").each(function () {
      selected.push($(this).find("input:checked").attr("data-domain-id"));
    });
    var filtered = selected.filter(function (el) {
      return el != undefined;
    });

    if (filtered.length < 3) {
      alert("You must select at leat 3 domains");
    } else {
      var name = $("input#edit-details-name").val();
      var country = $("input#edit-details-country").val();
      var city = $("input#edit-details-city").val();
      var showEmail = $("input#email-checkbox").is(":checked");

      if (name && country && city) {
        $.ajax({
          type: "PUT",
          url: baseUrl + "/api/users/" + userId + "/userInfo",
          headers: {
            Authorization: "Bearer " + authToken
          },
          crossDomain: true,
          async: false,
          data: JSON.stringify({
            name: name,
            locationCountry: country,
            locationCity: city,
            domains: filtered,
            showEmail: showEmail
          }),
          contentType: "application/json",
          success: function (data) {
            $.removeCookie("authName");
            $.cookie("authName", name);

            if ($("input#edit-profile-picture-input")[0].files.length > 0) {
              jQuery.ajax(opts);
            } else {
              location.reload(true);
            }
          },
          complete: function () {}
        });
      } else {
        alert("You must complete all fields!");
      }
    }
  });
}

function postsModal(id) {
  var content = "",
      attachments = [],
      attachmentFiles = [],
      filename = "",
      attachmentTemplate = ``;
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/posts/" + id,
    headers: {
      Authorization: "Bearer " + $.cookie("authToken")
    },
    crossDomain: true,
    async: false,
    success: function (response) {
      content = response.content;
      attachments = response.attachments;
      $("form#edit-post-form").attr("data-post-id", id);
      $("textarea#edit-post-content-textarea").val(content);

      if (attachments.length) {
        for (var j = 0; j < attachments.length; j++) {
          $.ajax({
            type: "GET",
            url: baseUrl + "/api/attachments/" + attachments[j] + "/details",
            headers: {
              Authorization: "Bearer " + $.cookie("authToken")
            },
            crossDomain: true,
            async: false,
            success: function (response) {
              filename = response.title;
              attachmentFiles.push({
                id: attachments[j],
                title: filename
              });
            }
          });
        }
      }

      for (var k = 0; k < attachmentFiles.length; k++) {
        var fileNamePost = attachmentFiles[k].title;

        if (fileNamePost.length > 20) {
          fileNamePost = fileNamePost.substring(0, 20) + "[...]";
        }

        attachmentTemplate += `
      <div class="d-flex justify-content-between align-items-center mb-3 w-75" data-attachment-id="${attachmentFiles[k].id}">
        <div class="d-flex align-items-center">
            <div><i class="cil-file" style="font-size: 30px; padding-right:10px;"></i></div>
            <div><a href="https://api.youth-initiatives.com/api/attachments/${attachmentFiles[k].id}">${fileNamePost ? fileNamePost : "filename"}</a></div>
        </div>
        <div id="delete-attachment" class="p-2" style="cursor: pointer">
            <i class="cil-x text-dark"></i>
          </div>
      </div>
    `;
      }

      $("#post-attachments-profile-edit").html(attachmentTemplate);
    }
  });
}

function deletePostAttachment() {
  $(document).on("click", "#delete-attachment", function () {
    $(this).parent().remove();
    alert("attachment deleted");
  });
}

function editPost(newAttachments) {
  $(document).on("click", "button#edit-post-submit-button", function () {
    var form = $("#edit-post-form");
    var postId = form.attr("data-post-id");
    var content = form.find("textarea").val();
    var attachments = [];
    var attachmentId = form.find("#post-attachments-profile-edit").children().each(function () {
      attachments.push($(this).attr("data-attachment-id"));
    });

    for (var i = 0; i < newAttachments.length; i++) {
      attachments.push(newAttachments[i]);
    }

    var post = {
      content,
      attachments
    };

    if (post.content !== "" || post.attachments.length > 0) {
      $.ajax({
        type: "PUT",
        url: baseUrl + "/api/posts/" + postId,
        contentType: "application/json",
        headers: {
          Authorization: "Bearer " + $.cookie("authToken")
        },
        data: JSON.stringify(post),
        success: function () {
          location.reload(true);
        }
      });
    } else {
      alert("content missing!");
    }
  });
}

function replaceUrlWithHtmlLinks(text) {
  var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/i;
  return text.replace(exp, "<a href='$1'>$1</a>");
}

function uploadPicturesForPost() {
  var attachemntIds = [];
  var files = $("#files-post")[0].files;

  for (var i = 0; i < files.length; i++) {
    let jsonArray = new FormData();
    jsonArray.append("attachment", files[i]);
    jsonArray.append("title", files[i].name);
    console.log(jsonArray.getAll("attachment"));

    for (var key of jsonArray.entries()) {
      console.log(key[0] + ", " + key[1]);
    }

    var opts = {
      url: baseUrl + "/api/attachments",
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
        attachemntIds.push(data.id);
        var postId = data.id;
        $.ajax({
          type: "GET",
          url: baseUrl + "/api/attachments/" + postId + "/details",
          headers: {
            Authorization: "Bearer " + $.cookie("authToken")
          },
          crossDomain: true,
          async: false,
          success: function (response) {
            var filename = response.title;

            if (filename.length > 20) {
              filename = filename.substring(0, 20) + "[...]";
            }

            $("#post-attachments-profile-edit").append(`
              <div class="d-flex justify-content-between align-items-center mb-3 w-75" data-attachment-id="${postId}">
                <div class="d-flex align-items-center">
                  <div><i class="cil-file" style="font-size: 30px; padding-right:10px;"></i></div>
                  <div>${filename ? filename : "filename"}</div>
                </div>
                <div id="delete-attachment" class="p-2" style="cursor: pointer">
                  <i class="cil-x text-dark"></i>
                </div>
            </div>
            `);
          }
        });
      }
    };

    if (jsonArray.fake) {
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

  return attachemntIds;
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
          var fileNameAttachments = files[i].title;

          if (fileNameAttachments.length > 10) {
            fileNameAttachments = fileNameAttachments.substring(0, 10) + "[...]";
          }

          if (i < 5) {
            var cloneTemplateShareFile = sharedFile.clone();
            cloneTemplateShareFile.removeClass("d-none").appendTo("ul.shared-resources");
            cloneTemplateShareFile.find("span#name-shared-files").html("<a href='" + baseUrl + "/api/attachments/" + files[i].id + "'>" + fileNameAttachments + "</a>");
          } else {
            break;
          }
        }

        sharedFile.parent().parent().parent().find(".card-footer").find("a").attr("href", "shared-files.html");
      } else {
        $("ul.shared-resources").html("<li class='mt-3'>You don't have any shared files!</li>").addClass("list-unstyled mb-3").parent().parent().find(".card-footer").find("a").attr("href", "shared-files.html");
      }
    }
  });
}

$(document).on("click", "button.edit-info-button", function () {
  $("input#edit-profile-picture-input").val("");
  $("span#file-name-profile-picture-edit").html("");
  $(".domains-list").html("<div class='col-md-6' id='check-domain'><input class='w-25' id='domain-checkbox' type='checkbox'/>" + "<span id='domain-name'></span>" + "</div>");
  editProfileInfo();
});

function editProfileInfo() {
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
      console.log(data);
      var existingDomains = data.domains; // get all domains

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
          var allDomains = response;
          var domainHtml = $("#check-domain");
          domainHtml.hide();

          for (var i = 0; i < allDomains.length; i++) {
            var domainTemplate = domainHtml.clone();
            domainTemplate.show().appendTo(".domains-list");
            domainTemplate.find("#domain-name").html(allDomains[i].name);
            domainTemplate.find("input").attr("data-domain-id", allDomains[i].id);

            for (var j = 0; j < existingDomains.length; j++) {
              if (allDomains[i].id === existingDomains[j].id) {
                domainTemplate.find("input").attr("checked", "true");
              }
            }

            $(domainTemplate.find("input")).bind("click", function () {
              $(this).attr("checked", $(this).is(":checked"));
            });
          }
        },
        error: function () {
          alert("Domains listing failed!");
        }
      }); // display modal infos

      $("input#edit-details-name").val(data.name);
      $("input#edit-details-country").val(data.locationCountry);
      $("input#edit-details-city").val(data.locationCity);
    }
  });
}

var attachEditPostProfile = function (event) {
  var editPostProfile = document.getElementById("editPostProfile");
  editPostProfile.src = URL.createObjectURL(event.target.files[0]);

  output.onload = function () {
    URL.revokeObjectURL(editPostProfile.src); // free memory
  };
};

function sortAddMember() {
  $(document).on("keyup", "input#search-members", function () {
    var value = $(this).val().toLowerCase();
    $("div#container-add-members").children().each(function () {
      var name = $(this).text().toLowerCase();
      $(this).toggle(name.toLowerCase().indexOf(value) > -1);
    });
  });
}

var editProfilePicture = function (event) {
  var attachEditProfilePicture = document.getElementById("attachEditProfilePicture");
  attachEditProfilePicture.src = URL.createObjectURL(event.target.files[0]);

  attachEditProfilePicture.onload = function () {
    URL.revokeObjectURL(attachEditProfilePicture.src); // free memory
  };
};

var createProfilePostAttach = function (event) {
  var attachCreatePost = document.getElementById("attachCreateProfilePost");
  attachCreatePost.src = URL.createObjectURL(event.target.files[0]);

  attachCreatePost.onload = function () {
    URL.revokeObjectURL(attachCreatePost.src); // free memory
  };
};
//# sourceMappingURL=profile.js.map