$(document).ready(function () {
  var userId = $.cookie("authUserId");
  var attachmentIds = [];
  $(document).on("change", "input#files-post", function () {
    var uploads = $("#files-post")[0].files;
    attachmentIds = uploadPicturesForPost();
  });
  var counter = 0;
  $(document).on("click", "a#edit-post-modal-link", function () {
    var postId = $(this).closest("#profile-post").attr("data-post-id");
    postsModal(postId);
  });
  loadPosts(counter);
  deletePostAttachment();
  recentlyAddedProject();
  showRecentActivity();
  $(".c-body").on("scroll", function () {
    if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
      counter = counter + 1;
      loadPosts(counter);
    }
  });
  editPost(attachmentIds);
  likePost();
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
});

function loadPosts(counter) {
  var authToken = $.cookie("authToken");
  var userId = $.cookie("authUserId");
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/posts/connectionsPosts/" + userId + "?page=" + counter + "&size=10&sort=createdAt,desc",
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    contentType: "application/json",
    success: response => {
      var postHTML = $("#profile-post");
      postHTML.hide();
      var posts = response.content;

      for (var i = 0; i < posts.length; i++) {
        var postTemplate = postHTML.clone();
        postTemplate.show().appendTo(".posts-wrapper");
        postTemplate.attr("data-post-id", posts[i].id);
        postTemplate.find("#post-date").html(posts[i].createdAt);
        postTemplate.find("span#like-post").attr("post-id", posts[i].id);
        postTemplate.find("p#post-content").html(replaceUrlWithHtmlLinks(posts[i].content));
        postTemplate.find("#edit-post-modal-link").attr("data-toggle", "modal");
        postTemplate.find("span#like-post").attr("data-isLiked", posts[i].liked);

        if (posts[i].liked) {
          postTemplate.find("span#like-post svg.heart path").css("fill", "red");
        }

        postTemplate.find("span#like-post").append("<span class='pl-3 likes'>" + posts[i].likes + "</span>");
        postTemplate.find("#edit-post-modal-link").attr("data-target", "#posts-edit-modal");
        var postUserId = posts[i].userId;

        if (posts[i].userId !== $.cookie("authUserId")) {
          postTemplate.find(".d-none-if-profile-view").addClass("d-none");
        }

        $.ajax({
          type: "GET",
          url: baseUrl + "/api/users/" + postUserId,
          async: false,
          headers: {
            Authorization: "Bearer " + authToken
          },
          crossDomain: true,
          contentType: "application/json",
          success: function (response) {
            if (response) {
              if (response.userId !== $.cookie("authUserId")) {
                postTemplate.find("a.link-profile").attr("href", "user-profile-view.html?userId=" + response.userId);
                postTemplate.find("#post-username").html("<a href='user-profile-view.html?userId=" + response.userId + "'>" + response.name + "</a>");
              } else {
                postTemplate.find("#post-username").html("<a href='my-profile.html'>" + response.name + "</a>");
              }

              if (response.profilePicture) {
                postTemplate.find("a.link-profile").attr("href", "user-profile-view.html?userId=" + response.userId);
                postTemplate.find("#post-user-profile-picture img").attr("src", "https://api.youth-initiatives.com/api/attachments/" + response.profilePicture);
                postTemplate.find("#user-icon-rounded-wrapper").addClass("d-none");
              } else {
                postTemplate.find("#user-icon-rounded-wrapper").removeClass("d-none");
                postTemplate.find("#post-user-profile-picture").addClass("d-none");
              }

              return false;
            } else {
              return true;
            }
          }
        });
        var postId = posts[i].id;

        if ($.cookie("authUserId") === posts[i].userId) {// postTemplate.append(postsModal(i, postId));
        }

        var attachments = posts[i].attachments;

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
    } else {}
  });
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

            $("#post-attachments-profile-edit").append(`<div class="d-flex justify-content-between align-items-center mb-3 w-75" data-attachment-id="${postId}">
             <div class="d-flex align-items-center">
                 <div><i class="cil-file" style="font-size: 30px; padding-right:10px;"></i></div>
                 <div>${filename ? filename : "filename"}</div>
             </div>
             <div id="delete-attachment" class="p-2" style="cursor: pointer">
                 <i class="cil-x text-dark"></i>
               </div>
           </div>`);
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

    let response = jQuery.ajax(opts);
  }

  return attachemntIds;
}

function replaceUrlWithHtmlLinks(text) {
  var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/i;
  return text.replace(exp, "<a href='$1'>$1</a>");
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

function showRecentActivity() {
  let userToken = $.cookie("authToken");
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/notifications/",
    async: false,
    headers: {
      Authorization: "Bearer " + userToken
    },
    crossDomain: true,
    contentType: "application/json",
    success: function (response) {
      var activityTemplate = $(".recent-activity-card").find("li");
      activityTemplate.hide();

      if (response.length > 0) {
        for (var i = 0; i < response.length; i++) {
          var activityItem = activityTemplate.show();
          activityItem.clone();
          activityItem.find("p#notification-topic").html(response[i].topic);
          var timeAgo = moment(response[i].createdAt).fromNow();
          activityItem.find("p#notification-time").html(timeAgo);
        }
      } else {
        var activityItem = activityTemplate.show();
        activityItem.clone();
        activityItem.find("p#notification-topic").html("You don't have recent activity!");
        activityItem.find("p#notification-time").hide();
      }
    }
  });
}

function recentlyAddedProject() {
  var userId = $.cookie("authUserId");
  var authToken = $.cookie("authToken");
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
            $("div#footer-recenty-projects").addClass("d-block");
          } else {
            break;
          }
        }

        sharedFile.parent().parent().parent().find(".card-footer").find("a").attr("href", "shared-files.html");
      } else {
        $("ul.shared-resources").html("<li class='mt-3'>You don't have recently added projects!</li>").addClass("list-unstyled mb-3");
        $("div#footer-recenty-projects").addClass("d-none");
      }
    }
  });
}

var loadAttachNewsFeed = function (event) {
  var attachEditPostNewsFeed = document.getElementById("attachEditPostNewsFeed");
  attachEditPostNewsFeed.src = URL.createObjectURL(event.target.files[0]);

  attachEditPostNewsFeed.onload = function () {
    URL.revokeObjectURL(attachEditPostNewsFeed.src); // free memory
  };
};

var createIndexPostAttach = function (event) {
  var attachEditPostNewsFeed = document.getElementById("attachCreateIndexPost");
  attachEditPostNewsFeed.src = URL.createObjectURL(event.target.files[0]);

  attachEditPostNewsFeed.onload = function () {
    URL.revokeObjectURL(attachEditPostNewsFeed.src); // free memory
  };
};
//# sourceMappingURL=newsfeed.js.map