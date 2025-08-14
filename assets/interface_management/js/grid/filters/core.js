(function (IM, $) {
	const getGRID = () => (IM && IM.cfg && IM.cfg.GRID) || null;

	const STRING_OPS = [
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
		{ label: "starts with (match case)", value: "starts_with_case_sensitive" },
		{ label: "ends with", value: "ends_with" },
		{ label: "ends with (match case)", value: "ends_with_case_sensitive" },
	];

	const NUMBER_OPS = [
		{ label: "=", value: "equal" },
		{ label: "≠", value: "not_equal" },
		{ label: ">", value: "greater_than" },
		{ label: "≥", value: "greater_than_or_equal" },
		{ label: "<", value: "less_than" },
		{ label: "≤", value: "less_than_or_equal" },
		{ label: "between", value: "between" },
		{ label: "empty", value: "null" },
		{ label: "not empty", value: "not_null" },
	];

	function getUniqueValues(
		rows,
		datafield,
		{ limit = 1000, sort = true } = {}
	) {
		const seen = Object.create(null),
			out = [];
		for (let i = 0; i < rows.length; i++) {
			const v = rows[i][datafield];
			if (v != null && v !== "" && !seen[v]) {
				seen[v] = true;
				out.push(v);
				if (out.length >= limit) break;
			}
		}
		if (sort) out.sort();
		return out;
	}

	function ensurePanelBox(panelEl) {
		$(panelEl).closest("li").css({ height: "auto", overflow: "visible" });
		$(panelEl).css({
			display: "block",
			maxHeight: "none",
			overflow: "visible",
		});
		return $('<div class="cm-filter-wrap"></div>').appendTo(panelEl);
	}

	const state = {};

	function applyFilterGroup(datafield, fg) {
		const GRID = getGRID();
		if (!GRID) return;
		if (fg.getfilterscount() === 0) {
			$(GRID).jqxGrid("removefilter", datafield, true);
			return;
		}
		$(GRID).jqxGrid("addfilter", datafield, fg);
		$(GRID).jqxGrid("applyfilters");
	}

	function createStringPanel(datafield, panel, opts = {}) {
		const GRID = getGRID();
		const $wrap = ensurePanelBox(panel);

		const rows = GRID ? $(GRID).jqxGrid("getboundrows") || [] : [];
		const values = getUniqueValues(rows, datafield, {
			limit: opts.limit || 1000,
		});

		const $list = $("<div/>")
			.appendTo($('<div class="lb-holder"></div>').appendTo($wrap))
			.jqxListBox({
				source: values,
				checkboxes: true,
				filterable: true,
				searchMode: "containsignorecase",
				width: "100%",
				height: opts.listHeight || 160,
			});

		$(
			'<div style="margin:2px 0;font-weight:600">Show rows where:</div>'
		).appendTo($wrap);

		function makeRow(parent, selectedIndex = 2) {
			const $op = $("<div/>").appendTo(parent).jqxDropDownList({
				source: STRING_OPS,
				displayMember: "label",
				valueMember: "value",
				selectedIndex,
				width: "100%",
				height: 28,
				enableBrowserBoundsDetection: true,
				dropDownVerticalAlignment: "top",
				animationType: "none",
			});
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

		const row1 = makeRow($wrap, 2);
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
		const row2 = makeRow($wrap, 2);

		const $bar = $('<div class="btnbar"></div>').appendTo($wrap);
		const $btnFilter = $("<button>Filter</button>").appendTo($bar).jqxButton();
		const $btnClear = $("<button>Clear</button>").appendTo($bar).jqxButton();

		if (state[datafield]) {
			const labels = state[datafield].checked || [];
			labels.forEach((lbl) => {
				const item =
					$list.jqxListBox("getItemByValue", lbl) ||
					$list.jqxListBox("getItemByIndex", values.indexOf(lbl));
				if (item) $list.jqxListBox("checkItem", item);
			});
			const s = state[datafield];
			if (s.row1) {
				row1.op.val(s.row1.op);
				row1.inp.val(s.row1.val || "");
			}
			if (s.row2) {
				row2.op.val(s.row2.op);
				row2.inp.val(s.row2.val || "");
			}
			if (s.join) $join.val(s.join);
		}

		$btnFilter.on("click", function () {
			const fg = new $.jqx.filter();
			const OR = 1,
				AND = 0;

			const items = $list.jqxListBox("getCheckedItems") || [];
			const checkedLabels = [];
			for (let i = 0; i < items.length; i++) {
				fg.addfilter(
					OR,
					fg.createfilter("stringfilter", items[i].label, "equal")
				);
				checkedLabels.push(items[i].label);
			}

			const op1 = row1.op.val();
			if (op1 === "null" || op1 === "not_null") {
				fg.addfilter(AND, fg.createfilter("stringfilter", "", op1));
			} else {
				const v1 = (row1.inp.val() || "").trim();
				if (v1) fg.addfilter(AND, fg.createfilter("stringfilter", v1, op1));
			}

			const join = $join.val() === "And" ? AND : OR;
			const op2 = row2.op.val();
			if (op2 === "null" || op2 === "not_null") {
				fg.addfilter(join, fg.createfilter("stringfilter", "", op2));
			} else {
				const v2 = (row2.inp.val() || "").trim();
				if (v2) fg.addfilter(join, fg.createfilter("stringfilter", v2, op2));
			}

			state[datafield] = {
				checked: checkedLabels,
				row1: { op: op1, val: row1.inp.val() },
				row2: { op: op2, val: row2.inp.val() },
				join: $join.val(),
			};

			applyFilterGroup(datafield, fg);
		});

		$btnClear.on("click", function () {
			state[datafield] = undefined;
			const GRID = getGRID();
			if (GRID) $(GRID).jqxGrid("removefilter", datafield, true);
		});

		const $li = $(panel).closest("li");
		if ($li.length) {
			$li[0].style.removeProperty("height");
			$li[0].style.setProperty("height", "auto", "important");
			$li.css({ overflow: "visible" });
		}
	}

	function createNumberPanel(datafield, panel, opts = {}) {
		const $wrap = ensurePanelBox(panel);

		function makeRow(parent, selectedIndex = 0) {
			const $op = $("<div/>").appendTo(parent).jqxDropDownList({
				source: NUMBER_OPS,
				displayMember: "label",
				valueMember: "value",
				selectedIndex,
				width: "100%",
				height: 28,
				enableBrowserBoundsDetection: true,
				dropDownVerticalAlignment: "top",
				animationType: "none",
			});
			const $a = $('<input type="number" step="any">')
				.appendTo(parent)
				.jqxInput({ width: "100%", height: 28 });
			const $b = $(
				'<input type="number" step="any" placeholder="max (only for between)">'
			)
				.appendTo(parent)
				.jqxInput({ width: "100%", height: 28 })
				.hide();

			const toggle = (v) =>
				$b.closest(".jqx-input, input").toggle(v === "between");
			$op.on("change", (e) =>
				toggle(e.args && e.args.item ? e.args.item.value : $op.val())
			);
			toggle($op.val());
			return { op: $op, a: $a, b: $b };
		}

		const row = makeRow($wrap, 0);

		const $bar = $('<div class="btnbar"></div>').appendTo($wrap);
		const $btnFilter = $("<button>Filter</button>").appendTo($bar).jqxButton();
		const $btnClear = $("<button>Clear</button>").appendTo($bar).jqxButton();

		$btnFilter.on("click", function () {
			const fg = new $.jqx.filter();
			const AND = 0;

			const op = row.op.val();
			if (op === "null" || op === "not_null") {
				fg.addfilter(AND, fg.createfilter("numericfilter", "", op));
			} else if (op === "between") {
				const min = row.a.val();
				const max = row.b.val();
				if (min !== "" && max !== "") {
					fg.addfilter(
						AND,
						fg.createfilter("numericfilter", +min, "greater_than_or_equal")
					);
					fg.addfilter(
						AND,
						fg.createfilter("numericfilter", +max, "less_than_or_equal")
					);
				}
			} else {
				const v = row.a.val();
				if (v !== "")
					fg.addfilter(AND, fg.createfilter("numericfilter", +v, op));
			}

			applyFilterGroup(datafield, fg);
		});

		$btnClear.on("click", function () {
			const GRID = getGRID();
			if (GRID) $(GRID).jqxGrid("removefilter", datafield, true);
		});
	}

	const registry = {
		string: createStringPanel,
		number: createNumberPanel,
	};

	const Filters = {
		register: (type, fn) => {
			registry[type] = fn;
		},
		attach: (type, datafield, panel, opts) => {
			const fn = registry[type];
			if (!fn) throw new Error(`Unknown filter type: ${type}`);
			fn(datafield, panel, opts);
		},
		state,
	};

	IM.Filters = Filters;
})(window.IM, jQuery);
