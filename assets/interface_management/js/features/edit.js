(function (IM, $) {
	IM.Edit = {
		openForSelected() {
			const G = IM.cfg.GRID;
			const sel = $(G).jqxGrid("getselectedrowindexes") || [];
			if (!sel.length) {
				showNotif({
					icon: "info",
					title: "Pilih dulu 1 baris data.",
					size: "xs",
				});
				return;
			}
			const row = $(G).jqxGrid("getrowdata", sel[0]);
			if (!row) {
				showNotif({
					icon: "error",
					title: "Baris tidak ditemukan.",
					size: "xs",
				});
				return;
			}
			IM.Edit._openForm(row);
		},

		bindRowDblClick() {
			const G = IM.cfg.GRID;
			$(G)
				.off("rowdoubleclick.IMEdit")
				.on("rowdoubleclick.IMEdit", (e) => {
					const row = $(G).jqxGrid("getrowdata", e.args.rowindex);
					if (row) IM.Edit._openForm(row);
				});
		},

		async _openForm(row) {
			const html = `
        <style>
          .fwrap{font-size:13px}
          .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
          .fi{display:flex;flex-direction:column;gap:6px}
          .fi label{font-weight:600;color:#374151}
          .fi .req::after{content:" *"; color:#ef4444}
          .fi input{border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;font-size:14px;outline:none}
          .fi input:focus{border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.15)}
          .full{grid-column:1 / -1}
        </style>
        <div class="fwrap">
          <div class="grid2">
            <div class="fi">
              <label class="req">Peering</label>
              <input id="f-peering" placeholder="cth: GOOGLE" value="${
								row.peering || ""
							}">
            </div>
            <div class="fi">
              <label class="req">Location</label>
              <input id="f-location" placeholder="cth: JAKARTA" value="${
								row.location || ""
							}">
            </div>

            <div class="fi full">
              <label class="req">Interface</label>
              <input id="f-interface" placeholder="Nama interface" value="${
								row.interface || ""
							}">
            </div>

            <div class="fi">
              <label class="req">POP</label>
              <input id="f-pop" placeholder="cth: JKT" value="${
								row.pop_site || ""
							}">
            </div>
            <div class="fi">
              <label>Capacity</label>
              <input id="f-cap" inputmode="numeric" placeholder="angka, optional" value="${
								row.Capacity ?? ""
							}">
            </div>

            <div class="fi">
              <label>Service</label>
              <input id="f-service" placeholder="service" value="${
								row.service || ""
							}">
            </div>
            <div class="fi">
              <label>RRD Status</label>
              <input id="f-rrdstatus" placeholder="Avail / Unavail" value="${
								row.rrd_status || ""
							}">
            </div>

            <div class="fi full">
              <label>RRD Path</label>
              <input id="f-rrdpath" placeholder="/path/..." value="${
								row.rrd_path || ""
							}">
            </div>
            <div class="fi full">
              <label>RRD Alias</label>
              <input id="f-rrdalias" placeholder="alias" value="${
								row.rrd_alias || ""
							}">
            </div>
          </div>
        </div>
      `;

			const { isConfirmed, value } = await Swal.fire({
				title: "Edit Baris",
				html,
				focusConfirm: false,
				showCancelButton: true,
				confirmButtonText: "Simpan",
				cancelButtonText: "Batal",
				customClass: { popup: "swal-sm swal-compact" },
				preConfirm: () => {
					const g = (id) => Swal.getPopup().querySelector(id).value.trim();
					const data = {
						peering: g("#f-peering"),
						location: g("#f-location"),
						interface: g("#f-interface"),
						pop_site: g("#f-pop"),
						rrd_path: g("#f-rrdpath") || null,
						rrd_alias: g("#f-rrdalias") || null,
						rrd_status: g("#f-rrdstatus") || null,
						service: g("#f-service") || null,
						Capacity: (function (v) {
							if (v === "") return null;
							const n = Number(String(v).replace(/[^\d.-]/g, ""));
							return isNaN(n) ? "NaN" : n;
						})(g("#f-cap")),
					};

					const miss = ["peering", "location", "interface", "pop_site"].filter(
						(k) => !data[k]
					);
					if (miss.length) {
						Swal.showValidationMessage(
							"Field wajib: Peering, Location, Interface, POP."
						);
						return false;
					}
					if (data.Capacity === "NaN") {
						Swal.showValidationMessage("Capacity harus angka.");
						return false;
					}
					return data;
				},
			});

			if (!isConfirmed) return;

			const payload = {
				peering: value.peering,
				location: value.location,
				interface: value.interface,
				pop: value.pop_site,
				rrd_path: value.rrd_path,
				rrd_alias: value.rrd_alias,
				rrd_status: value.rrd_status,
				Capacity: value.Capacity,
				service: value.service,
			};

			showLoading("Menyimpan…", "xs");
			try {
				const res = await IM.api.update(row.id, payload);
				Swal.close();
				if (res && res.success) {
					showNotif({
						icon: "success",
						title: "Berhasil",
						text: "Baris diperbarui.",
						size: "xs",
						toast: true,
						position: "top-end",
						timer: 1800,
						showConfirmButton: false,
					});

					$(IM.cfg.GRID).jqxGrid("updatebounddata");
				} else {
					showNotif({
						icon: "error",
						title: "Gagal menyimpan",
						text: (res && res.message) || "Unknown error",
						size: "xs",
					});
				}
			} catch (err) {
				Swal.close();
				const msg =
					err && err.responseJSON && err.responseJSON.message
						? err.responseJSON.message
						: String(err);
				showNotif({ icon: "error", title: "Error", text: msg, size: "xs" });
			}
		},
	};
})(window.IM, jQuery);
