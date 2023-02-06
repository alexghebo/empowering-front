$(document).ready(function () {
  $(document).on("click", "#content-user-group", function () {
    var checked = $(this).find("input#input-group-users").attr("checked");
    $(this).find("input#input-group-users").attr("checked", !checked);
  });
  tagSelectorInit();
  sortConnection();
  uploadPictures();
  sendMessagesPressingEnter();
  sendMessageClickingButton();
  submitCreateGroup();
  sortAddMembersToGroup();
  deleteUserFromGroup();
  addMembersToGroup();
  deleteMessageAttachment();
  submitEditGroup();
  var userIds = [];
  $(document).on("change", "input#upload-profile-group-input", function () {
    var files = $("input#upload-profile-group-input")[0].files[0].name;

    if (files.length > 20) {
      files = files.substring(0, 20) + "[...]";
    }

    $("span#file-name").text(files);
  });
  $(document).on("submit", "form#upload-profile-group-form", function (e) {
    e.preventDefault();
    var userId = $(this).attr("data-group-id");
    var authToken = $.cookie("authToken");
    console.log(userId);
    uploadProfilePicture(userId, authToken);
  });

  async function uploadProfilePicture(userId, authToken) {
    //stop submit the form, we will post it manually.
    event.preventDefault();
    const jsonArray = new FormData();

    if ($("input#upload-profile-group-input")[0].files.length) {
      jsonArray.append("attachment", $("input#upload-profile-group-input")[0].files[0]);
      jsonArray.append("title", $("input#upload-profile-group-input")[0].files[0].name);

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
            url: baseUrl + "/api/users/" + userId + "/profilePictureForMessageGroup",
            contentType: "text/plain",
            async: false,
            headers: {
              Authorization: "Bearer " + $.cookie("authToken")
            },
            data: id,
            success: function () {
              location.reload(true);
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

      jQuery.ajax(opts);
    }
  }

  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/" + $.cookie("authUserId"),
    headers: {
      Authorization: "Bearer " + $.cookie("authToken")
    },
    async: false,
    crossDomain: true,
    success: function (data) {
      if (data.connections.length) {
        for (var i = 0; i < data.connections.length; i++) {
          userIds.push(data.connections[i].userId);
        }
      }
    }
  });
  $(document).on("hidden.bs.modal", "div#create-group-modal", function () {
    $("input#name-group").val("");
    $("input#input-group-users").removeAttr("checked");
  });
  $(".message-page-wrapper").css({
    height: $(window).height() - 57,
    overflowY: "auto"
  });
  $(".message-page-wrapper-content").css({
    height: $(window).height() - 157,
    overflowY: "auto",
    position: "relative",
    paddingTop: "30px"
  });
  $(".user-type-message").css({
    height: 100,
    overflowY: "auto"
  }).scrollTop(0);
  $(".message-page-wrapper-content").scrollTop($(".message-page-wrapper-content").prop("scrollHeight"));
  listMessagesFrientList();
  filterUserMessages();
  addNewContactMessage();
  $(".connections-search-select2").on("change", function () {
    var userId = $(this).find("option:selected").attr("data-user-id");
    $(".messages-list").children().each(function () {
      $(this).removeClass("active");
    });
    $(".messages-list").find("a[data-user-id=" + userId + "]").addClass("active").addClass("show");
    $("#v-pills-new-message").removeClass("active").removeClass("show");
    $("#v-pills-home").addClass("active").addClass("show").attr("data-user-id", userId);
    $(".messages-content").addClass("col-xl-8").removeClass("col-xl-12");
    $(".sidebar-right-content").removeClass("d-none");
    changeContent(userId);
  });

  (function newMessageNotif() {
    setTimeout(function () {
      $.ajax({
        type: "GET",
        url: baseUrl + "/api/users/conversations",
        headers: {
          Authorization: "Bearer " + $.cookie("authToken")
        },
        async: false,
        success: function (data) {
          var newConversations = data;

          for (var i = 0; i < newConversations.length; i++) {
            if (newConversations[i].lastMessage) {
              if (newConversations[i].lastMessage.status === "UNREAD") {
                if (!$(".messages-list").children().eq(i + 1).hasClass("active")) {
                  $(".messages-list").children().eq(i + 1).find("span#chat-menu-user-name").addClass("font-weight-bold");
                } else {
                  $.ajax({
                    type: "POST",
                    url: baseUrl + "/api/users/message/" + newConversations[i].lastMessage.id + "/change-status",
                    headers: {
                      Authorization: "Bearer " + $.cookie("authToken")
                    },
                    contentType: "application/x-www-form-urlencoded",
                    success: function () {}
                  });
                }
              }
            }
          } // }

        },
        complete: newMessageNotif,
        timeout: 200
      });
    }, 5000);
  })();

  var liveMessages = function () {
    var activeTabUserId = $(".nav-link.active.show").attr("data-user-id");
    var oldMessages = [];
    var newMessages = [];
    var switched = false; // on page load and changes its value when clicking on other user tab

    $.ajax({
      type: "GET",
      url: baseUrl + "/api/users/conversation/" + activeTabUserId,
      headers: {
        Authorization: "Bearer " + $.cookie("authToken")
      },
      crossDomain: true,
      async: false,
      success: function (data) {
        oldMessages = data;
      }
    });

    (function poll() {
      setTimeout(function () {
        var newTabUserId = $(".nav-link.active.show").attr("data-user-id");
        $.ajax({
          type: "GET",
          url: baseUrl + "/api/users/conversation/" + activeTabUserId,
          headers: {
            Authorization: "Bearer " + $.cookie("authToken")
          },
          crossDomain: true,
          async: false,
          success: function (data) {
            if (activeTabUserId === newTabUserId) {
              newMessages = data;

              if (oldMessages.length !== newMessages.length) {
                if (!switched) {
                  if (newMessages[newMessages.length - 1].senderId !== $.cookie("authUserId")) {
                    var diffMessagesLength = newMessages.length - oldMessages.length;
                    var diffmessages = [];

                    for (var j = 0; j < newMessages.length; j++) {
                      if (j > oldMessages.length - 1) {
                        if (newMessages[j].senderId !== $.cookie("authUserId")) {
                          diffmessages.push(newMessages[j]);
                        }
                      }
                    }

                    for (var k = 0; k < diffmessages.length; k++) {
                      var message = diffmessages[k];
                      $.ajax({
                        type: "GET",
                        url: baseUrl + "/api/users/" + message.senderId,
                        headers: {
                          Authorization: "Bearer " + $.cookie("authToken")
                        },
                        async: false,
                        crossDomain: true,
                        success: function (data) {
                          var userName = data.name;
                          var profilePic = ``;

                          if (data.profilePicture) {
                            profilePic = `
          <div class="icon-user-circle" style="opacity: 1 !important;"> 
              <img class="profile-picture-chat-list" src="https://api.youth-initiatives.com/api/attachments/${data.profilePicture}">
          </div>`;
                          } else {
                            profilePic = `
          <div class="icon-user-circle" style="opacity: .7;">
            <img src="assets/img/icons/user-avatar-orange.svg" alt="Profile Picture" title="Profile Picture" />
          </div>`;
                          }

                          var groupTemplate = ``;

                          if (message.group) {
                            groupTemplate = `<div class="ml-4 text-muted">${userName}</div>`;
                          }

                          var newUserMessageTemplate = `
          <div class="user-third-party-message" style="">${groupTemplate}
    <div class="d-flex align-items-start">
        <div class="px-2 px-md-4 d-flex">
          <div class="profile-picture-user-messages">
          <a href="user-profile-view.html?userId=${data.userId}">
      ${profilePic}
      </a>
        </div>
        <div class="message ml-4">
            <p class="m-0" id="content-message-third-party-user">${message.message}</p>
        </div>
    </div>
</div>
                            `;
                          $(newUserMessageTemplate).appendTo(".message-page-wrapper-content");
                        }
                      });
                    }

                    console.log(diffmessages);
                    oldMessages = newMessages;
                  }
                } else {
                  switched = false;
                  oldMessages = newMessages;
                }
              }
            } else {
              console.log("user changed!");
              activeTabUserId = newTabUserId;
              $.ajax({
                type: "GET",
                url: baseUrl + "/api/users/conversation/" + activeTabUserId,
                headers: {
                  Authorization: "Bearer " + $.cookie("authToken")
                },
                crossDomain: true,
                async: false,
                success: function (data) {
                  oldMessages = data;
                  console.log("switched old " + oldMessages.length);
                  switched = true;
                }
              });
            }
          },
          complete: poll,
          timeout: 200
        });
      }, 5000);
    })();
  };

  window.onload = function () {
    setTimeout(liveMessages, 5000);
  };
});

function listMessagesFrientList() {
  let userId = $.cookie("authUserId");
  let authToken = $.cookie("authToken");
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/conversations",
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (data) {
      var connectionsUser = data;
      var messageListIitem = $("a#messages-list-item");
      messageListIitem.addClass("d-none");

      for (var i = 0; i < connectionsUser.length; i++) {
        var profilePictureMessages = ``;
        var messageListTemplate = messageListIitem.clone();
        messageListTemplate.removeClass("d-none").appendTo(".messages-list");
        messageListTemplate.attr("data-user-id", connectionsUser[i].entityId);
        messageListTemplate.find("span#chat-menu-user-name").html(connectionsUser[i].name);

        if (connectionsUser[i].lastMessage) {
          messageListTemplate.attr("data-last-message", connectionsUser[i].lastMessage.id);

          if (connectionsUser[i].lastMessage.status === "UNREAD") {
            messageListTemplate.find("span#chat-menu-user-name").addClass("font-weight-bold");
          }
        }

        if (connectionsUser[i].profilePictureId) {
          profilePictureMessages = `
          <div class="icon-user-circle" style="opacity: 1 !important;"> 
            <img class="profile-picture-chat-list" src="https://api.youth-initiatives.com/api/attachments/${connectionsUser[i].profilePictureId}">
          </div>`;
        } else {
          profilePictureMessages = `
          <div class="icon-user-circle">
            <img src="assets/img/icons/user-avatar-orange.svg" alt="Profile Picture" title="Profile Picture" />
          </div>`;
        }

        messageListTemplate.find(".icon-wrapper").html(profilePictureMessages);

        if (i === 0) {
          messageListTemplate.addClass("active").addClass("show");

          if (connectionsUser[i].lastMessage) {
            changeContent(connectionsUser[i].entityId, connectionsUser[i].lastMessage.id);
          } else {
            changeContentNoMessage(connectionsUser[i].entityId);
          }
        }
      }
    }
  });
}

function changeContentNoMessage(userId) {
  $(".sidebar-right-content").addClass("d-none d-xl-block");
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/userConversation/" + userId,
    headers: {
      Authorization: "Bearer " + $.cookie("authToken")
    },
    crossDomain: true,
    success: function (data) {
      var profileGroup = ``;
      var contentInfo = ``;

      if (data.admin) {
        var memberGroupTemplate = ``;
        var admin = data.admin;
        var profilePictureAdmin = ``;
        var profileGroupMember = ``;
        $.ajax({
          type: "GET",
          url: baseUrl + "/api/users/" + admin,
          async: false,
          headers: {
            Authorization: "Bearer " + $.cookie("authToken")
          },
          success: function (response) {
            if (response.profilePicture) {
              profilePictureAdmin = `
          <div class="icon-user-circle" style="opacity: 1 !important;"> 
            <img class="profile-picture-chat-list" src="https://api.youth-initiatives.com/api/attachments/${response.profilePicture}">
          </div>`;
            } else {
              profilePictureAdmin = `
              <div class="icon-user-circle">
                <img src="assets/img/icons/user-avatar-orange.svg" alt="Profile Picture" title="Profile Picture" />
            </div>
              `;
            }

            memberGroupTemplate += `
            <div class="members d-flex justify-content-between align-items-center px-3 py-2">
              <div class="d-flex align-items-center">
              <a href="user-profile-view.html?userId=${response.userId}">
                ${profilePictureAdmin}
              </a>
                <p class="mb-0 ml-2">
                  <a class="text-muted text-decoration-none" href="user-profile-view.html?userId=${response.userId}">
                    ${response.name}
                  </a>
              </p>
              </div>
              <div class="mb-0 ml-4">Admin</div>
            </div>`;
          }
        });
        var membersGroup = data.members;
        var groupId = data.userId;

        for (var k = 0; k < membersGroup.length; k++) {
          $.ajax({
            type: "GET",
            url: baseUrl + "/api/users/" + membersGroup[k],
            headers: {
              Authorization: "Bearer " + $.cookie("authToken")
            },
            async: false,
            success: function (response) {
              if (response.profilePicture) {
                profileGroupMember = `
                <div class="icon-user-circle" style="opacity: 1 !important;"> 
                  <img class="profile-picture-chat-list" src="https://api.youth-initiatives.com/api/attachments/${response.profilePicture}">
                </div>`;
              } else {
                profileGroupMember = `
                  <div class="icon-user-circle">
                    <img src="assets/img/icons/user-avatar-orange.svg" alt="Profile Picture" title="Profile Picture" />
                  </div>`;
              }

              memberGroupTemplate += `
                <div class="members d-flex justify-content-between px-3 py-2">
                  <div class="d-flex align-items-center">
                    ${profileGroupMember}
                    <p class="mb-0 ml-2">
                      <a class="text-muted text-decoration-none" href="user-profile-view.html?userId=${response.userId}">
                        ${response.name}
                      </a>
                    </p>
                  </div>
                  <button class="bg-transparent border-0 d-none-if-profile-view dropdown-toggle ml-2" id="edit-group-button-1" type="button" data-toggle="dropdown" aria-expanded="false">
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
                  <div class="dropdown-menu" aria-labelledby="#edit-group-button-3">
                    <a class="dropdown-item" id="delete-user-from-group" data-delete-id="${response.userId}">Delete user</a></div>
                </div>`;
            }
          });
        }

        if (data.profilePicture) {
          profileGroup = `
            <div class="icon-user-circle-overflow-auto position-relative" id="messages-user-info-profile-picture-image" style="opacity: 1 !important;">
              <div class="profile-picture-group-wrapper d-flex align-items-center justify-content-center overflow-hidden">
                <img class="profile-picture-group h-100" src="https://api.youth-initiatives.com/api/attachments/${data.profilePicture}">
              </div>
              <button class="button-upload-photo position-absolute" id="upload-group-image" data-toggle="modal" data-target="#modal-upload-picture-group">
                <div class="icon-user-circle" id="upload-group"><i class="cil-camera"></i></div>
              </button>
            </div>`;
        } else {
          profileGroup = `
  <div class="icon-user-circle-overflow-auto position-relative" id="messages-user-info-profile-picture-image">
    <svg id="icon-user-group" xmlns="http://www.w3.org/2000/svg" width="17" height="19" viewBox="0 0 17 19">
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
    <button class="button-upload-photo position-absolute" id="upload-group-image" data-toggle="modal" data-target="#modal-upload-picture-group">
      <div class="icon-user-circle" id="upload-group"><i class="cil-camera"></i></div>
    </button>
  </div>
  `;
        }

        var contentAddMember = ``;
        var members = data.members;
        var filteredMembers = [];
        var entityId = data.userId;
        var adminGroup = data.admin;
        $.ajax({
          type: "GET",
          url: baseUrl + "/api/users/" + $.cookie("authUserId"),
          async: false,
          headers: {
            Authorization: "Bearer " + $.cookie("authToken")
          },
          success: function (response) {
            let userConnections = response.connections;
            userConnections.map(conn => {
              if (!members.includes(conn.userId)) {
                filteredMembers.push(conn.userId);
              }
            });
          }
        });
        const noAdminGroupMembers = [];
        filteredMembers.map(el => {
          if (adminGroup !== el) {
            noAdminGroupMembers.push(el);
          }
        });
        noAdminGroupMembers.map(member => {
          $.ajax({
            type: "GET",
            url: baseUrl + "/api/users/" + member,
            async: false,
            headers: {
              Authorization: "Bearer " + $.cookie("authToken")
            },
            success: function (response) {
              var pic = ``;

              if (response.profilePicture) {
                pic = `
                <div class="icon-user-circle" style="opacity: 1 !important;"> 
              <img class="profile-picture-chat-list" src="https://api.youth-initiatives.com/api/attachments/${response.profilePicture}">
          </div>`;
              } else {
                pic = `<div class="icon-user-circle">
                <img src="assets/img/icons/user-avatar-orange.svg" alt="Profile Picture" title="Profile Picture" />
            </div>`;
              }

              contentAddMember += `
              <div class="row py-2 no-gutters align-items-center justify-content-between" id="content-user-group">
                    <div class="col-auto px-3 w-25 d-flex align-items-center">
                    <input type="checkbox" data-user-group-id="${member}" id="input-group-users">
                      <div class="icon-wrapper">
                          ${pic}
                    </div>
                  </div>
                  <div class="col">
                    <span class="pl-3" id="user-member-name">
                        ${response.name}
                    </span>
                  </div>
                </div>`;
            }
          });
        });
        contentInfo = `
        <div class="c-sidebar-nav right-sidebar-members-menu d-none d-xl-block">
          <div class="border-bottom d-flex align-items-center justify-content-center flex-column pb-4">
            ${profileGroup}
            <div id="message-board-name" class="font-weight-bold mt-3 mb-0" data-group-id=${data.userId}></div>
            <button class="border-0 a add-new-group-message bg-transparent ml-2 mt-2 mb-2 mr-1 p-0 m-0" type="button" data-toggle="modal" data-target="#edit-group-modal">
            <img src="assets/img/icons/edit.png" style="width:20px; heigth:auto;" alt="Add contact" title="Add contact" />
            </button>     
            </div>
          <div class="members-group">
            <p class="text-muted font-weight-bold mt-3 px-3">MEMBERS</p>
            <div class="content-members">
              <div class="add-member d-flex align-items-center px-3 py-2" data-toggle="modal" data-target="#modal-add-member-to-group">
                <div class="icon-user-circle mr-2"><i class="cil-plus"></i></div>
                <p class="m-0">Add member</p>
              </div>
                ${memberGroupTemplate}
            </div>
          </div>
        </div>
        <div class="modal" tabindex="-1" role="dialog" id="modal-upload-picture-group" aria-modal="true" data-user-id = ${data.userId}>
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Upload group picture</h5>
                <button class="close text-dark" type="button" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
              </div>
              <form class="p-3" id="upload-profile-group-form" data-group-id="${data.userId}">
                <input id="upload-profile-group-input" type="file" style="display: none" name="attachment" accept="image/*">
                <div class="row">
                  <div class="col-sm-6">
                    <label class="custom-file-upload-label choose-file-shared-files d-flex align-items-center justify-content-center" for="upload-profile-group-input">
                      <div>
                        <div class="text-center mb-3"><i class="cil-cloud-download"></i></div>
                        <div class="text-center">Click here to upload<br>your file</div>
                      </div>
                    </label>
                  </div>
                  <div class="col-sm-6 text-wrap">
                    <p class="d-flex align-items-center file-name-attachment"><span class="d-none file-icon"><i class="cil-file"></i></span><span id="file-name"></span></p>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" type="button" data-dismiss="modal">Close</button>
                  <button class="btn btn-primary" id="btnSubmit" type="submit">Submit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="modal" tabindex="-1" role="dialog" id="modal-add-member-to-group" aria-modal="true">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Add member</h5>
                <button class="close text-dark" type="button" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
              </div>
              <form id="add-member-to-group-form" data-groupid="${groupId}">
                <div class="modal-body">
                  <p class="p-0 mb-1">Add member to your group</p>
                  <input class="form-control pl-2" id="search-add-members" type="text" placeholder="Search members" aria-label="Username" aria-describedby="basic-addon1">
                  <div class="content-members-group">
                    ${contentAddMember}
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" type="button" data-dismiss="modal">Close</button>
              <button class="btn btn-primary" id="add-member-button" type="submit">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
        $("#message-board-name").html(`<span>${data.name}</span>`);
      } else {
        contentInfo = `
          <div class="c-sidebar-nav right-sidebar-members-menu d-none d-xl-block">
            <div class="border-bottom">
              <div class="d-flex align-items-center justify-content-center" id="messages-user-info-profile-picture"><p class="messages-user-info-picture text-center"><img src="https://api.youth-initiatives.com/api/attachments/5ea17b4404c76d2966040e3c"></p></div>
                <h5 class="text-center" id="messages-user-info-name"><a href="user-profile-view.html?userId=5ea17ae904c76d2966040e3b">adela popa</a></h5>
                <p class="text-center" id="messages-user-info-website">adela.popa2@gmail.com</p>
              </div>
              <div class="border-bottom pb-3">
                <p class="text-uppercase font-weight-bold user-profile-focus-title p-3 pb-0 mb-0">Focus areas</p>
                <p class="p-0 m-0 text-center" id="messages-user-info-domains"><span class="badge badge-pill messages-user-info-badge ml-2">Children with autism</span><span class="badge badge-pill messages-user-info-badge ml-2">Culture</span><span class="badge badge-pill messages-user-info-badge ml-2">Environment</span><span class="badge badge-pill messages-user-info-badge ml-2">Music</span></p>
              </div>
              <div class="border-bottom pb-3">
                <p class="text-uppercase p-3 pb-0 mb-0 font-weight-bold user-profile-shared-title">Shared Files</p>
                <div class="text-center px-3" id="messages-user-info-shared-files">
                  <ul class="list-group list-group-flush m-0 shared-resources list-unstyled">
                    <li class="list-group-item p-0">
                      <div class="row no-gutters align-items-center pb-3 shared-file-messages-row">
                        <div class="col-auto">
                          <i class="cil-file" style="font-size: 25px;"></i>
                        </div>
                        <div class="pl-3">Teoria Vectoril[...]</div>
                      </div>
                    </li>
                    <li class="list-group-item p-3 text-left">
                      <span><a class="text-muted font-weight-bold" href="shared-files.html?userId=5ea17ae904c76d2966040e3b">See more</a></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>`;
      }

      $("#container-info-chat").html(contentInfo);
      $("form#send-message-to-user-form").attr("data-reciever-id", userId);
      $("h5#messages-user-info-name").html(`<a href="user-profile-view.html?userId=${userId}">${data.name}</a>`);
      $("div#message-board-name").html(`<span>${data.name}</span>`);

      if (data.profilePicture) {
        $("div#messages-user-info-profile-picture").html(`<a href="user-profile-view.html?userId=${data.userId}">
              <p class="messages-user-info-picture text-center">
                <img src="https://api.youth-initiatives.com/api/attachments/${data.profilePicture}">
              </p>
            </a>`);
      } else {
        $("div#messages-user-info-profile-picture").html(`<a href="user-profile-view.html?userId=${data.userId}">
              <p class="messages-user-info-picture text-center">
                <img src="assets/img/icons/user-avatar-orange-big.svg" alt="Profile Picture" title="Profile Picture" />
              </p>
            </a>`);
      }

      if (data.showEmail) {
        $("p#messages-user-info-website").html(data.email);
      } else {
        $("p#messages-user-info-website").hide();
      }

      var domains = [];

      for (var i = 0; i < data.domains.length; i++) {
        domains.push(data.domains[i]);
      }

      if (data.domains.length) {
        var authToken = $.cookie("authToken");
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
            var userDomainBadge = ``;

            for (var j = 0; j < response.length; j++) {
              for (var k = 0; k < domains.length; k++) {
                if (response[j].id == domains[k]) {
                  userDomainBadge += `<span class="badge badge-pill messages-user-info-badge ml-2 mb-2">${response[j].name}</span>`;
                  $("p#messages-user-info-domains").html(userDomainBadge);
                }
              }
            }
          }
        });
      }
    }
  });
  loadConversation(userId);
  showSharedFiles(userId, $.cookie("authToken"));
}

function changeContent(userId, lastMessageId) {
  $(".sidebar-right-content").addClass("d-none d-xl-block");
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/userConversation/" + userId,
    headers: {
      Authorization: "Bearer " + $.cookie("authToken")
    },
    crossDomain: true,
    success: function (data) {
      var profileGroup = ``;
      var contentInfo = ``;

      if (data.admin) {
        var memberGroupTemplate = ``;
        var admin = data.admin;
        var profilePictureAdmin = ``;
        var profileGroupMember = ``;
        $.ajax({
          type: "GET",
          url: baseUrl + "/api/users/" + admin,
          async: false,
          headers: {
            Authorization: "Bearer " + $.cookie("authToken")
          },
          success: function (response) {
            if (response.profilePicture) {
              profilePictureAdmin = `
          <div class="icon-user-circle" style="opacity: 1 !important;"> 
              <img class="profile-picture-chat-list" src="https://api.youth-initiatives.com/api/attachments/${response.profilePicture}">
          </div>`;
            } else {
              profilePictureAdmin = `
              <div class="icon-user-circle">
                <img src="assets/img/icons/user-avatar-orange.svg" alt="Profile Picture" title="Profile Picture" />
            </div>
              `;
            }

            memberGroupTemplate += `
            <div class="members d-flex justify-content-between align-items-center px-3 py-2">
              <div class="d-flex align-items-center">
                <a href="user-profile-view.html?userId=${response.userId}">
                  ${profilePictureAdmin}
                </a>
                <p class="mb-0 ml-2">
                  <a class="text-muted text-decoration-none" href="user-profile-view.html?userId=${response.userId}">
                    ${response.name}
                  </a>
                </p>
              </div>
              <div class="mb-0 ml-4">Admin</div>
            </div>`;
          }
        });
        var membersGroup = data.members;
        var groupId = data.userId;

        for (var k = 0; k < membersGroup.length; k++) {
          $.ajax({
            type: "GET",
            url: baseUrl + "/api/users/" + membersGroup[k],
            headers: {
              Authorization: "Bearer " + $.cookie("authToken")
            },
            async: false,
            success: function (response) {
              if (response.profilePicture) {
                profileGroupMember = `
                <div class="icon-user-circle" style="opacity: 1 !important;"> 
                  <img class="profile-picture-chat-list" src="https://api.youth-initiatives.com/api/attachments/${response.profilePicture}">
                </div>`;
              } else {
                profileGroupMember = `
                  <div class="icon-user-circle">
                    <img src="assets/img/icons/user-avatar-orange.svg" alt="Profile Picture" title="Profile Picture" />
                  </div>`;
              }

              memberGroupTemplate += `
                <div class="members d-flex justify-content-between px-3 py-2">
                  <div class="d-flex align-items-center">
                    <a href="user-profile-view.html?userId=${response.userId}">
                      ${profileGroupMember}
                    </a>
                    <p class="mb-0 ml-2">
                      <a class="text-muted text-decoration-none" href="user-profile-view.html?userId=${response.userId}">
                        ${response.name}
                      </a>
                    </p>
                  </div>
                  <button class="bg-transparent border-0 d-none-if-profile-view dropdown-toggle ml-2" id="edit-group-button-1" type="button" data-toggle="dropdown" aria-expanded="false">
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
                        <circle class="b" cx="2" cy="2" r="2" transform="translate(1326 461)" style="stroke: transparent !important;"></circle>
                        <circle class="b" cx="2" cy="2" r="2" transform="translate(1332 461)" style="stroke: transparent !important;"></circle>
                        <circle class="b" cx="2" cy="2" r="2" transform="translate(1338 461)" style="stroke: transparent !important;"></circle>
                      </g>
                    </svg>
                  </button>
                  <div class="dropdown-menu" aria-labelledby="#edit-group-button-3">
                    <a class="dropdown-item" id="delete-user-from-group" data-delete-id="${response.userId}">Delete user</a></div>
                </div>`;
            }
          });
        }

        if (data.profilePicture) {
          profileGroup = `
            <div class="icon-user-circle-overflow-auto position-relative" id="messages-user-info-profile-picture-image" style="opacity: 1 !important;">
              <div class="profile-picture-group-wrapper d-flex align-items-center justify-content-center overflow-hidden">
                <img class="profile-picture-group h-100" src="https://api.youth-initiatives.com/api/attachments/${data.profilePicture}">
              </div>
              <button class="button-upload-photo position-absolute" id="upload-group-image" data-toggle="modal" data-target="#modal-upload-picture-group">
                <div class="icon-user-circle" id="upload-group"><i class="cil-camera"></i></div>
              </button>
            </div>`;
        } else {
          profileGroup = `
  <div class="icon-user-circle-overflow-auto position-relative" id="messages-user-info-profile-picture-image">
    <svg id="icon-user-group" xmlns="http://www.w3.org/2000/svg" width="17" height="19" viewBox="0 0 17 19">
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
    <button class="button-upload-photo position-absolute" id="upload-group-image" data-toggle="modal" data-target="#modal-upload-picture-group">
      <div class="icon-user-circle" id="upload-group"><i class="cil-camera"></i></div>
    </button>
  </div>
  `;
        }

        var contentAddMember = ``;
        var members = data.members;
        var filteredMembers = [];
        var entityId = data.userId;
        var adminGroup = data.admin;
        $.ajax({
          type: "GET",
          url: baseUrl + "/api/users/" + $.cookie("authUserId"),
          async: false,
          headers: {
            Authorization: "Bearer " + $.cookie("authToken")
          },
          success: function (response) {
            let userConnections = response.connections;
            userConnections.map(conn => {
              if (!members.includes(conn.userId)) {
                filteredMembers.push(conn.userId);
              }
            });
          }
        });
        const noAdminGroupMembers = [];
        filteredMembers.map(el => {
          if (adminGroup !== el) {
            noAdminGroupMembers.push(el);
          }
        });
        noAdminGroupMembers.map(member => {
          $.ajax({
            type: "GET",
            url: baseUrl + "/api/users/" + member,
            async: false,
            headers: {
              Authorization: "Bearer " + $.cookie("authToken")
            },
            success: function (response) {
              var pic = ``;

              if (response.profilePicture) {
                pic = `
                <div class="icon-user-circle" style="opacity: 1 !important;"> 
              <img class="profile-picture-chat-list" src="https://api.youth-initiatives.com/api/attachments/${response.profilePicture}">
          </div>`;
              } else {
                pic = `<div class="icon-user-circle">
                <img src="assets/img/icons/user-avatar-orange.svg" alt="Profile Picture" title="Profile Picture" />
            </div>`;
              }

              contentAddMember += `
              <div class="row py-2 no-gutters align-items-center justify-content-between" id="content-user-group">
                    <div class="col-auto px-3 w-25 d-flex align-items-center">
                    <input type="checkbox" data-user-group-id="${member}" id="input-group-users">
                      <div class="icon-wrapper">
                        ${pic}
                    </div>
                  </div>
                  <div class="col">
                    <span class="pl-3" id="user-member-name">
                      ${response.name}
                    </span>
                  </div>
                </div>    
            
            `;
            }
          });
        });
        contentInfo = `
        <div class="c-sidebar-nav right-sidebar-members-menu d-none d-xl-block">
          <div class="border-bottom d-flex align-items-center justify-content-center flex-column pb-4">
            ${profileGroup}
            <div id="message-board-name" class="font-weight-bold mt-3 mb-0" data-group-id=${data.userId}></div>     
            <button class="border-0 a add-new-group-message bg-transparent ml-2 mt-2 mb-2 mr-1 p-0 m-0" type="button" data-toggle="modal" data-target="#edit-group-modal">
            <img src="assets/img/icons/edit.png" style="width:20px; heigth:auto;" alt="Add contact" title="Add contact" />
            </button>     
            </div>
          <div class="members-group">
            <p class="text-muted font-weight-bold mt-3 px-3">MEMBERS</p>
            <div class="content-members">
              <div class="add-member d-flex align-items-center px-3 py-2" data-toggle="modal" data-target="#modal-add-member-to-group">
                <div class="icon-user-circle mr-2"><i class="cil-plus"></i></div>
                <p class="m-0">Add member</p>
              </div>
                ${memberGroupTemplate}
            </div>
          </div>
        </div>
        <div class="modal" tabindex="-1" role="dialog" id="modal-upload-picture-group" aria-modal="true" data-user-id = ${data.userId}>
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Upload group picture</h5>
                <button class="close text-dark" type="button" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
              </div>
              <form class="p-3" id="upload-profile-group-form" data-group-id="${data.userId}">
                <input id="upload-profile-group-input" type="file" style="display: none" name="attachment" accept="image/*">
                <div class="row">
                  <div class="col-sm-6">
                    <label class="custom-file-upload-label choose-file-shared-files d-flex align-items-center justify-content-center" for="upload-profile-group-input">
                      <div>
                        <div class="text-center mb-3"><i class="cil-cloud-download"></i></div>
                        <div class="text-center">Click here to upload<br>your file</div>
                      </div>
                    </label>
                  </div>
                  <div class="col-sm-6 text-wrap">
                    <p class="d-flex align-items-center file-name-attachment"><span class="d-none file-icon"><i class="cil-file"></i></span><span id="file-name"></span></p>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" type="button" data-dismiss="modal">Close</button>
                  <button class="btn btn-primary" id="btnSubmit" type="submit">Submit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="modal" tabindex="-1" role="dialog" id="modal-add-member-to-group" aria-modal="true">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Add member</h5>
                <button class="close text-dark" type="button" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
              </div>
              <form id="add-member-to-group-form" data-groupid="${groupId}">
                <div class="modal-body">
                  <p class="p-0 mb-1">Add member</p>
                  <input class="form-control pl-2" id="search-add-members" type="text" placeholder="Search members" aria-label="Username" aria-describedby="basic-addon1">
                  <div class="content-members-group">
                    ${contentAddMember}
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" type="button" data-dismiss="modal">Close</button>
              <button class="btn btn-primary" id="add-member-button" type="submit">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
        $("#message-board-name").html(`<span>${data.name}</span>`);
      } else {
        contentInfo = `
          <div class="c-sidebar-nav right-sidebar-members-menu d-none d-xl-block">
            <div class="border-bottom pb-3">
              <div class="d-flex align-items-center justify-content-center" id="messages-user-info-profile-picture"><p class="messages-user-info-picture text-center"><img src="https://api.youth-initiatives.com/api/attachments/5ea17b4404c76d2966040e3c"></p></div>
                <h5 class="text-center" id="messages-user-info-name"><a class="text-muted" href="user-profile-view.html?userId=5ea17ae904c76d2966040e3b">adela popa</a></h5>
                <p class="text-center text-muted" id="messages-user-info-website">adela.popa2@gmail.com</p>
              </div>
              <div class="border-bottom pb-3">
                <p class="text-uppercase font-weight-bold user-profile-focus-title p-3 pb-0 mb-0">Focus areas</p>
                <p class="p-0 m-0 text-center" id="messages-user-info-domains"><span class="badge badge-pill messages-user-info-badge ml-2">Children with autism</span><span class="badge badge-pill messages-user-info-badge ml-2">Culture</span><span class="badge badge-pill messages-user-info-badge ml-2">Environment</span><span class="badge badge-pill messages-user-info-badge ml-2">Music</span></p>
              </div>
              <div class="border-bottom pb-3">
                <p class="text-uppercase p-3 pb-0 mb-0 font-weight-bold user-profile-shared-title">Shared Files</p>
                <div class="text-center px-3" id="messages-user-info-shared-files">
                  <ul class="list-group list-group-flush m-0 shared-resources list-unstyled">
                    <li class="list-group-item p-0">
                      <div class="row no-gutters align-items-center pb-3 shared-file-messages-row">
                        <div class="col-auto">
                          <i class="cil-file" style="font-size: 25px;"></i>
                        </div>
                        <div class="pl-3">Teoria Vectoril[...]</div>
                      </div>
                    </li>
                    <li class="list-group-item p-3 text-left">
                      <span><a class="font-weight-bold text-muted" href="shared-files.html?userId=5ea17ae904c76d2966040e3b">See more</a></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>`;
      }

      $("#container-info-chat").html(contentInfo);
      $("form#send-message-to-user-form").attr("data-reciever-id", userId);
      $("h5#messages-user-info-name").html(`<a class="text-muted" href="user-profile-view.html?userId=${userId}">${data.name}</a>`);
      $("div#message-board-name").html(`<span>${data.name}</span>`);

      if (data.profilePicture) {
        $("div#messages-user-info-profile-picture").html(`<a href="user-profile-view.html?userId=${data.userId}">
            <p class="messages-user-info-picture text-center">
              <img src="https://api.youth-initiatives.com/api/attachments/${data.profilePicture}">
            </p>
          </a>`);
      } else {
        $("div#messages-user-info-profile-picture").html(`<a href="user-profile-view.html?userId=${data.userId}">
            <p class="messages-user-info-picture text-center">
              <img src="https://via.placeholder.com/80">
            </p>
          </a>`);
      }

      if (data.showEmail) {
        $("p#messages-user-info-website").html(data.email);
      } else {
        $("p#messages-user-info-website").hide();
      }

      var domains = [];

      for (var i = 0; i < data.domains.length; i++) {
        domains.push(data.domains[i]);
      }

      if (data.domains.length) {
        var authToken = $.cookie("authToken");
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
            var userDomainBadge = ``;

            for (var j = 0; j < response.length; j++) {
              for (var k = 0; k < domains.length; k++) {
                if (response[j].id == domains[k]) {
                  userDomainBadge += `<span class="badge badge-pill messages-user-info-badge ml-2 mb-2">${response[j].name}</span>`;
                  $("p#messages-user-info-domains").html(userDomainBadge);
                }
              }
            }
          }
        });
      }
    }
  });
  loadConversation(userId);
  showSharedFiles(userId, $.cookie("authToken"));
}

function filterUserMessages() {
  $(document).on("keyup", "input#search-users-input", function () {
    var value = $(this).val().toLowerCase();
    $("div.messages-list").children().each(function () {
      var name = $(this).find("span#chat-menu-user-name").text().toLowerCase();
      $(this).toggle(name.toLowerCase().indexOf(value) > -1);
    });
  });
}

function addNewContactMessage() {
  $(document).on("click", "a.add-new-contact-message", function (e) {
    e.preventDefault();
    $("div.messages-list").children().each(function () {
      $(this).removeClass("active");
    });
    $(".tab-content").children().each(function () {
      $(this).removeClass("active").removeClass("show");
    });
    $("#v-pills-new-message").addClass("active").addClass("show");
    $(".messages-content").removeClass("col-xl-8").addClass("col-xl-12");
    $(".sidebar-right-content").addClass("d-none").removeClass("d-xl-block");
  });
  $(document).on("click", "a#messages-list-item", function () {
    $(this).addClass("active").addClass("show");
    var userId = $(this).attr("data-user-id");
    $("#v-pills-new-message").removeClass("active").removeClass("show");
    $("#v-pills-home").addClass("active").addClass("show");
    $(".messages-content").addClass("col-xl-8").removeClass("col-xl-12");
    $(".sidebar-right-content").removeClass("d-none");
    var lastMessageId = $(this).attr("data-last-message");

    if (lastMessageId) {
      changeContent(userId, lastMessageId);
    } else {
      changeContentNoMessage(userId);
    }
  });
}

function tagSelectorInit() {
  let userId = $.cookie("authUserId");
  let authToken = $.cookie("authToken");
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/" + userId,
    headers: {
      Authorization: "Bearer " + authToken
    },
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", "Bearer " + authToken);
    },
    success: function (response) {
      let connections = response.connections;
      $(".connections-search-select2").select2({
        templateResult: formatState
      });
      $("span.select2.select2-container.select2-container--default").addClass("form-control");

      if (connections.length) {
        for (var i = 0; i < connections.length; i++) {
          var domainTemplate = ``;
          var connectionMessageTemplate = ``;
          var connectionId = connections[i].userId;
          $.ajax({
            type: "GET",
            url: baseUrl + "/api/users/" + connectionId,
            headers: {
              Authorization: "Bearer " + authToken
            },
            beforeSend: function (xhr) {
              xhr.setRequestHeader("Authorization", "Bearer " + authToken);
            },
            success: function (response) {
              var profilePictureAddMemberTemplate = ``;
              var contentAddMember = ``;

              if (response.userType == "SINGLE_USER") {
                if (response.profilePicture) {
                  profilePictureAddMemberTemplate = `
                  <div class="icon-user-circle" style="opacity: 1 !important;">
                    <img class="profile-picture-connections" src="https://api.youth-initiatives.com/api/attachments/${response.profilePicture}">
                  </div>
                  `;
                } else {
                  profilePictureAddMemberTemplate = `
                        <div class="icon-user-circle">
                            <img src="assets/img/icons/user-avatar-orange.svg" alt="Profile Picture" title="Profile Picture" />
                        </div>
                  `;
                }

                contentAddMember = `
                <div class="row py-2 no-gutters align-items-center justify-content-between" id="content-user-group">
                  <div class="col-auto px-3 w-25 d-flex align-items-center">
                    <input type="checkbox" data-user-group-id=${response.userId} id="input-group-users">
                    <div class="icon-wrapper">
                      ${profilePictureAddMemberTemplate}
                    </div>
                  </div>
                  <div class="col">
                      <span class="pl-3" id="user-member-name"> 
                          ${response.name}
                      </span>
                  </div>
              </div>
                `;
                $(".content-members-group").append(contentAddMember);
              }
            }
          });
          domainTemplate = `
              <option value="${connections[i].profilePicture}" data-user-id="${connections[i].userId}">
                ${connections[i].name}
                </option>`;
          $("select.connections-search-select2").append(domainTemplate);
          var profilePictureMessagesGroup = ``;

          if (connections[i].profilePicture) {
            profilePictureMessagesGroup = `
            <div class="icon-user-circle" style="opacity: 1 !important;">
              <img class="profile-picture-connections" src="https://api.youth-initiatives.com/api/attachments/${connections[i].profilePicture}">
            </div>
            `;
          } else {
            profilePictureMessagesGroup = `
          <div class="icon-user-circle">
              <img src="assets/img/icons/user-avatar-orange.svg" alt="Profile Picture" title="Profile Picture" />
            </div>
            `;
          }

          connectionMessageTemplate = `
          <div class="row py-2 no-gutters align-items-center justify-content-between" id="content-user-group">
            <div class="col-auto px-3 w-25 d-flex align-items-center">
            <input type="checkbox" data-user-group-id=${connections[i].userId} id="input-group-users">
              <div class="icon-wrapper">
                ${profilePictureMessagesGroup}
              </div>
            </div>
            <div class="col">
              <span class="pl-3" id="user-member-name">
                  ${connections[i].name}
              </span>
            </div>
          </div>
          `;
          $(".connection-template-message-group").append(connectionMessageTemplate);
          $("input[type='checkbox']").bind("click", function () {
            $(this).attr("checked", $(this).is(":checked"));
          });
        }
      } else {
        $(".no-domain-message").removeClass("d-none");
      }
    },
    error: function () {
      alert("Connections listing failed!");
    }
  });
}

function formatState(state) {
  if (!state.id) {
    return state.text;
  }

  var baseUrl = "https://api.youth-initiatives.com/api/attachments";
  var $state = "";

  if (state.element.value === "null") {
    $state = $('<span><img class="img-flag" src="https://via.placeholder.com/80" alt="profile picture"> ' + state.text + "</span>");
  } else {
    $state = $('<span><img src="' + baseUrl + "/" + state.element.value + '" class="img-flag" /> ' + state.text + "</span>");
  }

  return $state;
}

function showSharedFiles(userId, authToken) {
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/" + userId + "/attachments?page=0&size=10&sort=createdAt,desc",
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (data) {
      var files = data.content;

      if (files.length) {
        var messagesInfoSharedFile = ``;

        for (var i = 0; i < files.length; i++) {
          if (i < 5) {
            var fileNameMessage = files[i].title;

            if (fileNameMessage.length > 15) {
              fileNameMessage = fileNameMessage.substring(0, 15) + "[...]";
            }

            var paddingFiles = "pb-3";

            if (i !== 0) {
              paddingFiles = "py-3";
            }

            messagesInfoSharedFile += `
                <li class="list-group-item p-0">
                  <div class="row no-gutters align-items-center ${paddingFiles} shared-file-messages-row">
                    <div class="col-auto">
                      <i class="cil-file" style="font-size: 25px;"></i>
                    </div>
                    <div class="pl-3">${fileNameMessage}</div>
                  </div>
                </li>`;
          }
        }

        messagesInfoSharedFile += `
        <li class="list-group-item p-3 text-left">
          <span><a class="font-weight-bold text-muted" href="shared-files.html?userId=${userId}">See more</a></span>
        </li>`;
        $("ul.shared-resources").html(messagesInfoSharedFile);
      } else {
        $("ul.shared-resources").html("This user has no uploaded files").addClass("mb-2");
      }
    }
  });
}

function sortConnection() {
  $(document).on("keyup", "input#search-for-group", function () {
    var value = $(this).val().toLowerCase();
    $(".connection-template-message-group").children().each(function () {
      var name = $(this).text().toLowerCase();
      $(this).toggle(name.toLowerCase().indexOf(value) > -1);
    });
  });
}

function sendMessagesPressingEnter() {
  $("form#send-message-to-user-form textarea").keypress(function (e) {
    if (e.keyCode == 13 && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

function sendMessageClickingButton() {
  $("a#send-message").on("click", function (e) {
    e.preventDefault();
    sendMessage();
  });
}

var attachId = "";
var fileName = "";

function uploadPictures() {
  var attachemntIds = [];
  var files = $("#files")[0].files;

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
        var fileNameCreatePost = files[i].name;
        fileName = files[i].name;

        if (fileNameCreatePost.length > 20) {
          fileNameCreatePost = fileNameCreatePost.substring(0, 20) + "[...]";
        }

        $("div#file-name").append(`
      <div class="d-flex justify-content-between align-items-center mb-3 w-75" data-attachment-id="${data.id}">
        <div class="d-flex align-items-center">
            <div><i class="cil-file" style="font-size: 30px; padding-right:10px;"></i></div>
            <div>${fileNameCreatePost ? fileNameCreatePost : "filename"}</div>
        </div>
        <div id="delete-attachment" class="p-2" style="cursor: pointer">
            <i class="cil-x text-dark"></i>
        </div>
    </div>
    `);
        attachemntIds.push(data.id);
        attachId = data.id;
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
}

function sendMessage() {
  var message = $("form#send-message-to-user-form textarea").val();
  var recieverId = $("form#send-message-to-user-form").attr("data-reciever-id");
  var currentUserIdToken = $.cookie("authToken");

  if (message.length > 0) {
    $.ajax({
      type: "POST",
      contentType: "application/x-www-form-urlencoded",
      url: baseUrl + "/api/users/sendMessage/" + recieverId,
      headers: {
        Authorization: "Bearer " + currentUserIdToken
      },
      data: {
        message: message,
        attachmentId: attachId
      },
      success: function () {
        $("form#send-message-to-user-form textarea").val("");
        var templateMessage = `
            <div class="message">
              <div class="user-message">
                <div class="d-flex align-items-start justify-content-end">
                  <div class="message">
                    <p class="m-0">${message}</p>
                  </div>
                </div>
              </div>
            </div>
          `;
        $(".message-page-wrapper-content").append(templateMessage);
        $(".message-page-wrapper-content").scrollTop($(".message-page-wrapper-content").prop("scrollHeight"));
      },
      error: function (error) {}
    });
  } else {
    if (attachId.length > 0) {
      $.ajax({
        type: "POST",
        contentType: "application/x-www-form-urlencoded",
        url: baseUrl + "/api/users/sendMessage/" + recieverId,
        headers: {
          Authorization: "Bearer " + currentUserIdToken
        },
        data: {
          message: fileName,
          attachmentId: attachId
        },
        success: function () {
          $("form#send-message-to-user-form input").val("");

          if (fileName > 15) {
            fileName = fileName.substring(0, 15) + "[...]";
          }

          var templateMessage = `
              <div class="message">
                <div class="user-message">
                  <div class="d-flex align-items-start justify-content-end">
                    <div class="message">
                    <a href="https://api.youth-initiatives.com/api/attachments/${attachId}" class="m-0"><i class="cil-arrow-thick-to-bottom"></i>  ${fileName}</a>
                    </div>
                  </div>
                </div>
              </div>
            `;
          $(".message-page-wrapper-content").append(templateMessage);
          $(".message-page-wrapper-content").scrollTop($(".message-page-wrapper-content").prop("scrollHeight"));
        },
        error: function (error) {}
      });
    }
  }
}

function loadConversation(userId) {
  var iconUserCircle = ``;
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/" + userId,
    async: false,
    headers: {
      Authorization: "Bearer " + $.cookie("authToken")
    },
    success: function (response) {
      var profilePicture = `
      <a class="w-100 h-100" href="user-profile-view.html?userId=${response.userId}">
        <img src="https://api.youth-initiatives.com/api/attachments/${response.profilePicture}" alt="profile picture">
      </a>`;

      if (profilePicture != null) {
        iconUserCircle = profilePicture;
      } else {
        iconUserCircle = `
      <div class="icon-user-circle profile-picture-user-messages">
        <a href="user-profile-view.html?userId=${response.userId}">
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="19" viewbox="0 0 17 19">
              <defs>
                <style> a{
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
      </div>`;
      }
    }
  });
  var messagesTemplate = `
  <div class="user-third-party-message">
    <div class="d-flex align-items-start">
        <div class="px-2 px-md-4">
          <div class="profile-picture-user-messages">
              ${iconUserCircle}
          </div>
        </div>
        <div class="message">
            <span class="m-0" id="content-message-third-party-user">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi</span>
        </div>
    </div>
</div>
<div class="user-message">
    <div class="d-flex align-items-start justify-content-end">
        <div class="message">
            <span class="m-0" id="content-message-user">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi</span>
        </div>
    </div>
</div>
  `;
  $(".message-page-wrapper-content").html(messagesTemplate);
  let authUserId = $.cookie("authUserId");
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/users/conversation/" + userId,
    headers: {
      Authorization: "Bearer " + $.cookie("authToken")
    },
    crossDomain: true,
    success: function (data) {
      if (data.length) {
        if (data[data.length - 1].status === "UNREAD") {
          var lastMessageId = data[data.length - 1].id;
          $.ajax({
            type: "POST",
            url: baseUrl + "/api/users/message/" + lastMessageId + "/change-status",
            headers: {
              Authorization: "Bearer " + $.cookie("authToken")
            },
            contentType: "application/x-www-form-urlencoded",
            success: function (data) {
              var conversationsUnread = $(".message-badge-notification").text();

              if (conversationsUnread <= 0) {
                $(".message-badge-notification").addClass("badge-d-none").removeClass("badge");
              } else {
                $(".message-badge-notification").html(conversationsUnread - 1);
              }

              $("a[data-last-message*=" + lastMessageId + "]").find("span#chat-menu-user-name").removeClass("font-weight-bold");
            }
          });
        }
      }

      var userMessage = $(".user-message");
      userMessage.hide();
      var thirdPartyMessage = $(".user-third-party-message");
      thirdPartyMessage.hide();

      for (var i = 0; i < data.length; i++) {
        var templateMessages;

        if (data[i].senderId === authUserId) {
          templateMessages = userMessage.clone().show().appendTo(".message-page-wrapper-content");
        } else {
          templateMessages = thirdPartyMessage.clone().show().appendTo(".message-page-wrapper-content.w-100");
          var senderId = data[i].senderId;
          var groupId = data[i].group;
          $.ajax({
            type: "GET",
            url: baseUrl + "/api/users/" + senderId,
            async: false,
            headers: {
              Authorization: "Bearer " + $.cookie("authToken")
            },
            success: function (response) {
              if (groupId) {
                templateMessages.prepend(`<div class="ml-4 text-muted">${response.name}</div>`);
              }

              if (response.profilePicture) {
                var profilePicture = `
                <a class="w-100 h-100" href="user-profile-view.html?userId=${response.userId}">
                  <img src="https://api.youth-initiatives.com/api/attachments/${response.profilePicture}" alt="profile picture">
                </a>`;
                $(".profile-picture-user-messages").html(profilePicture);
              } else {
                iconUserCircle = `
                <div class="icon-user-circle profile-picture-user-messages" style="opacity: .7; cursor: pointer;">
                  <a href="user-profile-view.html?userId=${response.userId}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="19" viewbox="0 0 17 19">
                        <defs>
                          <style> a{
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
                </div>`;
                $(".profile-picture-user-messages").html(iconUserCircle);
              }
            }
          });
        }

        if (data[i].attachmentId != null && data[i].attachmentId != "") {
          var newMessage;

          if (data[i].message.length > 15) {
            newMessage = data[i].message.substring(0, 15) + "[...]";
          }

          data[i].message = `<a href="https://api.youth-initiatives.com/api/attachments/${data[i].attachmentId}" class="m-0"><i class="cil-arrow-thick-to-bottom"></i>  ${newMessage}</a>`;
          templateMessages.find("span").html(data[i].message);
          $(".message-page-wrapper-content").scrollTop($(".message-page-wrapper-content").prop("scrollHeight"));
        } else {
          templateMessages.find("span").html(data[i].message);
          $(".message-page-wrapper-content").scrollTop($(".message-page-wrapper-content").prop("scrollHeight"));
        }
      }
    }
  });
}

function submitCreateGroup() {
  $(document).on("submit", "form#create-group", function (e) {
    e.preventDefault();
    var members = [];
    var nameGroup = $("input#name-group").val();
    $(this).find("input[type=checkbox]").each(function () {
      if ($(this).is(":checked")) {
        var id = $(this).attr("data-user-group-id");
        members.push(id);
      }
    });
    var authToken = $.cookie("authToken");
    $.ajax({
      type: "POST",
      contentType: "application/json",
      url: baseUrl + "/api/users/createGroup",
      headers: {
        Authorization: "Bearer " + authToken
      },
      data: JSON.stringify({
        name: nameGroup,
        members: members
      }),
      success: function () {
        location.reload(true);
      }
    });
  });
}

function submitEditGroup() {
  $(document).on("submit", "form#edit-group", function (e) {
    e.preventDefault();
    var nameGroup = $("input#edit-name-group").val();
    var authToken = $.cookie("authToken");
    var userId = $("#message-board-name").attr("data-group-id");
    $.ajax({
      type: "POST",
      contentType: "application/json",
      url: baseUrl + "/api/users/" + userId + "/nameForMessageGroup",
      headers: {
        Authorization: "Bearer " + authToken
      },
      data: nameGroup,
      success: function () {
        location.reload(true);
      }
    });
  });
}

function addMembersToGroup() {
  $(document).on("submit", "form#add-member-to-group-form", function (e) {
    e.preventDefault();
    var members = [];
    $(this).find("input[type=checkbox]").each(function () {
      if ($(this).is(":checked")) {
        var memberId = $(this).attr("data-user-group-id");
        members.push(memberId);
      }
    });
    var groupId = $(this).attr("data-groupid");
    var authToken = $.cookie("authToken");

    for (var i = 0; i < members.length; i++) {
      if (i == members.length - 1) {
        $.ajax({
          type: "POST",
          contentType: "application/json",
          async: false,
          url: baseUrl + "/api/users/" + groupId + "/addMemberToMessageGroup/" + members[i],
          headers: {
            Authorization: "Bearer " + authToken
          },
          data: {},
          success: async () => {
            location.reload(true);
          }
        });
      } else {
        $.ajax({
          type: "POST",
          contentType: "application/json",
          async: false,
          url: baseUrl + "/api/users/" + groupId + "/addMemberToMessageGroup/" + members[i],
          headers: {
            Authorization: "Bearer " + authToken
          },
          data: {},
          success: function () {}
        });
      }
    }
  });
}

function sortAddMembersToGroup() {
  $(document).on("keyup", "input#search-add-members", function () {
    var value = $(this).val().toLowerCase();
    $(".content-members-group").children().each(function () {
      var name = $(this).text().toLowerCase();
      $(this).toggle(name.toLowerCase().indexOf(value) > -1);
    });
  });
}

function deleteUserFromGroup() {
  $(document).on("click", "a#delete-user-from-group", function () {
    var userId = $(this).attr("data-delete-id");
    var groupId = $("div#message-board-name").attr("data-group-id");
    var authToken = $.cookie("authToken");
    $.ajax({
      type: "DELETE",
      url: baseUrl + "/api/users/" + userId + "/remove-from-group/" + groupId,
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + authToken
      },
      crossDomain: true,
      success: function (response) {
        window.location.reload(true);
      }
    });
    $(this).parent().parent().remove();
  });
}

var userId = $.cookie("authUserId");
var authToken = $.cookie("authToken");
$("#files").on("change", function () {
  var uploads = $("#files")[0].files;
  uploadPictures();
});
$.ajax({
  type: "get",
  url: baseUrl + "/api/posts/user/" + userId,
  contentType: "application/json",
  headers: {
    Authorization: "Bearer " + authToken
  },
  crossDomain: true,
  success: function (data) {}
});
$("form#create-post-form").submit(function (event) {
  var attachmentIds = [];
  $("div#file-name").children().each(function () {
    attachmentIds.push($(this).attr("data-attachment-id"));
  });
  event.preventDefault();

  if (!($("textarea#post-content").val() === "" && attachmentIds.length === 0)) {
    var content = $("textarea#post-content").val();
    $.ajax({
      type: "POST",
      url: baseUrl + "/api/posts",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + authToken
      },
      crossDomain: true,
      data: JSON.stringify({
        userId: userId,
        content: content,
        attachments: attachmentIds
      }),
      success: function () {
        location.reload(true);
      }
    });
  } else {
    alert("Post content missing!");
  }
});

function deleteMessageAttachment() {
  $(document).on("click", "#delete-attachment", function () {
    $(this).parent().remove();
  });
}
//# sourceMappingURL=messages.js.map