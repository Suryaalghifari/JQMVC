<!DOCTYPE html>
<html>
<head>
    <title>JQtabels - CRUD</title>
    <link rel="icon" type="image/png" href="<?= base_url('assets/grid/images/logo.png') ?>">
    <link rel="stylesheet" href="<?= base_url('assets/grid/css/jqx.base.css') ?>">
    <link rel="stylesheet" href="<?= base_url('assets/grid/css/jqx.office.css') ?>">
    <link rel="stylesheet" href="<?= base_url('assets/css/grid-custom.css') ?>"> 
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

<body style="background:#f6f8fb">
  <div class="page-wrap">

    <div class="cards">
      <div class="card kpi" id="card-rrd-aktif">
        <div class="kpi-title">RRD Aktif</div>
        <div class="kpi-value text-green" id="kpi-rrd-aktif">0</div>
        <div class="kpi-sub">Status = Available</div>
      </div>
      <div class="card kpi" id="card-rrd-nonaktif">
        <div class="kpi-title">RRD Non Aktif</div>
        <div class="kpi-value text-orange" id="kpi-rrd-nonaktif">0</div>
        <div class="kpi-sub">Status = Non Available</div>
      </div>
      <div class="card kpi" id="card-mrtg-on">
          <div class="kpi-title">MRTG On Air</div>
          <div class="kpi-value text-green" id="kpi-mrtg-on">0</div>
          <div class="kpi-sub">Sedang menyala</div>
        </div>
        <div class="card kpi" id="card-mrtg-off">
          <div class="kpi-title">MRTG Off Air</div>
          <div class="kpi-value text-orange" id="kpi-mrtg-off">0</div>
          <div class="kpi-sub">Sedang mati</div>
        </div>
    </div>

    <div class="grid-card">
      <div class="grid-header">
        <div>
          <h3>Data</h3>
          <span class="muted">Kelola informasi</span>
        </div>
        <div class="grid-tools">
          <div class="search">
            <i class="bi bi-search"></i>
            <input id="globalSearch" type="text" placeholder="Cari data..." />
          </div>
          <button id="btnAdd" class="btn-primary"><i class="bi bi-plus-lg"></i> Tambah Data</button>
          <button id="btnDelete" class="btn-danger"><i class="bi bi-trash"></i> Hapus Data</button>
          <button id="btnRefresh" class="btn-secondary"><i class="bi bi-arrow-clockwise"></i> Refresh</button>

        </div>
      </div>
      
        <div id="jqxgrid"></div>
      
    </div>

  </div>
</body>


</html>
