// js/features/edit.js
(function (IM, $) {
	if (!IM) window.IM = {};
	const GRID = IM.cfg && IM.cfg.GRID ? IM.cfg.GRID : "#jqxgrid";

	let selectedIds = new Set();
	let pending = {}; // { id: { field: newVal, ... }, ... }
	let mode = "idle"; // "idle" | "editing"
	let $bar = null;
	let $btnEdit = null;

	const $g = () => $(GRID);
	const getRowIdByIndex = (i) => $g().jqxGrid("getrowid", i);
	const isSelectedId = (id) => selectedIds.has(String(id));
	const isBulkEditing = () => mode === "editing";

	// ==== Public API (dipakai actions.js kalau perlu) ====
	IM.Edit = IM.Edit || {};
	IM.Edit.isBulkEditing = () => isBulkEditing();

	// ==== Button "Edit (N)" ====
	function ensureHeaderEditButton() {
		// PRIORITAS: pakai tombol yang sudah ada di view (id=btnInlineEdit)
		$btnEdit = $("#btnInlineEdit");
		if ($btnEdit.length === 0) {
			// fallback: inject ke .grid-tools
			const $tools = $(".grid-header .grid-tools");
			if ($tools.length) {
				$tools.append(
					'<button id="btnInlineEdit" class="btn-primary" style="display:none;"><i class="bi bi-pencil"></i> Edit (<span class="cnt">0</span>)</button>'
				);
			} else {
				$(GRID).before(
					'<div style="text-align:right; margin:8px 0;"><button id="btnInlineEdit" class="btn-primary" style="display:none;"><i class="bi bi-pencil"></i> Edit (<span class="cnt">0</span>)</button></div>'
				);
			}
			$btnEdit = $("#btnInlineEdit");
		}
		$btnEdit.off("click.im-edit").on("click.im-edit", enterEditing);
		return $btnEdit;
	}

	function updateHeaderEditButton() {
		ensureHeaderEditButton();
		if (isBulkEditing()) return void $btnEdit.hide();
		const n = selectedIds.size;
		if (n > 0) {
			$btnEdit.find(".cnt").text(n);
			$btnEdit.show();
		} else {
			$btnEdit.hide();
		}
	}

	// ==== Bar Simpan/Batal ====
	function ensureBar() {
		if ($bar && $bar.length) return $bar;
		const html = `
      <div id="im-inline-edit-bar" style="display:none; margin:8px 0; padding:8px; border:1px solid #e2e8f0; background:#fff;">
        <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
          <div><strong>Data Interface</strong> <span class="im-subtext">(<span id="im-selected-count">0</span> dipilih)</span></div>
          <div style="margin-left:auto; display:flex; gap:8px;">
            <button type="button" id="im-save" class="btn btn-success"><i class="bi bi-check2"></i> Simpan</button>
            <button type="button" id="im-cancel" class="btn btn-light">Batal</button>
          </div>
        </div>
      </div>
    `;
		$(GRID).before(html);
		$bar = $("#im-inline-edit-bar");

		$bar.on("click", "#im-save", onSave);
		$bar.on("click", "#im-cancel", onCancel);

		// styling ringan (menggunakan kelas tombol yang sudah ada di CSS kamu)
		if (!document.getElementById("im-inline-style")) {
			const css = `
        .im-row-editing { background: #fff9db !important; }
        .im-cell-changed { box-shadow: inset 0 0 0 2px #f59e0b; }
        #im-inline-edit-bar .btn { padding: 6px 10px; border-radius: 10px; }
        #im-inline-edit-bar .btn-success { background:#16a34a; color:#fff; border:0; }
        #im-inline-edit-bar .btn-light { background:#f1f5f9; border:1px solid #e2e8f0; }
        #im-inline-edit-bar .im-subtext { color:#64748b; font-weight:400; }
      `;
			$("<style id='im-inline-style'>").text(css).appendTo(document.head);
		}
		return $bar;
	}

	function updateBar() {
		ensureBar();
		$("#im-selected-count").text(selectedIds.size);
		if (isBulkEditing()) $bar.show();
		else $bar.hide();
	}

	// ==== Masuk/Keluar mode editing ====
	function enterEditing() {
		if (selectedIds.size === 0) return;
		mode = "editing";
		pending = {};
		applyRowEditingHighlight(true);
		updateBar();
		updateHeaderEditButton();
		window.showNotif?.({
			icon: "info",
			title: "Mode edit banyak baris",
			text: "Ubah sel pada baris terpilih, lalu klik Simpan/Batal.",
			toast: true,
			timer: 1800,
			position: "center",
			size: "xs",
		});
	}

	function exitEditing(resetSelection = true) {
		mode = "idle";
		pending = {};
		$g().find(".im-cell-changed").removeClass("im-cell-changed");
		applyRowEditingHighlight(false);
		updateBar();
		if (resetSelection) {
			$g().jqxGrid("clearselection");
			selectedIds.clear();
		}
		updateHeaderEditButton();
	}

	function applyRowEditingHighlight(on) {
		const info = $g().jqxGrid("getdatainformation");
		const total = (info && info.rowscount) || 0;
		for (let i = 0; i < total; i++) {
			const id = getRowIdByIndex(i);
			const should = on && isSelectedId(id);
			const $cells = $g().find(
				`div[data-rowindex='${i}'] .jqx-grid-cell, div[role='row']:has([data-row='${i}']) .jqx-grid-cell`
			);
			if (should) $cells.addClass("im-row-editing");
			else $cells.removeClass("im-row-editing");
		}
	}

	// ==== Selection wiring ====
	function rebuildSelectionFromGrid() {
		const idxs = $g().jqxGrid("getselectedrowindexes") || [];
		const s = new Set();
		idxs.forEach((i) => {
			const id = getRowIdByIndex(i);
			if (id != null) s.add(String(id));
		});
		selectedIds = s;
	}
	function onSelectionChanged() {
		rebuildSelectionFromGrid();
		if (isBulkEditing() && selectedIds.size === 0) exitEditing(false);
		updateBar();
		updateHeaderEditButton();
	}
	function wireSelection() {
		const fn = onSelectionChanged;
		$g().on("rowselect rowunselect rowcheck rowuncheck", fn);
		$g().on("bindingcomplete filter sort pagechanged pagesizechanged", fn);
	}

	// ==== Guard & capture perubahan ====
	function guardCellBeginEdit() {
		// Hanya batasi saat MODE EDITING
		$g().on("cellbeginedit", function (e) {
			if (!isBulkEditing()) return;
			const rowIndex = e.args.rowindex;
			const datafield = e.args.datafield;
			const id = getRowIdByIndex(rowIndex);
			const allowed = id != null && isSelectedId(id);
			if (!allowed) {
				setTimeout(
					() => $g().jqxGrid("endcelledit", rowIndex, datafield, true),
					0
				);
			}
		});

		// Kumpulkan perubahan (tanpa commit)
		$g().on("cellvaluechanged", function (e) {
			if (!isBulkEditing()) return;
			const { rowindex, datafield, newvalue, oldvalue } = e.args;
			const id = getRowIdByIndex(rowindex);
			if (id == null || !isSelectedId(id)) return;

			const sid = String(id);
			pending[sid] = pending[sid] || {};
			if (newvalue === oldvalue) {
				if (pending[sid]) delete pending[sid][datafield];
				if (pending[sid] && Object.keys(pending[sid]).length === 0)
					delete pending[sid];
			} else {
				pending[sid][datafield] = newvalue;
			}

			// highlight sel berubah
			const cell = $g().jqxGrid("getcell", rowindex, datafield);
			if (cell && cell.element) {
				const $cell = $(cell.element);
				if (newvalue !== oldvalue) $cell.addClass("im-cell-changed");
				else $cell.removeClass("im-cell-changed");
			}
		});
	}

	// ==== Simpan / Batal ====
	function onCancel() {
		exitEditing(false);
		$g().jqxGrid("updatebounddata");
		window.showNotif?.({
			icon: "info",
			title: "Perubahan dibatalkan",
			toast: true,
			timer: 1600,
			position: "center",
			size: "xs",
		});
	}

	async function onSave() {
		const entries = Object.entries(pending);
		const totalChanges = entries.reduce(
			(acc, [, obj]) => acc + Object.keys(obj).length,
			0
		);

		if (entries.length === 0) {
			window.showNotif?.({
				icon: "info",
				title: "Tidak ada perubahan",
				toast: true,
				timer: 1600,
				position: "center",
				size: "xs",
			});
			exitEditing(false);
			return;
		}

		// Konfirmasi via swalNotif.js
		try {
			const ask = await window.confirmBulkEdit?.({
				selectedCount: selectedIds.size,
				changedRows: entries.length,
				totalChanges,
			});
			if (!ask || !ask.isConfirmed) return;
		} catch (_) {
			/* ignore */
		}

		// Kirim per-ID
		let ok = 0,
			fail = 0,
			done = 0;
		const totalReq = entries.length;

		entries.forEach(([id, changes]) => {
			const body = { ...changes };
			if ("pop_site" in body) {
				body.pop = body.pop_site;
				delete body.pop_site;
			}
			if ("Capacity" in body) {
				const v = body.Capacity;
				body.Capacity =
					v === "" || v === null || typeof v === "undefined"
						? null
						: parseFloat(v);
			}

			$.ajax({
				url: IM.cfg.baseUrl + "api/services_update/" + encodeURIComponent(id),
				method: "PUT",
				contentType: "application/json",
				dataType: "json",
				data: JSON.stringify(body),
			})
				.done((r) => {
					r && r.success ? ok++ : fail++;
				})
				.fail(() => {
					fail++;
				})
				.always(() => {
					done++;
					if (done === totalReq) {
						window.showBulkEditResult?.({ ok, fail });
						$g().jqxGrid("updatebounddata");
						exitEditing(); // clear selection
					}
				});
		});
	}

	// ==== INIT ====
	IM.Edit.initBulk = function () {
		ensureHeaderEditButton();
		ensureBar();
		wireSelection();
		guardCellBeginEdit();
	};
})(window.IM, jQuery);
