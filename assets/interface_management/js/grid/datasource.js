(function (IM, $) {
	const source = {
		datatype: "json",
		datafields: [
			{ name: "id", type: "string" },
			{ name: "peering", type: "string" },
			{ name: "location", type: "string" },
			{ name: "interface", type: "string" },
			{ name: "pop_site", type: "string" },
			{ name: "rrd_path", type: "string" },
			{ name: "rrd_alias", type: "string" },
			{ name: "rrd_status", type: "string" },
			{ name: "Capacity", type: "number" },
			{ name: "service", type: "string" },
			{ name: "zero_traffic", type: "string" },
			{ name: "_search", type: "string" },
			{ name: "mrtg_status", type: "string" },
		],
		url: IM.cfg.baseUrl + "api/services_get",
		type: "GET",
	};

	IM.dataAdapter = new $.jqx.dataAdapter(source, {
		formatData: function (data) {
			data._ = Date.now();
			return data;
		},

		beforeLoadComplete(records) {
			records.forEach(function (row) {
				const status = String(row.rrd_status || "")
					.toLowerCase()
					.trim();
				const pathStr =
					row.rrd_path == null ? "" : String(row.rrd_path).trim().toLowerCase();
				const hasPath =
					pathStr !== "" &&
					pathStr !== "null" &&
					pathStr !== "undefined" &&
					pathStr !== "-";

				row.zero_traffic = status === "avail" && hasPath ? "true" : "false";
				row.mrtg_status = status === "avail" && hasPath ? "on" : "off";

				const parts = [
					row.id,
					row.peering,
					row.location,
					row.interface,
					row.pop_site,
					row.rrd_path,
					row.rrd_alias,
					row.rrd_status,
					row.Capacity,
					row.service,
				];
				row._search = parts
					.map((v) => (v == null ? "" : String(v)))
					.join(" ")
					.toLowerCase();
			});
			return records;
		},

		loadComplete(records) {
			IM.state = { allRecords: Array.isArray(records) ? records : [] };
			if (IM.KPI && IM.KPI.update) IM.KPI.update();
			if (IM.KPI && IM.KPI.updateTotals) IM.KPI.updateTotals();
		},

		loadError: function (xhr, status, error) {
			console.error("loadError", status, error, xhr?.responseText);
		},
	});
})(window.IM, jQuery);
