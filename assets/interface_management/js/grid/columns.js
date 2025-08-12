(function (IM, $) {
	const GRID = IM.cfg.GRID;

	IM.columns = [
		{
			text: "No",
			width: 50,
			editable: false,
			align: "center",
			textalign: "center",
			filterable: false,
			cellsrenderer: function (row) {
				return `<div style="text-align:center; width:100%;">${row + 1}</div>`;
			},
		},
		{
			text: "Peering",
			datafield: "peering",
			width: 200,
			align: "center",
			cellsalign: "center",
		},

		{
			text: "Location",
			datafield: "location",
			width: 180,
			align: "center",
			cellsalign: "center",
			filtertype: "custom",
			createfilterpanel: function (datafield, panel) {
				IM.LocationFilter.create(datafield, panel);
			},
		},

		{
			text: "Interface",
			datafield: "interface",
			width: 800,
			align: "center",
			cellsalign: "center",
			filtertype: "checkedlist",
		},
		{
			text: "POP",
			datafield: "pop_site",
			width: 150,
			align: "center",
			cellsalign: "center",
		},
		{
			text: "RRD Path",
			datafield: "rrd_path",
			width: 400,
			align: "center",
			cellsalign: "center",
		},
		{
			text: "RRD Alias",
			datafield: "rrd_alias",
			width: 350,
			align: "center",
			cellsalign: "center",
		},

		{
			text: "RRD Status",
			datafield: "rrd_status",
			width: 125,
			align: "center",
			cellsalign: "center",
			filtertype: "checkedlist",
		},
		{
			text: "Capacity",
			datafield: "Capacity",
			width: 150,
			align: "center",
			cellsalign: "center",
			filtertype: "number",
		},
		{
			text: "Service",
			datafield: "service",
			width: 80,
			align: "center",
			cellsalign: "center",
			filtertype: "checkedlist",
		},

		{
			text: "Directory",
			editable: false,
			width: 100,
			align: "center",
			filterable: false,
			cellsrenderer: function (row) {
				const rowData = $(GRID).jqxGrid("getrowdata", row);
				return `<button class="btn-directory" data-id="${rowData.id}" style="display:block; margin:0 auto;">📂</button>`;
			},
		},

		{
			text: "Zero Traffic",
			datafield: "zero_traffic",
			width: 120,
			align: "center",
			cellsalign: "center",
			filtertype: "checkedlist",
			editable: false,
			cellsrenderer: function (
				row,
				column,
				value,
				defaultHtml,
				columnProps,
				rowData
			) {
				const isTrue =
					value === true || value === "true" || value === 1 || value === "1";

				const icon = isTrue ? "bi-check-circle-fill" : "bi-x-circle-fill";
				const colorClass = isTrue ? "im-ok" : "im-bad";

				const $el = $(defaultHtml);
				$el.css("text-align", "center");
				$el.html(
					`<i class="bi ${icon} ${colorClass}" style="font-size:18px" title="${
						isTrue ? "Ya" : "Tidak"
					}"></i>`
				);

				return $el[0].outerHTML;
			},
		},
		{ datafield: "_search", hidden: true, filterable: true },
		{ datafield: "mrtg_status", hidden: true, filterable: true },
	];
})(window.IM, jQuery);
