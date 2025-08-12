// assets/interface_management/js/core/api.js
(function (IM, $) {
	IM.api = {
		list() {
			return $.getJSON(IM.cfg.baseUrl + "api/services_get");
		},
		add(row) {
			return $.ajax({
				url: IM.cfg.baseUrl + "api/services_add",
				type: "POST",
				data: row,
				dataType: "json",
			});
		},
		update(id, row) {
			return $.ajax({
				url: IM.cfg.baseUrl + "api/services_update/" + id,
				type: "PUT",
				data: JSON.stringify(row),
				dataType: "json",
				contentType: "application/json; charset=utf-8",
			});
		},
		remove(id) {
			return $.ajax({
				url: IM.cfg.baseUrl + "api/services_delete/" + id,
				type: "DELETE",
				dataType: "json",
			});
		},
		importBulk(rows) {
			return $.ajax({
				url: IM.cfg.baseUrl + "api/services_import_bulk",
				type: "POST",
				data: JSON.stringify({ rows }),
				dataType: "json",
				contentType: "application/json; charset=utf-8",
			});
		},
	};
})(window.IM, jQuery);
