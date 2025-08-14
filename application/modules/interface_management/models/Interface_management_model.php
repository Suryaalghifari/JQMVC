<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Interface_management_model extends CI_Model
{
    // Ambil semua data
    public function get_all()
    {
        return $this->db->get('telkom_ref_service')->result_array();
    }

    // Insert data baru
    public function insert($data)
    {
        unset($data['id']);

        // Pastikan Capacity numerik (bisa null jika tidak ada)
        $data['Capacity'] = isset($data['Capacity']) && is_numeric($data['Capacity']) ? floatval($data['Capacity']) : null;

        $allowed = [
            'peering',
            'location',
            'interface',
            'pop',
            'rrd_path',
            'rrd_alias',
            'rrd_status',
            'Capacity',
            'service'
        ];

        $insertData = array_intersect_key($data, array_flip($allowed));
        $this->db->insert('telkom_ref_service', $insertData);
        return $this->db->insert_id();
    }

    // Update data
    public function update($id, $data)
    {
        unset($data['id']);

        $data['Capacity'] = isset($data['Capacity']) && is_numeric($data['Capacity']) ? floatval($data['Capacity']) : null;

        $allowed = [
            'peering',
            'location',
            'interface',
            'pop',
            'rrd_path',
            'rrd_alias',
            'rrd_status',
            'Capacity',
            'service'
        ];

        $updateData = array_intersect_key($data, array_flip($allowed));
        $this->db->where('id', $id);
        return $this->db->update('telkom_ref_service', $updateData);
    }

    // Hapus data
    public function delete($id)
    {
        $this->db->where('id', $id);
        return $this->db->delete('telkom_ref_service');
    }

    public function get_by_id($id) 
    {
        return $this->db->get_where('telkom_ref_service', ['id' => $id])->row_array();
    }

    public function bulk_import_with_pop(array $rows)
    {
        $inserted = 0; $updated = 0; $skipped = 0; $errors = [];
        $this->db->trans_start();

        foreach ($rows as $i => $r) {
            if (empty($r['_valid'])) {
                $skipped++; $errors[] = ['i'=>$i, 'reason'=>$r['_error'] ?? 'invalid'];
                continue;
            }

            $id  = isset($r['_id']) ? (int)$r['_id'] : null;

            
            $data = $r;
            unset($data['_valid'], $data['_error'], $data['_id']);

            if ($id) {
                
                $exists = $this->db->select('id')->get_where('telkom_ref_service', ['id' => $id], 1)->row_array();
                if ($exists) {
                    $this->db->where('id', $id)->update('telkom_ref_service', $data);
                    
                    $updated += ($this->db->affected_rows() > 0) ? 1 : 0;
                    continue;
                }
                
            }
            $key = [
                'peering'   => $r['peering'],
                'location'  => $r['location'],
                'interface' => $r['interface'],
                'pop'       => $r['pop'],
            ];

            $exist = $this->db->select('id')->get_where('telkom_ref_service', $key, 1)->row_array();

            if ($exist) {
                $this->db->where('id', $exist['id'])->update('telkom_ref_service', $data);
                $updated += ($this->db->affected_rows() > 0) ? 1 : 0;
            } else {
                $this->db->insert('telkom_ref_service', $data);
                $inserted += ($this->db->affected_rows() > 0) ? 1 : 0;
            }
        }

        $this->db->trans_complete();

        return [
            'success'  => $this->db->trans_status(),
            'inserted' => $inserted,
            'updated'  => $updated,
            'skipped'  => $skipped,
            'errors'   => $errors
        ];
    }
    public function update_bulk_by_ids(array $ids, array $changes)
    {
        
        $cleanIds = [];
        foreach ($ids as $v) {
            if (is_numeric($v)) $cleanIds[] = (int)$v;
        }
        if (empty($cleanIds)) {
            return ['success' => false, 'message' => 'IDs tidak valid'];
        }

        
        $allowed = [
            'peering',
            'location',
            'interface',
            'pop',
            'rrd_path',
            'rrd_alias',
            'rrd_status',
            'Capacity',
            'service'
        ];
        $data = array_intersect_key($changes, array_flip($allowed));
        if (empty($data)) {
            return ['success' => false, 'message' => 'Tidak ada kolom valid'];
        }

        
        if (array_key_exists('Capacity', $data)) {
            $data['Capacity'] = ($data['Capacity'] === '' || $data['Capacity'] === null)
                ? null
                : (float)$data['Capacity'];
        }

        $this->db->trans_start();
        $this->db->where_in('id', $cleanIds)->update('telkom_ref_service', $data);
        $affected = $this->db->affected_rows();
        $this->db->trans_complete();

        if ($this->db->trans_status() === false) {
            return ['success' => false, 'message' => 'Transaksi gagal'];
        }

        return ['success' => true, 'updated' => $affected, 'ids' => $cleanIds];
    }


}
