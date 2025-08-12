(function (IM) {
	IM.utils = IM.utils || {
		hasPath(v) {
			const p = (v == null ? "" : String(v)).trim().toLowerCase();
			return p && p !== "null" && p !== "undefined" && p !== "-";
		},
		isRRDAktif(v) {
			const s = String(v || "").toLowerCase();
			return s.includes("avail") && !s.includes("unavail");
		},
		isRRDNonAktif(v) {
			return String(v || "")
				.toLowerCase()
				.includes("unavail");
		},
		isMRTGOn(row) {
			return (
				String(row.rrd_status || "").toLowerCase() === "avail" &&
				IM.utils.hasPath(row.rrd_path)
			);
		},
	};
	IM.utils.getExportColumns = function () {
		const strip = (t) => {
			const div = document.createElement("div");
			div.innerHTML = t == null ? "" : String(t);
			return div.textContent || div.innerText || "";
		};

		return (IM.columns || [])
			.filter(
				(c) =>
					c && c.datafield && c.export !== false && c.datafield !== "_search"
			)
			.map((c) => ({
				field: c.datafield,
				label: c.text ? strip(c.text) : c.datafield,
			}));
	};
	IM.utils.pickForExport = function (rows, exportCols) {
		return rows.map((r) => {
			const o = {};
			exportCols.forEach((c) => {
				o[c.label] = r[c.field];
			});
			return o;
		});
	};
})((window.IM = window.IM || {}));
