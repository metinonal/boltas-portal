$(document).ready(function() {
    "use strict";

    $("#bilgi-datatable").DataTable({
        language: {
            paginate: {
                previous: "<i class='mdi mdi-chevron-left'>",
                next: "<i class='mdi mdi-chevron-right'>"
            },
            info: "_TOTAL_ veriden _START_ ve _END_ arası görüntüleniyor.",
            lengthMenu: '<select class="form-select form-select-sm ms-1 me-1">' +
                '<option value="5">5</option>' +
                '<option value="10">10</option>' +
                '<option value="20">20</option>' +
                '<option value="-1">Hepsi</option>' +
                '</select> veri görüntüle.'
        },
        pageLength: 5,
        columns: [
            {
                orderable: false,
                targets: 0,
                render: function(e, l, a, o) {
                    if (l === "display") {
                        e = '<div class="form-check">' +
                            '<input type="checkbox" class="form-check-input dt-checkboxes">' +
                            '<label class="form-check-label">&nbsp;</label>' +
                            '</div>';
                    }
                    return e;
                },
                checkboxes: {
                    selectRow: true,
                    selectAllRender: '<div class="form-check">' +
                        '<input type="checkbox" class="form-check-input dt-checkboxes">' +
                        '<label class="form-check-label">&nbsp;</label>' +
                        '</div>'
                }
            },
            { orderable: true },
            { orderable: true },
            { orderable: true },
            { orderable: true },
            { orderable: true },
            { orderable: false }
        ],
        select: {
            style: "multi"
        },
        order: [[1, "asc"]],
        drawCallback: function() {
            $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
            $("#products-datatable_length label").addClass("form-label");

            document.querySelector(".dataTables_wrapper .row")
                .querySelectorAll(".col-md-6")
                .forEach(function(e) {
                    e.classList.add("col-sm-6");
                    e.classList.remove("col-sm-12");
                    e.classList.remove("col-md-6");
                });
        }
    });
});
