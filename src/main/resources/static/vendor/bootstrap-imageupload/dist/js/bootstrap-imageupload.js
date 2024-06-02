/**
 * bootstrap-imageupload-src v1.2.0
 * https://github.com/nerdy-harry/bootstrap-imageupload
 * Copyright 2016 Egon Olieux
 * Released under the MIT license
 */

if (typeof jQuery === "undefined") {
  throw new Error("bootstrap-imageupload's JavaScript requires jQuery.");
}

(function ($) {
  "use strict";

  var options = {};

  var methods = {
    init: init,
    disable: disable,
    enable: enable,
    reset: reset,
  };

  $.fn.imageupload = function (methodOrOptions) {
    var givenArguments = arguments;

    return this.filter("div").each(function () {
      if (methods[methodOrOptions]) {
        methods[methodOrOptions].apply(
          $(this),
          Array.prototype.slice.call(givenArguments, 1)
        );
      } else if (typeof methodOrOptions === "object" || !methodOrOptions) {
        methods.init.apply($(this), givenArguments);
      } else {
        throw new Error(
          'Method "' + methodOrOptions + '" is not defined for imageupload.'
        );
      }
    });
  };

  $.fn.imageupload.defaultOptions = {
    allowedFormats: ["jpg", "jpeg", "png", "gif"],
    maxWidth: 250,
    maxHeight: 250,
    maxFileSizeKb: 2000000,
    imgSrc: "",
  };

  function init(givenOptions) {
    options = $.extend({}, $.fn.imageupload.defaultOptions, givenOptions);

    var $imageupload = this;
    var $fileTab = $imageupload.find(".file-tab");
    var $fileTabButton = $imageupload.find(".panel-heading .btn:eq(0)");
    var $browseFileButton = $fileTab.find('input[type="file"]');
    var $removeFileButton = $fileTab.find(".btn:eq(1)");

    resetFileTab($fileTab);
    showFileTab($fileTab);
    enable.call($imageupload);

    $fileTabButton.off();
    $browseFileButton.off();
    $removeFileButton.off();

    $fileTabButton.on("click", function () {
      $(this).blur();
      showFileTab($fileTab);
    });

    $browseFileButton.on("change", function () {
      $(this).blur();
      submitImageFile($fileTab);
    });

    $removeFileButton.on("click", function () {
      $(this).blur();
      resetFileTab($fileTab);
    });

    if (options.imgSrc) {
      fetchImageAsFile(options.imgSrc, function (file) {
        if (file) {
          var fileInput = $browseFileButton[0];
          var dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
          console.log(fileInput.files);

          showImageSrc($fileTab, "/uploads/" + file.name);
        }
      });
      options.imgSrc = "";
    }
  }

  function fetchImageAsFile(fileName, callback) {
    fetch("http://localhost:8081/uploads/" + fileName)
      .then((response) => response.blob())
      .then((blob) => {
        var file = new File([blob], fileName, { type: blob.type });
        callback(file);
      })
      .catch(() => callback(null));
  }

  function disable() {
    var $imageupload = this;
    $imageupload.addClass("imageupload-disabled");
  }

  function enable() {
    var $imageupload = this;
    $imageupload.removeClass("imageupload-disabled");
  }

  function reset() {
    var $imageupload = this;
    init.call($imageupload, options);
  }

  function getAlertHtml(message) {
    var html = [];
    html.push('<div class="alert alert-danger alert-dismissible">');
    html.push('<button type="button" class="close" data-dismiss="alert">');
    html.push("<span>&times;</span>");
    html.push("</button>" + message);
    html.push("</div>");
    return html.join("");
  }

  function getImageThumbnailHtml(src) {
    return (
      '<img src="' +
      src +
      '" alt="Image preview" class="img-thumbnail mb-2" style="max-width: ' +
      options.maxWidth +
      "px; max-height: " +
      options.maxHeight +
      'px; display: block;">'
    );
  }

  function getFileExtension(path) {
    return path.substr(path.lastIndexOf(".") + 1).toLowerCase();
  }

  function isValidImageFile(file, callback) {
    if (file.size / 1024 > options.maxFileSizeKb) {
      callback(
        false,
        "File is too large (max " + options.maxFileSizeKb + "kB)."
      );
      return;
    }

    var fileExtension = getFileExtension(file.name);
    if ($.inArray(fileExtension, options.allowedFormats) > -1) {
      callback(true, "Image file is valid.");
    } else {
      callback(false, "File type is not allowed.");
    }
  }

  function isValidImageUrl(url, callback) {
    var timer = null;
    var timeoutMs = 3000;
    var timeout = false;
    var image = new Image();

    image.onload = function () {
      if (!timeout) {
        window.clearTimeout(timer);

        var tempUrl = url;
        if (tempUrl.indexOf("?") !== -1) {
          tempUrl = tempUrl.split("?")[0].split("#")[0];
        }

        var fileExtension = getFileExtension(tempUrl);
        if ($.inArray(fileExtension, options.allowedFormats) > -1) {
          callback(true, "Image URL is valid.");
        } else {
          callback(false, "File type is not allowed.");
        }
      }
    };

    image.onerror = function () {
      if (!timeout) {
        window.clearTimeout(timer);
        callback(false, "Image could not be found.");
      }
    };

    image.src = url;

    timer = window.setTimeout(function () {
      timeout = true;
      image.src = "???";
      callback(false, "Loading image timed out.");
    }, timeoutMs);
  }

  function showFileTab($fileTab) {
    var $imageupload = $fileTab.closest(".imageupload");
    var $fileTabButton = $imageupload.find(".panel-heading .btn:eq(0)");

    if (!$fileTabButton.hasClass("active")) {
      var $urlTab = $imageupload.find(".url-tab");

      $imageupload.find(".panel-heading .btn:eq(1)").removeClass("active");
      $fileTabButton.addClass("active");

      $urlTab.hide();
      $fileTab.show();
      resetUrlTab($urlTab);
    }
  }

  function resetFileTab($fileTab) {
    $fileTab.find(".alert").remove();
    $fileTab.find("img").remove();
    $fileTab.find(".btn span").text("Browse");
    $fileTab.find(".btn:eq(1)").hide();
    $fileTab.find("input").val("");
  }

  function submitImageFile($fileTab) {
    var $browseFileButton = $fileTab.find(".btn:eq(0)");
    var $removeFileButton = $fileTab.find(".btn:eq(1)");
    var $fileInput = $browseFileButton.find("input");

    $fileTab.find(".alert").remove();
    $fileTab.find("img").remove();
    $browseFileButton.find("span").text("Browse");
    $removeFileButton.hide();

    if (!($fileInput[0].files && $fileInput[0].files[0])) {
      return;
    }

    $browseFileButton.prop("disabled", true);

    var file = $fileInput[0].files[0];

    isValidImageFile(file, function (isValid, message) {
      if (isValid) {
        var fileReader = new FileReader();

        fileReader.onload = function (e) {
          $fileTab.prepend(getImageThumbnailHtml(e.target.result));
          $browseFileButton.find("span").text("Change");
          $removeFileButton.css("display", "inline-block");
        };

        fileReader.onerror = function () {
          $fileTab.prepend(getAlertHtml("Error loading image file."));
          $fileInput.val("");
        };

        fileReader.readAsDataURL(file);
      } else {
        $fileTab.prepend(getAlertHtml(message));
        $browseFileButton.find("span").text("Browse");
        $fileInput.val("");
      }

      $browseFileButton.prop("disabled", false);
    });
  }

  function showImageSrc($fileTab, imgSrc) {
    var $browseFileButton = $fileTab.find(".btn:eq(0)");
    var $removeFileButton = $fileTab.find(".btn:eq(1)");
    var $fileInput = $browseFileButton.find("input");

    $fileTab.find(".alert").remove();
    $fileTab.find("img").remove();
    $browseFileButton.find("span").text("Browse");
    $removeFileButton.hide();
    $browseFileButton.prop("disabled", true);

    $fileTab.prepend(getImageThumbnailHtml(imgSrc));
    $browseFileButton.find("span").text("Change");
    $removeFileButton.css("display", "inline-block");
    $browseFileButton.prop("disabled", false);
  }

  function resetUrlTab($urlTab) {
    $urlTab.find(".alert").remove();
    $urlTab.find("input").val("");
  }
})(jQuery);
