// File: swalNotif.js (import di semua halaman yang perlu notifikasi)
window.showNotif = function ({
	icon = "info",
	title = "",
	text = "",
	html = "",
	timer = null, // null artinya tidak auto-close
	toast = false,
	position = "center",
	width = undefined,
	showConfirmButton = undefined, // undefined = default Swal (modal: true, toast: false)
	confirmButtonText = undefined, // undefined = default Swal
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
		timerProgressBar: !!timer, // aktif jika pakai timer
	});
};
