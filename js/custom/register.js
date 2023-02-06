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

  if (n == 1) {
    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let confirmPassword = document.getElementById("confirm-password").value;
    let locationCity = document.getElementById("city").value;
    let locationCountry = document.getElementById("country").value;

    if (name == "" && email == "" && password == "" && confirmPassword == "" && locationCity == "" && locationCountry == "") {
      document.getElementById("nextBtn").disabled = true;
    } else {
      document.getElementById("nextBtn").disabled = false;
    }

    document.getElementById("name").addEventListener("keyup", checkValueForInputs);
    document.getElementById("email").addEventListener("keyup", checkValueForInputs);
    document.getElementById("password").addEventListener("keyup", checkValueForInputs);
    document.getElementById("confirm-password").addEventListener("keyup", checkValueForInputs);
    document.getElementById("city").addEventListener("keyup", checkValueForInputs);
    document.getElementById("country").addEventListener("keyup", checkValueForInputs);
  }

  if (n === x.length - 1) {
    document.getElementById("nextBtn").innerHTML = "Submit";
    document.getElementById("nextBtn").classList.add("submit-btn");
  } else {
    document.getElementById("nextBtn").classList.remove("submit-btn");
    document.getElementById("nextBtn").innerHTML = "Next <i class='cil-arrow-right'></i>";
  } //... and run a function that will display the correct step indicator:


  fixStepIndicator(n);
  var numberInputs = $("input.resource-input").length;
  $(document).on("keyup", "input.resource-input", function () {
    var valueInput = $(this).val();
    var inputParse = parseInt(valueInput);
    var newVal = $(this).val().replace("-", "");
    $(this).val(newVal);
  });
}

function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function checkValueForInputs() {
  let name = document.getElementById("name").value;
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;
  let confirmPassword = document.getElementById("confirm-password").value;
  let locationCity = document.getElementById("city").value;
  let locationCountry = document.getElementById("country").value;

  if (name != "" && email != "" && password != "" && confirmPassword != "" && locationCity != "" && locationCountry != "") {
    if (validateEmail(email) === false) {
      document.getElementById("nextBtn").disabled = true;
      $("#email").css("background-color", "pink");
    } else {
      document.getElementById("nextBtn").disabled = false;
      $("#email").css("background-color", "white");
    }

    if (password != confirmPassword) {
      document.getElementById("nextBtn").disabled = true;
      $("#password").css("background-color", "pink");
      $("#confirm-password").css("background-color", "pink");
    } else {
      document.getElementById("nextBtn").disabled = false;
      $("#password").css("background-color", "white");
      $("#confirm-password").css("background-color", "white");
    }
  }

  if (name == "" || email == "" || password == "" || confirmPassword == "" || locationCity == "" || locationCountry == "" || password != confirmPassword || validateEmail(email) == false) {
    document.getElementById("nextBtn").disabled = true;
  } else {
    document.getElementById("nextBtn").disabled = false;
  }
}

function nextPrev(n) {
  // This function will figure out which tab to display
  var x = document.getElementsByClassName("tab"); // Exit the function if any field in the current tab is invalid:
  // Hide the current tab:

  x[currentTab].style.display = "none"; // Increase or decrease the current tab by 1:

  currentTab = currentTab + n; // if you have reached the end of the form...

  if (currentTab >= x.length) {
    // ... the form gets submitted:
    $(function () {
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
      $(".resources").find("input[type=number]").each(function () {
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

      let name = $("input#name").val();
      let email = $("input#email").val();
      let password = $("input#password").val();
      let confirmPassword = $("input#confirm-password").val();
      let locationCity = $("input#city").val();
      let locationCountry = $("input#country").val();

      if (name != "" && email != null && validateEmail(email) == true && password != "" && confirmPassword != "" && password == confirmPassword && locationCity != "" && locationCountry != "") {
        $.ajax({
          type: "POST",
          url: baseUrl + "/api/users",
          contentType: "application/json",
          data: JSON.stringify({
            userType: userType,
            email: email,
            name: name,
            password: password,
            locationCity: locationCity,
            locationCountry: locationCountry,
            domains: selectedDomains,
            resources: resources
          }),
          success: function (data) {
            var urlParams = new URLSearchParams(window.location.search);

            if (urlParams.get("groupId") == null) {
              if (data.id == null) {} else {
                var emails = [];
                var inputs = $($(".container-email").get());

                for (var i = 0; i < inputs.length; i++) {
                  var value = $($(".container-email").get()[i]).find("input").val();
                  if (value !== "") console.log(emails);
                  emails.push(value);
                }

                if (emails.length > 0) {
                  sendEmails(data.id, emails).then(r => console.log("email sent"));
                }
              }
            } else {
              var groupId = urlParams.get("groupId");
              var userId = data.id;
              $.ajax({
                type: "POST",
                url: baseUrl + "/api/users/" + groupId + "/members",
                data: JSON.stringify({
                  userId
                }),
                contentType: "application/json",
                async: false,
                success: function () {
                  var emails = [];
                  var inputs = $($(".container-email").get());

                  for (var i = 0; i < inputs.length; i++) {
                    var value = $($(".container-email").get()[i]).find("input").val();
                    if (value !== "") console.log(emails);
                    emails.push(value);
                  }

                  if (emails.length > 0) {
                    sendEmails(data.id, emails).then(r => console.log("email sent"));
                  }

                  alert("accepted invitation!");
                }
              });
            }
          },
          complete: function () {
            window.location.href = "login.html";
          },
          error: function (err) {
            alert(err.responseJSON.message);
            window.location.href = "register.html";
          }
        });
      }
    });
    return false;
  } // Otherwise, display the correct tab:


  showTab(currentTab);
}

async function sendEmails(newUserId, emails) {
  for (var i = 0; i < emails.length; i++) {
    if (i == emails.length - 1) {
      await $.ajax({
        type: "POST",
        url: baseUrl + "/api/users/" + newUserId + "/sendInvitationsEmails/" + emails[i],
        contentType: "application/json",
        success: function () {
          window.location.href = "login.html";
          console.log("email sent to " + emails[i]);
        }
      });
    } else await $.ajax({
      type: "POST",
      url: baseUrl + "/api/users/" + newUserId + "/sendInvitationsEmails/" + emails[i],
      contentType: "application/json",
      success: function () {
        console.log("email sent to " + emails[i]);
      }
    });
  }
}

function validateForm() {
  let password = $("input#password").val();
  let confirmPassword = $("input#confirm-password").val(); // This function deals with validation of the form fields

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
  $(".select-domains").on("change", function (e) {
    selectedDomains = [];
    $.each($(".select-domains option:selected"), function () {
      var domainName = $(this).text();
      var domainId = $(this).attr("data-id");
      selectedDomains.push({
        name: domainName,
        id: domainId
      });

      if (selectedDomains.length < 3) {
        $("button.submit-btn").attr("disabled", "true");
        $("button#prevBtn").attr("disabled", "true");
      } else {
        $("button.submit-btn").removeAttr("disabled");
        $("button#prevBtn").removeAttr("disabled");
      }
    });
  });

  if (password != confirmPassword) {
    valid = false;
    alert("Password don't mached");
  }

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
  $(".select-domains").on("change", function (e) {
    selectedDomains = [];
    $.each($(".select-domains option:selected"), function () {
      var domainName = $(this).text();
      var domainId = $(this).attr("data-id");
      selectedDomains.push({
        name: domainName,
        id: domainId
      });

      if (selectedDomains.length < 3) {
        $("button.submit-btn").attr("disabled", "true");
        $("button#prevBtn").attr("disabled", "true");
      } else {
        $("button.submit-btn").removeAttr("disabled");
        $("button#prevBtn").removeAttr("disabled");
      }
    });
  });
  $("#nextBtn").attr("disabled", "true");
  $(document).on("click", ".card-select-user-type", function () {
    $("#nextBtn").removeAttr("disabled");
    $(".card-select-user-type").removeClass("active");
    $(this).addClass("active");
    let selectedTypeId = $(this).attr("id");

    if (selectedTypeId === "single-user-card") {
      $("#selected-user-type-input").val("SINGLE_USER");

      if ($("span.step").length > 4) {
        $("form#regForm").find(".tab-select-users").detach();
        $("span.step:last").detach();
      }
    } else if (selectedTypeId === "informal-group-card") {
      $("#selected-user-type-input").val("INFORMAL_GROUP");

      if ($("div.tab-select-users").length === 0) {
        var inviteUsersTab = `
        <div class="tab tab-select-users">
          <h1>Invite members to your Empowering <span class="name-group-register"></span> Group</h1>
          <p class="px-2">You can skip this step and invite users to your group using the invitations page.</p>
          <div class="container" >
            <div class='element' id='div_1'>
              <div class="container-email d-flex align-items-center">
                <span class="pr-4"> Email </span>
                <input class="form-control" type='text' placeholder='Email' id='txt_1' >&nbsp;
              </div>
              <span class='add font-weight-bold'><i class="cil-plus"></i>Add Account</span>
            </div>
            <p class='border border-dark mt-3 p-2' id='informal-group-info'> Informal Group accounts are validated when they reach a minimum of 3 members. If accounts are no validated within 30 days, the account will be suspended.<b>You must agree terms and contitions to continue to next step.</b></p>
            <div class="form-check">
              <input type="checkbox" class="form-check-input" id="checkTermsAndConditions" checked>
              <label class="form-check-label" for="checkTermsAndConditions">I have read and undestand the terms and conditions.</label>
              <div class="content-button text-center mt-5">
              <a class="p-3" id='skipBtn' onclick='nextPrev(1)'> Skip <i class='cil-arrow-right'></i></a>
            </div>
          </div>
        </div>
      </div>`;
        $(inviteUsersTab).insertAfter($(".register-tab"));
        $(".tab-select-users").find("input#checkTermsAndConditions").bind("click", function () {
          $(this).attr("checked", $(this).is(":checked"));
        });
        $('input[type="checkbox"]').click(function () {
          if ($(this).prop("checked") == true) {
            $("#skipBtn").attr("disabled", false);
            $("#nextBtn").attr("disabled", false);
          } else if ($(this).prop("checked") == false) {
            $("#skipBtn").attr("disabled", true);
            $("#nextBtn").attr("disabled", true);
          }
        });
        $(".register-steps").append("<span class='step'></span>");
      }
    } else if (selectedTypeId === "ngo-card") {
      $("#selected-user-type-input").val("NGO");

      if ($("span.step").length > 4) {
        $("form#regForm").find(".tab-select-users").detach();
        $("span.step:last").detach();
      }
    } else if (selectedTypeId === "public-institution") {
      $("#selected-user-type-input").val("PUBLIC_INSTITUTION");

      if ($("span.step").length > 4) {
        $("form#regForm").find(".tab-select-users").detach();
        $("span.step:last").detach();
      }
    } else {
      $("form#regForm").find(".tab-select-users").detach();
      $("span.step:last").detach();
    }
  }); // Add new element

  $(document).on("click", ".add", function () {
    // Finding total number of elements added
    var total_element = $(".element").length; // last <div> with element class id

    var lastid = $(".element:last").attr("id");
    var split_id = lastid.split("_");
    var nextindex = Number(split_id[1]) + 1;
    var max = 4; // Check total number elements

    if (total_element < max) {
      // Adding new div container after last occurance of element class
      $(".element:last").after("<div class='element d-flex align-items-center mt-2' id='div_" + nextindex + "'></div>"); // Adding element to <div>

      $("#div_" + nextindex).append("<div class='container-email d-flex align-items-center'><span class='pr-4'>Email</span><input class='form-control' type='text' placeholder='Email' id='txt_" + nextindex + "'></div>&nbsp;<span id='remove_" + nextindex + "' class='remove text-danger'><i class='cil-trash'></i>Delete email</div><div class='container-delete font-weight-bold text-danger'></span></div>");
    }

    if (total_element == max) {
      alert("You cannot add another email");
    }
  }); // Remove element

  $(".container").on("click", ".remove", function () {
    var id = this.id;
    var split_id = id.split("_");
    var deleteindex = split_id[1]; // Remove <div> with id

    $("#div_" + deleteindex).remove();
  });
});
$(document).ready(function () {
  var urlParams = new URLSearchParams(window.location.search);
  var email = urlParams.get("email");
  var group = urlParams.get("groupId");

  if (email && group) {
    $(".card-select-user-type#informal-group-card").parent().parent().detach();
  }

  if (urlParams.get("email") !== null) {
    $("input#email").val(urlParams.get("email"));
    $("input#email").attr("disabled", "true");
  }

  $(document).on("change", "input#name", function () {
    var name = $(this).val();
    $("span.name-group-register").html(name);
  });
  $.ajax({
    type: "GET",
    url: baseUrl + "/api/resources",
    success: function (response) {
      if (response.length) {
        for (var i = 0; i < response.length; i++) {
          var resourceTemplate = `<div class="col-md-6" id="resource">
              <div class="form-group">
                <label id="resource-name">${response[i].name}</label>
                <input class="form-control resource-input pl-2" min="0" id="resource-quantity-${i}" data-name="${response[i].name}" type="number" aria-describedby="emailHelp" placeholder="Quantity">
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
//# sourceMappingURL=register.js.map