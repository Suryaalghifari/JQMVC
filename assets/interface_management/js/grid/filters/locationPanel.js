(function (IM, $) {
	IM.LocationFilter = {
		create(datafield, panel) {
			const GRID = IM.cfg.GRID;

			$(panel).closest("li").css({ height: "auto", overflow: "visible" });
			$(panel).css({
				display: "block",
				maxHeight: "none",
				overflow: "visible",
			});

			const $wrap = $('<div class="cm-filter-wrap"></div>').appendTo(panel);

			const rows = $(GRID).jqxGrid("getboundrows") || [];
			const seen = {},
				values = [];
			for (let i = 0; i < rows.length; i++) {
				const v = rows[i][datafield];
				if (v != null && v !== "" && !seen[v]) {
					seen[v] = true;
					values.push(v);
				}
			}
			values.sort();

			const $lbHolder = $('<div class="lb-holder"></div>').appendTo($wrap);
			const $list = $("<div/>").appendTo($lbHolder).jqxListBox({
				source: values,
				checkboxes: true,
				filterable: true,
				searchMode: "containsignorecase",
				width: "100%",
				height: 160, // <-- samain
			});

			$(
				'<div style="margin:2px 0 2px;font-weight:600">Show rows where:</div>'
			).appendTo($wrap);

			const OPS = [
				{ label: "empty", value: "null" },
				{ label: "not empty", value: "not_null" },
				{ label: "contains", value: "contains" },
				{ label: "contains (match case)", value: "contains_case_sensitive" },
				{ label: "does not contain", value: "does_not_contain" },
				{
					label: "does not contain (match case)",
					value: "does_not_contain_case_sensitive",
				},
				{ label: "equals", value: "equal" },
				{ label: "not equal", value: "not_equal" },
				{ label: "starts with", value: "starts_with" },
				{
					label: "starts with (match case)",
					value: "starts_with_case_sensitive",
				},
				{ label: "ends with", value: "ends_with" },
				{ label: "ends with (match case)", value: "ends_with_case_sensitive" },
			];

			function makeRow(parent) {
				const ddOpts = {
					source: OPS,
					displayMember: "label",
					valueMember: "value",
					selectedIndex: 2,
					width: "100%",
					height: 28,
					enableBrowserBoundsDetection: true, // <-- samain
					dropDownVerticalAlignment: "top", // <-- samain
					animationType: "none", // <-- samain
				};
				const $op = $("<div></div>").appendTo(parent).jqxDropDownList(ddOpts);
				const $inp = $('<input type="text">')
					.appendTo(parent)
					.jqxInput({ width: "100%", height: 28 });

				const toggle = (v) =>
					$inp
						.closest(".jqx-input, input")
						.toggle(!(v === "null" || v === "not_null"));
				$op.on("change", (e) =>
					toggle(e.args && e.args.item ? e.args.item.value : $op.val())
				);
				toggle($op.val());
				return { op: $op, inp: $inp };
			}

			const row1 = makeRow($wrap);
			const $join = $('<div style="margin:6px 0"></div>')
				.appendTo($wrap)
				.jqxDropDownList({
					source: ["And", "Or"],
					selectedIndex: 0,
					width: "100%",
					height: 26,
					enableBrowserBoundsDetection: true,
					dropDownVerticalAlignment: "top",
					animationType: "none",
				});
			const row2 = makeRow($wrap);

			const $bar = $('<div class="btnbar"></div>').appendTo($wrap);
			const $btnFilter = $("<button>Filter</button>")
				.appendTo($bar)
				.jqxButton();
			const $btnClear = $("<button>Clear</button>").appendTo($bar).jqxButton();

			$btnFilter.on("click", function () {
				const fg = new $.jqx.filter();
				const OR = 1,
					AND = 0;

				const items = $list.jqxListBox("getCheckedItems") || [];
				for (let i = 0; i < items.length; i++) {
					fg.addfilter(
						OR,
						fg.createfilter("stringfilter", items[i].label, "equal")
					);
				}

				const op1 = row1.op.val();
				if (op1 === "null" || op1 === "not_null") {
					fg.addfilter(AND, fg.createfilter("stringfilter", "", op1));
				} else {
					const v1 = row1.inp.val().trim();
					if (v1) fg.addfilter(AND, fg.createfilter("stringfilter", v1, op1));
				}

				const join = $join.val() === "And" ? AND : OR;
				const op2 = row2.op.val();
				if (op2 === "null" || op2 === "not_null") {
					fg.addfilter(join, fg.createfilter("stringfilter", "", op2));
				} else {
					const v2 = row2.inp.val().trim();
					if (v2) fg.addfilter(join, fg.createfilter("stringfilter", v2, op2));
				}

				if (fg.getfilterscount() === 0) {
					$(GRID).jqxGrid("removefilter", datafield, true);
					return;
				}
				$(GRID).jqxGrid("addfilter", datafield, fg);
				$(GRID).jqxGrid("applyfilters");
			});

			$btnClear.on("click", function () {
				$(GRID).jqxGrid("removefilter", datafield, true);
			});

			const $li = $(panel).closest("li");
			if ($li.length) {
				$li[0].style.removeProperty("height");
				$li[0].style.setProperty("height", "auto", "important");
				$li.css({ overflow: "visible" });
			}
		},
	};
})(window.IM, jQuery);
