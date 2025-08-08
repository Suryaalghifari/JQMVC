<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * @property Output $output
 * @property CI_Input $input
 * @property Grid_model $Grid_model
 */
class Grid_api extends MX_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('Grid_model');  // Model sesuai file di models/Grid_model.php
    }

    // GET: Ambil semua data
    public function services_get()
    {
        $data = $this->Grid_model->get_all();

        foreach ($data as &$row) {
            $row['pop_site'] = isset($row['pop']) ? $row['pop'] : null;
            unset($row['pop']);
        }
        unset($row);

        $this->output
            ->set_content_type('application/json')
            ->set_output(json_encode($data));
    }

    // POST: Tambah data baru
    public function services_add()
    {
        $data = $this->input->post();

        // Jika pakai pop_site
        if (isset($data['pop_site'])) {
            $data['pop'] = $data['pop_site'];
            unset($data['pop_site']);
        }

        // Validasi WAJIB isi
        $wajib = ['peering', 'location', 'interface', 'pop'];
        $errors = [];
        foreach ($wajib as $field) {
            if (empty($data[$field])) {
                $errors[] = ucfirst($field) . ' wajib diisi';
            }
        }

        if (!empty($errors)) {
            echo json_encode([
                'success' => false,
                'message' => implode(', ', $errors)
            ]);
            return;
        }

        $id = $this->Grid_model->insert($data);
        if ($id) {
            echo json_encode(['success' => true, 'id' => $id]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal insert data']);
        }
    }


    // PUT: Update data by ID
    public function services_update($id = null)
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID wajib ada']);
            return;
        }

        if (!$data || !is_array($data)) {
            echo json_encode(['success' => false, 'message' => 'Data kosong, tidak ada yang diupdate']);
            return;
        }

        if (isset($data['pop_site'])) {
            $data['pop'] = $data['pop_site'];
            unset($data['pop_site']);
        }

        $updated = $this->Grid_model->update($id, $data);
        if ($updated) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal update data']);
        }
    }

    // DELETE: Hapus data by ID
    public function services_delete($id = null)
    {
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID wajib ada']);
            return;
        }
        $deleted = $this->Grid_model->delete($id);
        if ($deleted) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal hapus data']);
        }
    }

    // GET by ID: Untuk directory
    public function services_directory($id = null)
    {
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID wajib ada']);
            return;
        }
        $data = $this->Grid_model->get_by_id($id);
        if ($data && !empty($data['rrd_path'])) {
            echo json_encode([
                'success' => true,
                'rrd_path' => $data['rrd_path'],
                'rrd_alias' => $data['rrd_alias'],
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Directory tidak ditemukan']);
        }
    }
}
