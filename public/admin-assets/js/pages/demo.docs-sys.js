$(document).ready(function() {
    "use strict";

    $("#docss-datatable").DataTable({
        dom: 'tp',
        ordering: false,
        pageLength: 5,
        columns: [
            { title: "", orderable: false },
            { title: "", orderable: false }
        ],
        language: {
            info: "",
            paginate: {
                previous: "<i class='mdi mdi-chevron-left'></i>",
                next: "<i class='mdi mdi-chevron-right'></i>"
            }
        },
        headerCallback: function(thead, data, start, end, display) {
            $(thead).empty(); // thead görünmesin
        },
        drawCallback: function() {
            $(".dataTables_paginate").addClass("pagination-rounded").css("display", "block");

            $(".dataTables_wrapper .row").find(".col-md-6").each(function() {
                $(this).addClass("col-sm-6").removeClass("col-sm-12 col-md-6");
            });
        }
    });
});
