<!DOCTYPE html>
<html>
<head>
    <title>JQtabels - CRUD</title>
    <link rel="icon" type="image/png" href="<?= base_url('assets/grid/images/logo.png') ?>">
    <link rel="stylesheet" href="<?= base_url('assets/grid/css/jqx.base.css') ?>">
    <link rel="stylesheet" href="<?= base_url('assets/grid/css/jqx.light.css') ?>">
    <link rel="stylesheet" href="<?= base_url('assets/grid/css/jqx.office.css') ?>">
    <link rel="stylesheet" href="<?= base_url('assets/grid/css/jqx.ui-redmond.css') ?>">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>

    <!-- jqWidgets scripts -->
    <script src="<?= base_url('assets/grid/js/jqwidgets/jqxcore.js') ?>"></script>
    <script src="<?= base_url('assets/grid/js/jqwidgets/jqxdata.js') ?>"></script>
    <script src="<?= base_url('assets/grid/js/jqwidgets/jqxbuttons.js') ?>"></script>
    <script src="<?= base_url('assets/grid/js/jqwidgets/jqxscrollbar.js') ?>"></script>
    <script src="<?= base_url('assets/grid/js/jqwidgets/jqxmenu.js') ?>"></script>
    <script src="<?= base_url('assets/grid/js/jqwidgets/jqxlistbox.js') ?>"></script>
    <script src="<?= base_url('assets/grid/js/jqwidgets/jqxdropdownlist.js') ?>"></script>
    <script src="<?= base_url('assets/grid/js/jqwidgets/jqxcheckbox.js') ?>"></script>
    <script src="<?= base_url('assets/grid/js/jqwidgets/jqxgrid.js') ?>"></script>
    <script src="<?= base_url('assets/grid/js/jqwidgets/jqxgrid.selection.js') ?>"></script>
    <script src="<?= base_url('assets/grid/js/jqwidgets/jqxgrid.columnsresize.js') ?>"></script>
    <script src="<?= base_url('assets/grid/js/jqwidgets/jqxgrid.filter.js') ?>"></script>
    <script src="<?= base_url('assets/grid/js/jqwidgets/jqxgrid.sort.js') ?>"></script>
    <script src="<?= base_url('assets/grid/js/jqwidgets/jqxgrid.pager.js') ?>"></script>
    <script src="<?= base_url('assets/grid/js/jqwidgets/jqxgrid.edit.js') ?>"></script>

    <!-- Define base_url for JS -->
    <script>
      var base_url = "<?= base_url() ?>";
    </script>

    <!-- Custom JS -->
    <script src="<?= base_url('assets/grid/js/notif/swalNotif.js') ?>"></script>
    <script src="<?= base_url('assets/grid/js/grid.js') ?>"></script>
    
</head>
<body>
    <div id="jqxgrid"</div>
</body>
</html>
