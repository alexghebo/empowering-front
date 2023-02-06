$(document).ready(function () {
  let userId = $.cookie("authUserId");
  let authToken = $.cookie("authToken");
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/resources",
    headers: {
      Authorization: "Bearer " + authToken
    },
    crossDomain: true,
    success: function (response) {
      var allResources = response;
      $.ajax({
        type: "GET",
        url: baseUrl + "/api/users/" + userId,
        headers: {
          Authorization: "Bearer " + authToken
        },
        crossDomain: true,
        success: function (data) {
          $(".description-user").val(data.description);
          var userResources = data.resources;
          var resourcesHtml = $("#resource-template");
          resourcesHtml.hide();

          for (var i = 0; i < allResources.length; i++) {
            var resourceTemplate = resourcesHtml.clone();
            resourceTemplate.show().appendTo(".resources-list");
            resourceTemplate.find("#resource-name").html(allResources[i].name);
            resourceTemplate.find("input").attr("data-resource-id", allResources[i].id);
            resourceTemplate.find("input").attr("data-resource-name", allResources[i].name);

            for (var j = 0; j < userResources.length; j++) {
              if (allResources[i].id === userResources[j].id) {
                resourceTemplate.find("input").attr("value", userResources[j].quantity);
              }
            }
          }
        }
      });
    }
  });
  submitAboutModal(userId, authToken);
  $(document).on("keyup", "input.resource-input", function () {
    var valueInput = $(this).val();
    console.log(valueInput);
    var inputParse = parseInt(valueInput);
    var newVal = $(this).val().replace("-", '');
    $(this).val(newVal);
  });
  $(document).on("keyup", "input#resource-edit-input", function () {
    var newVal = $(this).val().replace("-", '0');
    $(this).val(newVal);
  });
});

function submitAboutModal(userId, authToken) {
  $(".submit-edit-about-modal").on("click", function () {
    var description = $(".description-user").val();
    var resources = [];
    var selectedResources = [];
    $(".resources-list #resource-template").each(function () {
      selectedResources.push({
        resourceId: $(this).find("input").attr("data-resource-id"),
        name: $(this).find("input").attr("data-resource-name"),
        quantity: $(this).find("input").val()
      });
    });
    var filtered = selectedResources.filter(function (el) {
      return el.quantity !== "0" && el.quantity !== "";
    });
    var payload = [{
      description: description,
      resources: filtered
    }];
    $.ajax({
      type: "PUT",
      url: baseUrl + "/api/users/" + userId + "/about",
      headers: {
        Authorization: "Bearer " + authToken
      },
      crossDomain: true,
      data: JSON.stringify({
        description: description,
        resources: filtered
      }),
      contentType: "application/json",
      success: function (data) {
        location.reload(true);
      },
      error: function (err) {
        alert(err.message);
      }
    });
  });
}
//# sourceMappingURL=edit-about-modal.js.map