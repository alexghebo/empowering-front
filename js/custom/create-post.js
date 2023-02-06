$(document).ready(function () {
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
});

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

$(document).on("click", "input.form-create-post", function () {
  $("textarea#post-content").val("");
  $("div#file-name").html("");
}); // function addFacebookFeed() {
//   var userId = $.cookie("authUserId");
//   var authToken = $.cookie("authToken");
//   FB.api("/me/feed", function (response) {
//     console.log(response);
//     for (let i in response.data) {
//       console.log(response.data[i].id);
//       if (response.data[i].message && i <= 10) {
//         $.ajax({
//           type: "POST",
//           url: baseUrl + "/api/posts",
//           contentType: "application/json",
//           headers: {
//             Authorization: "Bearer " + authToken,
//           },
//           crossDomain: true,
//           data: JSON.stringify({
//             userId: userId,
//             createdAt: response.data[i].created_time,
//             facebookID: response.data[i].id,
//             content: response.data[i].message,
//             attachemntIds: "",
//           }),
//           success: function () {
//             // location.reload(true);
//           },
//         });
//       }
//     }
//   });
// }

function addFacebookFeed() {
  var userId = $.cookie("authUserId");
  var authToken = $.cookie("authToken");
  FB.api("/me", function (response) {
    console.log(response.id);
    FB.api("/" + response.id + "/accounts", function (dateFb) {
      console.log(dateFb.data.length);

      if (dateFb.data.length > 0) {
        for (let j in dateFb.data) {
          console.log("intra pe pagina");
          FB.api("/" + dateFb.data[j].id + "/feed", function (postari) {
            console.log(postari);

            for (let i in postari.data) {
              // console.log(response.data[i], userId);
              if (postari.data[i].message && i <= 10) {
                console.log(postari.data[i], i);
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
                    createdAt: postari.data[i].created_time,
                    facebookID: postari.data[i].id,
                    content: postari.data[i].message,
                    attachemntIds: ""
                  }),
                  success: function () {// location.reload(true);
                  }
                });
              }
            }
          });
        }
      } else {
        console.log("intra pe feed");
        FB.api("/me/feed", function (response) {
          for (let i in response.data) {
            // console.log(response.data[i], userId);
            if (response.data[i].message && i <= 10) {
              console.log(response.data[i], i);
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
                  createdAt: response.data[i].created_time,
                  facebookID: response.data[i].id,
                  content: response.data[i].message,
                  attachemntIds: ""
                }),
                success: function () {// location.reload(true);
                }
              });
            }
          }
        });
      }
    });
  });
}
//# sourceMappingURL=create-post.js.map