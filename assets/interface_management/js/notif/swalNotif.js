// swalNotif.js
window.showNotif = function ({
	icon = "info",
	title = "",
	text = "",
	html = "",
	timer = null,
	toast = false,
	position = "center",
	width,
	showConfirmButton,
	confirmButtonText,
}) {
	Swal.fire({
		icon,
		title,
		text,
		html,
		timer,
		toast,
		position,
		width,
		showConfirmButton,
		confirmButtonText,
		timerProgressBar: !!timer,
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
		customClass: { popup: "swal-compact" },
		preConfirm: () => {
			if (!document.getElementById("ack-del")?.checked) {
				Swal.showValidationMessage("Centang konfirmasi terlebih dulu.");
				return false;
			}
		},
	});
};

// === export helpers ===
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
	});
};

window.showLoading = function (title = "Menyiapkan file…") {
	Swal.fire({
		title,
		allowOutsideClick: false,
		allowEscapeKey: false,
		didOpen: () => Swal.showLoading(),
	});
};
