// assets/interface_management/js/core/api.js
(function (IM, $) {
	// pastikan namespace ada
	IM = window.IM = window.IM || {};
	IM.cfg = IM.cfg || {};

	// normalisasi baseUrl (optional, biar aman trailing slash)
	var base = String(IM.cfg.baseUrl || "/");
	if (!base.endsWith("/")) base += "/";

	// helper kecil untuk GET JSON
	function getJSON(path) {
		return $.getJSON(base + path);
	}

	// helper kecil untuk POST JSON
	function postJSON(path, body) {
		return $.ajax({
			url: base + path,
			type: "POST",
			data: body,
			dataType: "json",
		});
	}

	// helper kecil untuk PUT JSON
	function putJSON(path, body) {
		return $.ajax({
			url: base + path,
			type: "PUT",
			data: JSON.stringify(body),
			dataType: "json",
			contentType: "application/json; charset=utf-8",
		});
	}

	// helper kecil untuk DELETE
	function del(path) {
		return $.ajax({
			url: base + path,
			type: "DELETE",
			dataType: "json",
		});
	}

	// helper kecil untuk POST JSON (payload array/besar)
	function postJSONBody(path, obj) {
		return $.ajax({
			url: base + path,
			type: "POST",
			data: JSON.stringify(obj),
			dataType: "json",
			contentType: "application/json; charset=utf-8",
		});
	}

	// === DEFINISI API TERPUSAT ===
	IM.api = {
		// READ
		list() {
			return getJSON("api/services_get");
		},

		// CREATE
		add(row) {
			return postJSON("api/services_add", row);
		},

		// UPDATE
		update(id, row) {
			return putJSON("api/services_update/" + id, row);
		},

		// DELETE
		remove(id) {
			return del("api/services_delete/" + id);
		},

		// IMPORT BULK
		importBulk(rows) {
			return postJSONBody("api/services_import_bulk", { rows });
		},

		// DIRECTORY (untuk popup path RRD)
		directory(id) {
			return getJSON("api/services_directory/" + id);
		},
	};

	// opsional: cegah overwrite tidak sengaja di modul lain
	// Object.freeze(IM.api);
})(window.IM, jQuery);
