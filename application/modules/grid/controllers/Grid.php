<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Grid extends MX_Controller
{
    public function index()
    {
        // Cek apakah bisa load view
        $this->load->view('grid_view');
    }
}
