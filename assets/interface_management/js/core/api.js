(function (IM, $) {
	IM = window.IM = window.IM || {};
	IM.cfg = IM.cfg || {};

	var base = String(IM.cfg.baseUrl || "/");
	if (!base.endsWith("/")) base += "/";

	function getJSON(path) {
		return $.getJSON(base + path);
	}

	function postJSON(path, body) {
		return $.ajax({
			url: base + path,
			type: "POST",
			data: body,
			dataType: "json",
		});
	}

	function putJSON(path, body) {
		return $.ajax({
			url: base + path,
			type: "PUT",
			data: JSON.stringify(body),
			dataType: "json",
			contentType: "application/json; charset=utf-8",
		});
	}

	function del(path) {
		return $.ajax({
			url: base + path,
			type: "DELETE",
			dataType: "json",
		});
	}

	function postJSONBody(path, obj) {
		return $.ajax({
			url: base + path,
			type: "POST",
			data: JSON.stringify(obj),
			dataType: "json",
			contentType: "application/json; charset=utf-8",
		});
	}

	IM.api = {
		list() {
			return getJSON("api/services_get");
		},

		add(row) {
			return postJSON("api/services_add", row);
		},

		update(id, row) {
			return putJSON("api/services_update/" + id, row);
		},

		remove(id) {
			return del("api/services_delete/" + id);
		},

		importBulk(rows) {
			return postJSONBody("api/services_import_bulk", { rows });
		},

		directory(id) {
			return getJSON("api/services_directory/" + id);
		},
	};
})(window.IM, jQuery);
