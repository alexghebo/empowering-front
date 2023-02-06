var currentTab = 0; // Current tab is set to be the first tab (0)

showTab(currentTab); // Display the current tab

function showTab(n) {
  // This function will display the specified tab of the form...
  var x = document.getElementsByClassName("tab");
  x[n].style.display = "block"; //... and fix the Previous/Next buttons:

  if (n == 0) {
    document.getElementById("prevBtn").setAttribute("disabled", "true");
  } else {
    document.getElementById("prevBtn").style.display = "inline";
    document.getElementById("prevBtn").removeAttribute("disabled");
  }

  if (n == x.length - 1) {
    document.getElementById("nextBtn").innerHTML = "Submit";
    document.getElementById("nextBtn").classList.add("submit-btn");
  } else {
    document.getElementById("nextBtn").classList.remove("submit-btn");
    document.getElementById("nextBtn").innerHTML = "<span>Next</span><i class='cil-arrow-right pl-2 align-middle'>";
    $("button#nextBtn").removeAttr("disabled"); // document.getElementById("nexBtn").setAttribute("disabled", "false");
  } //... and run a function that will display the correct step indicator:


  fixStepIndicator(n);
}

function nextPrev(n) {
  // This function will figure out which tab to display
  var x = document.getElementsByClassName("tab"); // Exit the function if any field in the current tab is invalid:

  if (n == 1 && !validateForm()) {
    document.getElementById("nexBtn").setAttribute("disabled", "true");
    document.getElementById("prevBtn").setAttribute("disabled", "true");
    return false;
  } // Hide the current tab:


  x[currentTab].style.display = "none"; // Increase or decrease the current tab by 1:

  currentTab = currentTab + n; // if you have reached the end of the form...

  if (currentTab >= x.length) {
    // ... the form gets submitted:
    $(function () {
      var userId = $.cookie("authUserId");
      var userType = $("#selected-user-type-input").val();
      var selectedDomains = [];
      $.each($(".select-domains option:selected"), function () {
        var domainName = $(this).text();
        var domainId = $(this).attr("data-id");
        selectedDomains.push({
          name: domainName,
          id: domainId
        });
      });
      var resources = [];
      var resourceInputs = $(".resources").children(); // get resource quantities

      var resourcesQuantities = [];
      $(".resources").find("input[type=text]").each(function () {
        resourcesQuantities.push($(this).val());
      });
      var resourceNames = []; // get resource names

      for (var i = 0; i < resourceInputs.length; i++) {
        var resourcesHtml = resourceInputs[i].innerHTML;
        var resourceName = $(resourcesHtml).find(".resource-input").attr("data-name");
        resourceNames.push(resourceName);
      } // put quantities and names together


      for (var i = 0; i < resourceNames.length; i++) {
        if (resourcesQuantities[i]) {
          resources.push({
            name: resourceNames[i],
            quantity: resourcesQuantities[i]
          });
        }
      }

      var data = {
        userId: userId,
        userType: userType,
        domains: selectedDomains,
        resources: resources
      };
      var authToken = $.cookie("authToken");
      $.ajax({
        type: "post",
        url: baseUrl + "/api/users/" + userId + "/onboard",
        contentType: "application/json",
        headers: {
          Authorization: "Bearer " + authToken
        },
        data: JSON.stringify(data),
        success: function (data) {
          alert("User onboard!");
          document.getElementById("regForm").submit();
          window.location.href = "index.html";
        },
        error: function () {
          alert("Onboarding failed!");
        }
      });
    });
    return false;
  } // Otherwise, display the correct tab:


  showTab(currentTab);
}

function validateForm() {
  // This function deals with validation of the form fields
  var x,
      y,
      i,
      valid = true;
  x = document.getElementsByClassName("tab");
  y = x[currentTab].getElementsByTagName("input");
  let selectedUserType = $("#selected-user-type-input");

  if (selectedUserType.val()) {
    $(selectedUserType).removeClass("invalid");
    valid = true;
  } else {
    $(selectedUserType).addClass("invalid");
    alert("You must select one user type!");
    valid = false;
    $("button#prevBtn").attr("disabled", "true");
  }

  var selectedDomains = [];
  $.each($(".select-domains option:selected"), function () {
    var domainName = $(this).text();
    var domainId = $(this).attr("data-id");
    selectedDomains.push({
      name: domainName,
      id: domainId
    });
  });
  $("select.qtagselect__select.select-domains").on("change", function (e) {
    selectedDomains = [];
    $.each($(".select-domains option:selected"), function () {
      var domainName = $(this).text();
      var domainId = $(this).attr("data-id");
      selectedDomains.push({
        name: domainName,
        id: domainId
      });
      console.log(selectedDomains);

      if (selectedDomains.length < 3) {
        $("button.submit-btn").attr("disabled", "true");
        $("button#prevBtn").attr("disabled", "true");
      } else {
        $("button.submit-btn").removeAttr("disabled");
        $("button#prevBtn").removeAttr("disabled");
      }
    });
  });

  if (selectedDomains.length < 3) {
    valid = false;
    alert("you must select at least 3 domains");
  } // If the valid status is true, mark the step as finished and valid:


  if (valid) {
    document.getElementsByClassName("step")[currentTab].className += " finish";
  }

  return valid; // return the valid status
}

function fixStepIndicator(n) {
  // This function removes the "active" class of all steps...
  var i,
      x = document.getElementsByClassName("step");

  for (i = 0; i < x.length; i++) {
    x[i].className = x[i].className.replace(" active", "");
  } //... and adds the "active" class on the current step:


  x[n].className += " active";
}

$(document).ready(function () {
  $(".card-select-user-type").on("click", function () {
    $(".card-select-user-type").removeClass("active");
    $(this).addClass("active");
    let selectedTypeId = $(this).attr("id");

    if (selectedTypeId === "single-user-card") {
      $("#selected-user-type-input").val("SINGLE_USER");
    } else if (selectedTypeId === "informal-group-card") {
      $("#selected-user-type-input").val("INFORMAL_GROUP");
    } else if (selectedTypeId === "ngo-card") {
      $("#selected-user-type-input").val("NGO");
    } else if (selectedTypeId === "public-institution") {
      $("#selected-user-type-input").val("PUBLIC_INSTITUTION");
    }
  });
});
$(document).ready(function () {
  var authToken = $.cookie("authToken");
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/resources",
    headers: {
      Authorization: "Bearer " + authToken
    },
    success: function (response) {
      if (response.length) {
        for (var i = 0; i < response.length; i++) {
          var resourceTemplate = `<div class="col-md-6" id="resource">
              <div class="form-group">
                <label id="resource-name">${response[i].name}</label>
                <input class="form-control resource-input" min="0" id="resource-quantity-${i}" data-name="${response[i].name}" type="text" aria-describedby="emailHelp" placeholder="Quantity">
              </div>
            </div>`;
          $(".resources").append(resourceTemplate);
        }
      } else {
        $(".resources").html("<h6 class='text-center'>No resource available!</h6>");
      }
    },
    error: function () {
      alert("Resources listing failed!");
    }
  });
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

          if (i < 3) {
            domainTemplate = `
              <option value="${i + 1}" selected="" data-id="${response[i].id}">${response[i].name}</option>
          `;
          } else {
            domainTemplate = `
              <option value="${i + 1}" data-id="${response[i].id}">${response[i].name}</option>`;
          }

          $(".select-domains").append(domainTemplate);
          initDomainTags();
          $("option:even").addClass("ispurple");
          $("option:odd").addClass("isblue");
        }
      } else {
        $(".no-domain-message").removeClass("d-none");
      }
    },
    error: function () {
      alert("Domains listing failed!");
    }
  });

  function initDomainTags() {
    $(function () {
      $(".qtagselect__select").tagselect({
        // additional class(es) for the dropdown
        dropClass: "d-block",
        // shows the footer in the dropdown
        dropFooter: false,
        // is opened on page load
        isOpen: true,
        // maximum number of tags allowed to select
        maxTag: 12
      });
    });
  }
});
//# sourceMappingURL=select-user-type.js.map