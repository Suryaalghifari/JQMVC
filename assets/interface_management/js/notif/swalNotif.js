(function () {
	function popupClass(size = "sm", extra = "") {
		const map = { xs: "swal-xs", sm: "swal-sm", md: "swal-md", lg: "swal-lg" };
		return [map[size] || "", extra].filter(Boolean).join(" ");
	}

	window.showNotif = function ({
		icon = "info",
		title = "",
		text = "",
		html = "",
		timer = null,
		toast = false,
		position = "center",
		size = "sm",
		customPopupClass = "",
		showConfirmButton,
		confirmButtonText,
	} = {}) {
		Swal.fire({
			icon,
			title,
			text,
			html,
			timer,
			toast,
			position,
			showConfirmButton,
			confirmButtonText,
			timerProgressBar: !!timer,
			customClass: { popup: popupClass(size, customPopupClass) },
		});
	};

	window.confirmPermanentDelete = function (count) {
		return Swal.fire({
			icon: "warning",
			title: "Hapus permanen?",
			html: `
        <div class="swl-text">
          Anda akan menghapus <b>${count}</b> data.<br>
          <span class="swl-sub">Tindakan ini tidak bisa dibatalkan.</span>
        </div>
        <label class="ack">
          <input type="checkbox" id="ack-del">
          <span>Saya paham, data akan <b>hilang permanen</b>.</span>
        </label>`,
			showCancelButton: true,
			confirmButtonText: "Ya, hapus",
			cancelButtonText: "Batal",
			reverseButtons: true,
			focusCancel: true,
			confirmButtonColor: "#d33",
			customClass: { popup: popupClass("xs", "swal-compact") },
			preConfirm: () => {
				if (!document.getElementById("ack-del")?.checked) {
					Swal.showValidationMessage("Centang konfirmasi terlebih dulu.");
					return false;
				}
			},
		});
	};

	window.chooseExportFormat = function (count) {
		return Swal.fire({
			title: "Export Data",
			html: `
        <div style="text-align:left">
          <p style="margin:0 0 12px">Pilih format untuk <b>${count}</b> data</p>
          <label style="display:flex;gap:10px;align-items:flex-start;margin:8px 0;padding:10px;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;">
            <input type="radio" name="exportType" value="csv" checked>
            <div><div style="font-weight:600">CSV</div><div style="font-size:12px;color:#6b7280">.csv</div></div>
          </label>
          <label style="display:flex;gap:10px;align-items:flex-start;margin:8px 0;padding:10px;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;">
            <input type="radio" name="exportType" value="xlsx">
            <div><div style="font-weight:600">Excel</div><div style="font-size:12px;color:#6b7280">.xlsx</div></div>
          </label>
        </div>`,
			showCancelButton: true,
			cancelButtonText: "Batal",
			confirmButtonText: "Export CSV",
			focusConfirm: false,
			didOpen: () => {
				const radios = Swal.getHtmlContainer().querySelectorAll(
					'input[name="exportType"]'
				);
				const update = () => {
					const t = [...radios].find((r) => r.checked)?.value || "csv";
					Swal.getConfirmButton().textContent =
						t === "xlsx" ? "Export Excel" : "Export CSV";
				};
				radios.forEach((r) => r.addEventListener("change", update));
				update();
			},
			preConfirm: () => {
				const type = Swal.getHtmlContainer().querySelector(
					'input[name="exportType"]:checked'
				)?.value;
				if (!type) {
					Swal.showValidationMessage("Pilih format export terlebih dahulu");
					return false;
				}
				return { type };
			},
			customClass: { popup: popupClass("sm") },
		});
	};

	window.confirmExport = function (count, type) {
		return Swal.fire({
			icon: "question",
			title: "Konfirmasi Export",
			html: `Anda akan mengekspor <b>${count}</b> baris ke <b>${type.toUpperCase()}</b>.`,
			showCancelButton: true,
			confirmButtonText: "Ya, export sekarang",
			cancelButtonText: "Batal",
			allowOutsideClick: false,
			customClass: { popup: popupClass("xs", "swal-compact") },
		});
	};

	window.showLoading = function (title = "Menyiapkan file…", size = "xs") {
		Swal.fire({
			title,
			allowOutsideClick: false,
			allowEscapeKey: false,
			didOpen: () => Swal.showLoading(),
			showConfirmButton: false,
			customClass: { popup: popupClass(size) },
		});
	};

	window.showImportPreview = function (valids, errors, opts = {}) {
		const compact = opts.compact !== false;
		const total = valids.length + errors.length;
		const take = compact ? 3 : 5;

		const sample = valids
			.slice(0, take)
			.map(
				(r) => `
      <tr>
        <td class="t">${r.peering || "-"}</td>
        <td class="t">${r.location || "-"}</td>
        <td class="t">${r.interface || "-"}</td>
        <td class="t">${r.pop_site || "-"}</td>
      </tr>`
			)
			.join("");

		const errHtml = errors.length
			? `
      <details style="margin-top:8px">
        <summary style="cursor:pointer">Lihat ${Math.min(
					errors.length,
					10
				)} error pertama</summary>
        <div style="max-height:120px;overflow:auto;border:1px dashed #fecaca;border-radius:8px;padding:8px;margin-top:6px;">
          ${errors
						.slice(0, 10)
						.map((e) => `Row ${e.row}: ${e.errors.join(", ")}`)
						.join("<br>")}
          ${errors.length > 10 ? "… (dipotong)" : ""}
        </div>
      </details>`
			: "";

		const html = `
      <style>
        .imp-wrap{font-size:13px}
        .badge{display:flex;gap:6px;align-items:center;border:1px solid #e5e7eb;border-radius:10px;padding:8px 10px}
        .b-green{background:#ecfdf5;border-color:#d1fae5}
        .b-red{background:#fef2f2;border-color:#fee2e2}
        .b-blue{background:#eff6ff;border-color:#dbeafe}
        .k{font-size:11px;opacity:.7}
        table.preview{width:100%;border-collapse:collapse}
        table.preview th, table.preview td{padding:6px 8px;border-bottom:1px solid #eef2f7}
        table.preview th{background:#f8fafc;font-weight:600}
        .t{max-width:190px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      </style>
      <div class="imp-wrap">
        <div class="metrics" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">
          <div class="badge b-green"><div><div class="k">Valid</div><div style="font-weight:700">${
						valids.length
					}</div></div></div>
          <div class="badge b-red"><div><div class="k">Error</div><div style="font-weight:700">${
						errors.length
					}</div></div></div>
          <div class="badge b-blue"><div><div class="k">Total</div><div style="font-weight:700">${total}</div></div></div>
        </div>
        <div style="font-weight:600;margin:6px 0 4px">Preview</div>
        <div style="max-height:${
					compact ? 160 : 220
				}px;overflow:auto;border:1px solid #e5e7eb;border-radius:10px">
          <table class="preview">
            <thead><tr><th>Peering</th><th>Location</th><th>Interface</th><th>POP</th></tr></thead>
            <tbody>${
							sample ||
							`<tr><td colspan="4" style="padding:10px;color:#64748b">Tidak ada sample</td></tr>`
						}</tbody>
          </table>
        </div>
        ${errHtml}
      </div>`;

		return Swal.fire({
			icon: errors.length ? "warning" : "question",
			title: "Import Data Interface",
			html,
			showCancelButton: true,
			confirmButtonText: `Import ${valids.length} baris`,
			cancelButtonText: "Batal",
			customClass: { popup: popupClass(compact ? "sm" : "lg", "swal-import") },
		});
	};

	window.showImportWorking = function (total) {
		return Swal.fire({
			title: "Mengimpor…",
			html: `<div id="imp-progress" style="font-size:13px">0 / ${total}</div>`,
			allowOutsideClick: false,
			allowEscapeKey: false,
			didOpen: () => Swal.showLoading(),
			showConfirmButton: false,
			customClass: { popup: popupClass("xs") },
		});
	};

	window.updateImportProgress = function (done, total) {
		const el = document.getElementById("imp-progress");
		if (el) el.textContent = `${done} / ${total}`;
	};

	window.showImportDoneToast = function ({
		inserted = 0,
		updated = 0,
		skipped = 0,
	} = {}) {
		return window.showNotif({
			icon: "success",
			title: "Import selesai",
			html: `Insert: <b>${inserted}</b>, Update: <b>${updated}</b>, Skip: <b>${skipped}</b>`,
			toast: true,
			position: "center",
			timer: 2800,
			showConfirmButton: false,
			size: "xs",
		});
	};
})();
