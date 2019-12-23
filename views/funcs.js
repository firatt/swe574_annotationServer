$(function () {

  $(".delete").click(function () {
    try {
      const dbIdName = $(this).data('id');
      $.ajax({
        type: 'POST',
        url: '/deleteAnnotation',
        data: { "annoId": dbIdName },
        success: function () {
          alert("Annotation was removed");
          window.location.reload();
        }
      });
    } catch (error) {
      console.log("EJS deletion AJAX request: " + error);
    }

  });

});