(function (IM) {
	IM.utils = {
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
})(window.IM);
