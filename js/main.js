/* eslint-disable object-shorthand */

/* global Chart, coreui, coreui.Utils.getStyle, coreui.Utils.hexToRgba */

/**
 * --------------------------------------------------------------------------
 * CoreUI Boostrap Admin Template (v3.0.0): main.js
 * Licensed under MIT (https://coreui.io/license)
 * --------------------------------------------------------------------------
 */

/* eslint-disable no-magic-numbers */
// var baseUrl = "http://95.216.221.37:8082";
var baseUrl = "https://api.youth-initiatives.com"; // var baseUrl = "http://localhost:8080";
// var frontendBaseUrl = "http://localhost:3000";

var frontendBaseUrl = "https://" + window.location.hostname; //var frontendBaseUrl = "http://95.216.221.37:82";

$(document).ready(function () {
  checkLoginAndUpdateNavbar();
  getUserChat();
  substringUrl();
  showNotificationsForMessages();
  deleteAccountPopUp();

  if (!(window.location.href.indexOf("my-profile.html") > -1)) {
    $(".edit-info-button").hide();
  }

  if ($.cookie("authToken")) {
    showNotification().then(r => {});
    var oldNotif = [];
    var newNotif = [];
    $.ajax({
      type: "GET",
      url: baseUrl + "/api/notifications/",
      headers: {
        Authorization: "Bearer " + $.cookie("authToken")
      },
      crossDomain: true,
      async: false,
      success: function (data) {
        oldNotif = data;
      }
    });

    (function poll() {
      setTimeout(function () {
        $.ajax({
          type: "GET",
          url: baseUrl + "/api/notifications/",
          headers: {
            Authorization: "Bearer " + $.cookie("authToken")
          },
          crossDomain: true,
          async: false,
          success: function (data) {
            newNotif = data.reverse();

            for (var i = 0; i < newNotif.length; i++) {
              if (i > oldNotif.length - 1) {
                var notificationTemplate = `<p class="notification px-3 py-2 mb-0 border-bottom bg-light font-weight-bold" notification-id=${newNotif[i].id}>${newNotif[i].topic}</p>`;
                var notifText = $("#number-notification");

                if (notifText.text() === "You don't have new notifications") {
                  $(".badge-custom").removeClass("d-none");
                  $("#number-notification").html(`You have <span class="notif-length">1</span> new notifications`);
                } else {
                  var notifLength = $("span.notif-length").text();
                  var parseNotifLength = parseInt(notifLength);
                  $("#number-notification").html(`You have <span class="notif-length">${parseNotifLength + 1}</span> new notifications`);
                }

                $("#notification-content").prepend(notificationTemplate);
              }
            }

            oldNotif = newNotif; // }
          },
          complete: poll,
          timeout: 200
        });
      }, 5000);
    })();

    if ($.cookie("authToken")) {
      (function newMessageNotifSidebar() {
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
              var unreadMessagesConversations = 0;

              for (var i = 0; i < newConversations.length; i++) {
                if (newConversations[i].lastMessage) {
                  if (window.location.href.indexOf("messages.html") > -1) {
                    if (!$(".messages-list").children().eq(i + 1).hasClass("active") && newConversations[i].lastMessage.status === "UNREAD") {
                      unreadMessagesConversations++;
                    }
                  } else {
                    if (newConversations[i].lastMessage.status === "UNREAD") {
                      unreadMessagesConversations++;
                    }
                  }
                }
              }

              if ($("span.message-badge-notification").hasClass("badge-d-none")) {
                if (unreadMessagesConversations > 0) {
                  $("span.message-badge-notification").removeClass("badge-d-none").addClass("badge");
                  $("span.message-badge-notification").html(unreadMessagesConversations);
                }
              } else {
                $("span.message-badge-notification").html(unreadMessagesConversations);
              }
            },
            complete: newMessageNotifSidebar,
            timeout: 200
          });
        }, 5000);
      })();
    }
  }
});

function deleteAccountPopUp() {
  $("a.delete-account-item-dropdown").click(function (e) {
    e.preventDefault();
  });
  $("button#delete-account-button").click(function () {
    $.ajax({
      type: "DELETE",
      url: baseUrl + "/api/users/deleteUser",
      headers: {
        Authorization: "Bearer " + $.cookie("authToken")
      },
      crossDomain: true,
      success: function () {
        $.removeCookie("authToken");
        $.removeCookie("authEmail");
        $.removeCookie("authUserId");
        $.removeCookie("authName");
        $.removeCookie("authMobile");
        $.removeCookie("registeredAt");
        window.location.href = "login.html";
      }
    });
  });
}

function showNotificationsForMessages() {
  if ($.cookie("authToken")) {
    $.ajax({
      type: "GET",
      url: baseUrl + "/api/users/conversations",
      headers: {
        Authorization: "Bearer " + $.cookie("authToken")
      },
      crossDomain: true,
      success: function (data) {
        var unreadConversations = 0;

        for (var i = 0; i < data.length; i++) {
          if (data[i].lastMessage) {
            if (data[i].lastMessage.status === "UNREAD" && data[i].lastMessage.senderId !== $.cookie("authUserId")) {
              unreadConversations++;
            }
          }
        }

        if (unreadConversations <= 0) {
          $(".message-badge-notification").addClass("badge-d-none").removeClass("badge");
        } else {
          $(".message-badge-notification").html(unreadConversations);
        }
      }
    });
  }
}

function getUserChat() {
  let userId = $.cookie("authUserId");
  let authToken = $.cookie("authToken");

  if (authToken) {
    $.ajax({
      type: "GET",
      url: baseUrl + "/api/users/" + userId,
      headers: {
        Authorization: "Bearer " + authToken
      },
      crossDomain: true,
      success: function (data) {
        var connections = data.connections;

        if (data.profilePicture) {
          $("img.profile-avatar").attr("src", "https://api.youth-initiatives.com/api/attachments/" + data.profilePicture);
          var profileImage = `
        <div class="c-avatar">
          <img class="c-avatar-img h-100 profile-avatar" src="https://api.youth-initiatives.com/api/attachments/${data.profilePicture}" alt="Avatar picture">
        </div>`;
          $(".content-image").html(profileImage);
        } else {
          var profilePictureNav = `
<div class="icon-user-circle" style="opacity: .7;">
          <img src="assets/img/icons/user-avatar-orange.svg" alt="Profile Picture" title="Profile Picture" />
          </div>
          `;
          $("img.profile-avatar").parent().html(profilePictureNav);
          var iconUserProfile = `<div class="col-auto">
        <div class="icon-user-circle" style="opacity: 1 !important;">
          <img src="assets/img/icons/user-avatar-orange.svg" alt="Profile Picture" title="Profile Picture" />
        </div>
      </div>`;
          $(".content-image").html(iconUserProfile);
        }

        var connectionTemplateConnections = ``;

        for (var i = 0; i < connections.length; i++) {
          var profilePictureChat = ``;

          if (connections[i].profilePicture) {
            profilePictureChat = `
          <div class="icon-user-circle" style="opacity: 1 !important;">
            <img class="profile-picture-chat-list" src="https://api.youth-initiatives.com/api/attachments/${connections[i].profilePicture}">
          </div>
          `;
          } else {
            profilePictureChat = `
<div class="icon-user-circle">
            <img src="assets/img/icons/user-avatar-orange.svg" alt="Profile Picture" title="Profile Picture" />
          </div>
          `;
          }

          connectionTemplateConnections = `<div class="main-menu-content pr-3">
          <div class="users-list px-xl-3 px-2">
            <div class="row align-items-center no-gutters user user-online">
              <div class="col-auto">
                <div class="icon-wrapper">
                  <a class="text-decoration-none text-muted" href="user-profile-view.html?userId=${connections[i].userId}">
                    ${profilePictureChat}
                  </a>
                </div>
              </div>
              <div class="col">
                <div class="user-name-wrapper px-1 px-lg-3">
                  <a class="text-decoration-none text-muted" href="user-profile-view.html?userId=${connections[i].userId}">
                    <span id="chat-menu-user-name">
                    ${connections[i].name}
                      </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>`;
          $("#connection-template-chat-list").append(connectionTemplateConnections);
        }
      }
    });
  }
}

function redirectOnLogin() {
  var authToken = $.cookie("authToken");

  if (authToken === undefined) {
    try {
      //stop most browsers loading
      window.stop();
    } catch (e) {
      //IE stop loading content
      document.execCommand("Stop");
    }

    document.location.replace(frontendBaseUrl + "/login.html");
  }
}

function checkLoginAndUpdateNavbar() {
  var authToken = $.cookie("authToken");
  var authName = $.cookie("authName");
  var registeredAt = $.cookie("registeredAt");
  var time0 = moment(registeredAt).format("YYYY-MM-DD");
  var accountActivity = moment().diff(time0, "days"); //if loggen in

  if (authToken !== undefined) {
    if ($.cookie("authUserId")) {
      $.ajax({
        url: baseUrl + "/api/users/" + $.cookie("authUserId"),
        type: "GET",
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Authorization", "Bearer " + authToken);
        },
        data: {},
        success: function (data) {
          $("span.name").html(data.name);
        }
      });
    }
  } else {
    if (!(window.location.href === frontendBaseUrl + "/login.html" || window.location.href.indexOf("register.html") > 0 || window.location.href === frontendBaseUrl + "/forgot-password.html" || window.location.href.indexOf("accept-invitation-to-group.html") > 0)) {
      try {
        //stop most browsers loading
        window.stop();
      } catch (e) {
        //IE stop loading content
        document.execCommand("Stop");
      }

      document.location.replace(frontendBaseUrl + "/login.html");
    }
  }
}

function substringUrl() {
  var pathName = window.location.pathname;
  var sidebarLinks = $("a.c-sidebar-nav-link");

  for (var i = 0; i < sidebarLinks.length; i++) {
    if (pathName == "/") {
      if ($(sidebarLinks[i]).attr("href") == "index.html") {
        $(sidebarLinks[i]).parent().css({
          "background-color": "#c4c9d0",
          color: "#575FCF !important"
        });
      }
    } else {
      $(sidebarLinks[i]).parent().css({
        "background-color": "transparent",
        color: "#4f5d73 !important"
      });
    }

    if (pathName.indexOf($(sidebarLinks[i]).attr("href"))) {
      $(sidebarLinks[i]).parent().addClass("c-active");
    } else {
      $(sidebarLinks[i]).parent().css({
        "background-color": "transparent",
        color: "#4f5d73  !important"
      });
    }
  }
}

function myGroups() {
  $("#pills-my-ngos-tab").attr("aria-selected", false);
  $("#pills-single-users-tab").attr("aria-selected", false);
  $("#pills-my-groups-tab").attr("aria-selected", true);
  $("#pills-public-institutions-tab").attr("aria-selected", false);
  $("#pills-sent-invitations-tab").attr("aria-selected", false);
  $("#pills-single-users-tab").removeClass("active");
  $("#pills-public-institutions-tab").removeClass("active");
  $("#pills-ngos-tab").removeClass("active");
  $("#pills-sent-invitations-tab").removeClass("active");
  $("#pills-my-groups-tab").addClass("active");
  $("#pills-single-users").removeClass("active");
  $("#pills-public-instituitons").removeClass("active");
  $("#pills-ngos").removeClass("active");
  $("#pills-sent-invitations").removeClass("active");
  $("#pills-single-users").removeClass("show");
  $("#pills-public-institutions").removeClass("show");
  $("#pills-ngos").removeClass("show");
  $("#pills-sent-invitations").removeClass("show");
  $("#pills-my-groups").addClass("show");
  $("#pills-my-groups").addClass("active");
}

function ngo() {
  $("#pills-my-ngos-tab").attr("aria-selected", true);
  $("#pills-single-users-tab").attr("aria-selected", false);
  $("#pills-my-groups-tab").attr("aria-selected", false);
  $("#pills-public-institutions-tab").attr("aria-selected", false);
  $("#pills-sent-invitations-tab").attr("aria-selected", false);
  $("#pills-single-users-tab").removeClass("active");
  $("#pills-my-groups-tab").removeClass("active");
  $("#pills-public-institutions-tab").removeClass("active");
  $("#pills-sent-invitations-tab").removeClass("active");
  $("#pills-ngos-tab").addClass("active");
  $("#pills-single-users").removeClass("active");
  $("#pills-my-groups").removeClass("active");
  $("#pills-public-institutions").removeClass("active");
  $("#pills-sent-invitations").removeClass("active");
  $("#pills-single-users").removeClass("show");
  $("#pills-my-groups").removeClass("show");
  $("#pills-public-insititutions").removeClass("show");
  $("#pills-sent-invitations").removeClass("show");
  $("#pills-ngos").addClass("show");
  $("#pills-ngos").addClass("active");
}

function singleUsers() {
  $("#pills-my-ngos-tab").attr("aria-selected", false);
  $("#pills-single-users-tab").attr("aria-selected", true);
  $("#pills-my-groups-tab").attr("aria-selected", false);
  $("#pills-public-institutions-tab").attr("aria-selected", false);
  $("#pills-sent-invitations-tab").attr("aria-selected", false);
  $("#pills-public-institutions-tab").removeClass("active");
  $("#pills-my-groups-tab").removeClass("active");
  $("#pills-ngos-tab").removeClass("active");
  $("#pills-sent-invitations-tab").removeClass("active");
  $("#pills-single-users-tab").addClass("active");
  $("#pills-public-institutions").removeClass("active");
  $("#pills-my-groups").removeClass("active");
  $("#pills-ngos").removeClass("active");
  $("#pills-sent-invitations").removeClass("active");
  $("#pills-public-institutions").removeClass("show");
  $("#pills-my-groups").removeClass("show");
  $("#pills-ngos").removeClass("show");
  $("#pills-sent-invitations").removeClass("show");
  $("#pills-single-users").addClass("show");
  $("#pills-single-users").addClass("active");
}

function publicInstitution() {
  $("#pills-my-ngos-tab").attr("aria-selected", false);
  $("#pills-single-users-tab").attr("aria-selected", false);
  $("#pills-my-groups-tab").attr("aria-selected", false);
  $("#pills-public-institutions-tab").attr("aria-selected", true);
  $("#pills-sent-invitations-tab").attr("aria-selected", false);
  $("#pills-single-users-tab").removeClass("active");
  $("#pills-my-groups-tab").removeClass("active");
  $("#pills-ngos-tab").removeClass("active");
  $("#pills-sent-invitations-tab").removeClass("active");
  $("#pills-public-institutions-tab").addClass("active");
  $("#pills-single-users").removeClass("active");
  $("#pills-my-groups").removeClass("active");
  $("#pills-ngos").removeClass("active");
  $("#pills-sent-invitations").removeClass("active");
  $("#pills-single-users").removeClass("show");
  $("#pills-my-groups").removeClass("show");
  $("#pills-ngos").removeClass("show");
  $("#pills-sent-invitations").removeClass("show");
  $("#pills-public-institutions").addClass("show");
  $("#pills-public-institutions").addClass("active");
}

console.log(window.location.href);

if (window.location.href === "https://" + window.location.hostname + "/invitations.html#pills-ngos") {
  ngo();
} else {
  if (window.location.href === "https://" + window.location.hostname + "/invitations.html#pills-single-users") {
    singleUsers();
  } else {
    if (window.location.href === "https://" + window.location.hostname + "/invitations.html#pills-my-groups") {
      myGroups();
    } else {
      if (window.location.href === "https://" + window.location.hostname + "/invitations.html#pills-public-institutions") {
        publicInstitution();
      }
    }
  }
}

async function showNotification() {
  let userId = $.cookie("authUserId");
  let authToken = $.cookie("authToken");
  await $.ajax({
    type: "GET",
    url: baseUrl + "/api/notifications/",
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (data) {
      var notificationTemplate = ``;

      for (var i = 0; i < data.length; i++) {
        var notificationTopic = data[i].topic;
        var notifhref;

        if (notificationTopic.indexOf("sent you a connection request!") > -1) {
          if (data[i].type === "NGO" && userId == data[i].receiverId) {
            notifhref = "/invitations.html#pills-ngos";
          } else {
            if (data[i].type === "INFORMAL_GROUP" && userId == data[i].receiverId) {
              notifhref = "/invitations.html#pills-my-groups";
            } else {
              if (data[i].type === "PUBLIC_INSTITUTION" && userId == data[i].receiverId) {
                notifhref = "/invitations.html#pills-public-institutions";
              } else {
                if (data[i].type === "SINGLE_USER" && userId == data[i].receiverId) {
                  notifhref = "/invitations.html#pills-single-users";
                }
              }
            }
          }
        } else if ("has accepted your invitation!") {
          notifhref = "/connections.html";
        } else if (notificationTopic.indexOf("has sent an invitation for joining the group. Check your email!") > -1) {
          notifhref = "#";
        } else if (notificationTopic.indexOf("shared a file with you!") > -1) {
          notifhref = "/shared-files.html";
        } else if (notificationTopic.indexOf("Someone liked your post") > -1) {
          notifhref = "/my-profile.html";
        } else {
          notifhref = "#";
        }

        if (data[i].status === "UNREAD") {
          notificationTemplate += `<p class="notification px-3 py-2 mb-0 border-bottom bg-light font-weight-bold" notification-id=${data[i].id}><a href="${notifhref}">${data[i].topic}</a> </p>`;
        } else {
          notificationTemplate += `<p class="px-3 py-2 mb-0 border-bottom"><a href="${notifhref}">${data[i].topic}</a></p>`;
        }
      }

      $("#notification-content").html(notificationTemplate);
    }
  });
  $(document).on("click", "p.notification", function () {
    var notificationId = $(this).attr("notification-id");
    $.ajax({
      type: "PUT",
      url: baseUrl + "/api/notifications/" + notificationId,
      headers: {
        Authorization: "Bearer " + authToken
      },
      crossDomain: true,
      success: function (data) {
        location.reload(true);
      }
    });
  });
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/notifications/unread",
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (data) {
      if (data.length == 0) {
        $(".badge-custom").addClass("d-none");
        $("#number-notification").html(`You don't have new notifications`);
      } else {
        $("#number-notification").html(`You have <span class="notif-length">${data.length}</span> new notifications`);
        $(".badge-custom").removeClass("d-none");
      }
    }
  });
}
//# sourceMappingURL=main.js.map