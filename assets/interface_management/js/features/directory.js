(function (IM, $) {
	IM.Directory = {
		show(id) {
			IM.api
				.directory(id)
				.done(function (response) {
					if (response.success && response.rrd_path) {
						showNotif({
							icon: "info",
							title: "Path Directory",
							html: `
                <ul style="text-align:center; list-style:none; padding-left:0;">
                  <li><strong>RRD Path:</strong><br/><code>${response.rrd_path}</code></li>
                </ul>`,
							width: 400,
							position: "center",
							showConfirmButton: true,
							confirmButtonText: "Tutup",
							timer: null,
						});
					} else {
						showNotif({
							icon: "warning",
							title: "Tidak ada directory/aksi untuk produk ini.",
							position: "center",
							width: 350,
							showConfirmButton: true,
							confirmButtonText: "Tutup",
							timer: null,
						});
					}
				})
				.fail(function () {
					showNotif({
						icon: "error",
						title: "Gagal ambil directory dari server.",
						position: "center",
						width: 350,
						showConfirmButton: true,
						confirmButtonText: "Tutup",
						timer: null,
					});
				});
		},
		wire() {
			$(document).on("click", ".btn-directory", function (e) {
				e.preventDefault();
				e.stopPropagation();
				IM.Directory.show($(this).data("id"));
			});

			window.showDirectoryPopup = IM.Directory.show;
		},
	};
})(window.IM, jQuery);
