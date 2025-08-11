(function (IM, $) {
	IM.api = {
		list() {
			return $.getJSON(IM.cfg.baseUrl + "api/services_get");
		},
		add(row) {
			return $.post(IM.cfg.baseUrl + "api/services_add", row);
		},
		update(id, row) {
			return $.ajax({
				url: IM.cfg.baseUrl + "api/services_update/" + id,
				type: "PUT",
				data: JSON.stringify(row),
				dataType: "json",
			});
		},
		remove(id) {
			return $.ajax({
				url: IM.cfg.baseUrl + "api/services_delete/" + id,
				type: "DELETE",
				dataType: "json",
			});
		},
		directory(id) {
			return $.getJSON(IM.cfg.baseUrl + "api/services_directory/" + id);
		},
	};
})(window.IM, jQuery);
